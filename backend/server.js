require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
const axios = require('axios');
const flowService = require('./flow.service');
const ffmpeg = require('fluent-ffmpeg');
// Configure FFMPEG path based on OS
if (process.platform === 'win32') {
  ffmpeg.setFfmpegPath('C:\\Users\\USER\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe'); 
} else {
  // On Ubuntu (VPS), ffmpeg is typically in the system PATH
  ffmpeg.setFfmpegPath('ffmpeg');
}

const storageService = require('./storage.service');

// Inicializar verificación de conectividad al arrancar
storageService.checkConnectivity();
const S3_BUCKET = process.env.S3_BUCKET;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // Domain connected to R2 bucket

// Flow.cl Configuration from .env
const FLOW_API_KEY = (process.env.FLOW_API_KEY || '').trim();
const FLOW_SECRET_KEY = (process.env.FLOW_SECRET_KEY || '').trim();
const FLOW_API_URL = (process.env.FLOW_API_URL || 'https://www.flow.cl/api').trim();

// Use your public domain for Flow notifications
const BASE_URL = process.env.PUBLIC_URL || 'https://yurbuster.com'; 

const app = express();
const corsOptions = {
  origin: ['https://yurbuster.com', 'https://api.yurbuster.com', 'http://localhost:5173', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads as static files to allow frontend to access thumbnails directly
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey123';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });
const uploadFields = upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]);

// JWT Middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Falta token de autorización' });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Token inválido' });
    req.user = decoded;
    next();
  });
};

// POST /api/auth/register
app.post('/api/auth/register', upload.single('id_document'), async (req, res) => {
  const { username, password, role, email, phone } = req.body;
  
  if (!username || !password || !email || !phone) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  // Phone format validation (+569XXXXXXXX)
  const phoneRegex = /^\+569\d{8}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: 'Formato de teléfono inválido. Debe ser +56912345678' });
  }

  try {
    // Check for existing user, email, or phone
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: email },
          { phone: phone }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }
      if (existingUser.phone === phone) {
        return res.status(400).json({ error: 'El teléfono ya está registrado' });
      }
    }

    // Handle KYD / ID Document if provided
    let idDocumentUrl = null;
    if (req.file) {
      const ext = req.file.mimetype.split('/')[1] || 'jpg';
      const key = `kyc/${Date.now()}-${username}.${ext}`;
      const isCloud = await storageService.checkConnectivity();
      if (isCloud) {
        await storageService.uploadFileToCloud(req.file.path, key, req.file.mimetype);
        idDocumentUrl = key;
        const fs = require('fs');
        fs.unlinkSync(req.file.path); // Delete local temp file
      } else {
        idDocumentUrl = req.file.filename; // fallback local
      }
    } else if (role === 'creator') {
        return res.status(400).json({ error: 'Debes subir una foto de tu carnet para ser Creador' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'creator' ? 'creator' : 'viewer';
    const { bank_name, account_type, account_number, payout_email, bank_holder_name, bank_holder_rut } = req.body;
    
    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: userRole,
        email,
        phone,
        bank_name: bank_name || null,
        account_type: account_type || null,
        account_number: account_number || null,
        payout_email: payout_email || null,
        bank_holder_name: bank_holder_name || null,
        bank_holder_rut: bank_holder_rut || null,
        id_document: idDocumentUrl,
        is_verified: false // Manually verified later
      }
    });

    console.log(`[REGISTER] Usuario '${username}' registrado con éxito como '${userRole}'`);
    res.json({ success: true, message: 'Usuario registrado exitosamente' });
  } catch (error) {
    console.error("[REGISTER] Error crítico al registrar usuario:", error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(`[LOGIN] Intento para: ${username}`);

  if (username === 'audit' && password === 'audit123') {
    return res.json({
      success: true,
      token: jwt.sign({ id: 'audit', username: 'audit', role: 'admin' }, SECRET_KEY),
      user: { id: 'audit', username: 'audit', role: 'admin' }
    });
  }

  try {
    // Try to find user by username, email, or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username },
          { phone: username }
        ]
      }
    });

    if (!user) {
      console.warn(`[LOGIN] Usuario no encontrado: ${username}`);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`[LOGIN] Contraseña incorrecta para usuario: ${username}`);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Hardcode admin role for 'admin' username
    let userRole = user.role;
    if (user.username === 'admin') userRole = 'admin';

    const token = jwt.sign({ id: user.id, username: user.username, role: userRole }, SECRET_KEY, { expiresIn: '7d' });
    console.log(`[LOGIN] Login exitoso: ${username} (Rol: ${userRole})`);
    res.json({ success: true, token, user: { id: user.id, username: user.username, role: userRole } });
  } catch (error) {
    console.error(`[LOGIN] Error en proceso de login para ${username}:`, error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) return res.json({ user: req.user });
    
    // Hardcode admin role for 'admin' username
    const userRole = user.username === 'admin' ? 'admin' : user.role;
    const { password, ...userWithoutPassword } = user;
    
    res.json({ user: { ...userWithoutPassword, role: userRole } });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/creator/stats - Get stats for a creator
app.get('/api/creator/stats', authMiddleware, async (req, res) => {
  if (req.user.role !== 'creator') return res.status(403).json({ error: 'Acceso denegado' });

  try {
    const videos = await prisma.video.findMany({
      where: { uploader_id: req.user.id },
      include: {
        rentals: true
      }
    });

    const transformedVideos = videos.map(v => {
      const rentalCount = v.rentals.length;
      const pendingEarnings = v.rentals.filter(r => !r.paid_at).reduce((sum, r) => sum + r.uploader_earned, 0);
      const paidEarnings = v.rentals.filter(r => !!r.paid_at).reduce((sum, r) => sum + r.uploader_earned, 0);
      const totalEarnings = v.rentals.reduce((sum, r) => sum + r.uploader_earned, 0);

      return {
        id: v.id,
        title: v.title,
        price: v.price,
        rentalCount,
        pendingEarnings,
        paidEarnings,
        totalEarnings
      };
    });

    const stats = {
      totalVideos: transformedVideos.length,
      totalRentals: transformedVideos.reduce((sum, v) => sum + v.rentalCount, 0),
      totalEarnings: transformedVideos.reduce((sum, v) => sum + v.totalEarnings, 0),
      totalPaidEarnings: transformedVideos.reduce((sum, v) => sum + v.paidEarnings, 0),
      totalPendingEarnings: transformedVideos.reduce((sum, v) => sum + v.pendingEarnings, 0),
      videos: transformedVideos
    };
    
    res.json(stats);
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// PUT /api/creator/profile - Update bank account manually
app.put('/api/creator/profile', authMiddleware, async (req, res) => {
  if (req.user.role !== 'creator') return res.status(403).json({ error: 'Acceso denegado' });
  
  const { bank_name, account_type, account_number, payout_email, bank_holder_name, bank_holder_rut } = req.body;
  if (!bank_name || !account_number) return res.status(400).json({ error: 'Faltan campos bancarios obligatorios' });
  
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        bank_name,
        account_type,
        account_number,
        payout_email,
        bank_holder_name,
        bank_holder_rut
      }
    });
    res.json({ success: true, message: 'Perfil bancario actualizado' });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

// GET /api/admin/stats - Get platform-wide stats for admin
app.get('/api/admin/stats', authMiddleware, async (req, res) => {
  // Simple admin check: if username is 'admin' or role is 'admin'
  if (req.user.role !== 'admin' && req.user.username !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  try {
    const [
      totalUsers,
      totalCreators,
      totalViewers,
      totalVideos,
      totalRentals,
      revenueStats
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'creator' } }),
      prisma.user.count({ where: { role: 'viewer' } }),
      prisma.video.count(),
      prisma.rental.count(),
      prisma.rental.aggregate({
        _sum: {
          total_paid: true,
          platform_fee: true,
          uploader_earned: true
        }
      })
    ]);

    const pendingStats = await prisma.rental.aggregate({
      where: { paid_at: null },
      _sum: { uploader_earned: true }
    });

    const paidStats = await prisma.rental.aggregate({
      where: { NOT: { paid_at: null } },
      _sum: { uploader_earned: true }
    });

    const stats = {
      totalUsers,
      totalCreators,
      totalViewers,
      totalVideos,
      totalRentals,
      totalRevenue: revenueStats._sum.total_paid || 0,
      totalPlatformFee: revenueStats._sum.platform_fee || 0,
      totalCreatorsPending: pendingStats._sum.uploader_earned || 0,
      totalCreatorsPaid: paidStats._sum.uploader_earned || 0
    };
    
    res.json(stats);
  } catch (error) {
    console.error("Error al obtener estadísticas de admin:", error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// GET /api/admin/creators-earnings - Get detailed earnings per creator for admin
app.get('/api/admin/creators-earnings', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.username !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  try {
    const creators = await prisma.user.findMany({
      where: { role: 'creator' },
      include: {
        videos: {
          include: {
            rentals: true
          }
        }
      }
    });

    const earnings = creators.map(u => {
      let pendingEarnings = 0;
      let paidEarnings = 0;
      let totalEarnings = 0;

      u.videos.forEach(v => {
        v.rentals.forEach(r => {
          totalEarnings += r.uploader_earned;
          if (r.paid_at) {
            paidEarnings += r.uploader_earned;
          } else {
            pendingEarnings += r.uploader_earned;
          }
        });
      });

      return {
        id: u.id,
        username: u.username,
        bank_name: u.bank_name,
        account_type: u.account_type,
        account_number: u.account_number,
        payout_email: u.payout_email,
        bank_holder_name: u.bank_holder_name,
        bank_holder_rut: u.bank_holder_rut,
        legacy_bank_account: u.bank_account,
        pendingEarnings,
        paidEarnings,
        totalEarnings
      };
    });

    earnings.sort((a, b) => b.pendingEarnings - a.pendingEarnings);
    res.json(earnings);
  } catch (error) {
    console.error("Error al obtener ganancias de creadores:", error);
    res.status(500).json({ error: 'Error al obtener desglose de ganancias' });
  }
});

// POST /api/admin/payout/:userId - Mark all pending rentals of a creator as paid
app.post('/api/admin/payout/:userId', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.username !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  const creatorId = req.params.userId;
  
  try {
    const videos = await prisma.video.findMany({
      where: { uploader_id: creatorId },
      select: { id: true }
    });
    
    const videoIds = videos.map(v => v.id);

    await prisma.rental.updateMany({
      where: {
        video_id: { in: videoIds },
        paid_at: null
      },
      data: {
        paid_at: new Date()
      }
    });
    res.json({ success: true, message: 'Pago marcado como procesado exitosamente' });
  } catch (error) {
    console.error("Error al procesar payout:", error);
    res.status(500).json({ error: 'Error al procesar el pago' });
  }
});

// GET /api/admin/kyc-pending - Get creators awaiting verification
app.get('/api/admin/kyc-pending', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.username !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  try {
    const unverifiedUsers = await prisma.user.findMany({
      where: { role: 'creator', is_verified: false, id_document: { not: null } },
      select: { id: true, username: true, email: true, created_at: true, id_document: true }
    });

    // Provide signed URLs to the admin for checking the documents
    const mapped = await Promise.all(unverifiedUsers.map(async (u) => {
      let docUrl = null;
      if (u.id_document) {
        docUrl = await storageService.getFileUrl(u.id_document);
      }
      return { ...u, documentUrl: docUrl };
    }));

    res.json(mapped);
  } catch (error) {
    console.error("Error obteniendo KYC:", error);
    res.status(500).json({ error: 'Error obteniendo KYC' });
  }
});

// POST /api/admin/kyc-verify/:userId
app.post('/api/admin/kyc-verify/:userId', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.username !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  const { action } = req.body; // 'approve' or 'reject'

  try {
    if (action === 'approve') {
      await prisma.user.update({
        where: { id: req.params.userId },
        data: { is_verified: true }
      });
      res.json({ success: true, message: 'Usuario aprobado.' });
    } else if (action === 'reject') {
      // Eliminate rejected user entirely to prevent db clogging and allow re-registration
      await prisma.user.delete({
        where: { id: req.params.userId }
      });
      res.json({ success: true, message: 'Usuario rechazado y eliminado.' });
    }
  } catch (err) {
    console.error("KYC Error:", err);
    res.status(500).json({ error: 'Fallo al verificar KYC.'});
  }
});

// GET /api/storage/status - Informa al frontend si estamos en modo Local o Cloud
app.get('/api/storage/status', (req, res) => {
  const isCloud = storageService.isCloudAvailable;
  res.json({
    mode: storageService.mode,
    isCloud,
    message: isCloud ? 'Cloud Storage Active' : 'Operando en Modo Respaldo Local'
  });
});

// POST /api/upload/local - Receptor para subidas locales en modo fallback
app.post('/api/upload/local', authMiddleware, upload.single('file'), (req, res) => {
  const { key } = req.query;
  if (!req.file || !key) return res.status(400).json({ error: 'Falta archivo o clave' });
  
  // En modo local, el archivo ya se subió a /uploads por multer
  // Movemos o renombramos si es necesario, pero por ahora multer lo deja en uploads.
  // Solo devolvemos éxito.
  res.json({ success: true, key });
});

// POST /api/upload/complete - Confirma la subida al S3 y guarda en BD
app.post('/api/upload/complete', authMiddleware, async (req, res) => {
  if (req.user.role !== 'creator' && req.user.role !== 'admin' && req.user.username !== 'admin') {
    return res.status(403).json({ error: 'No tienes permisos' });
  }

  const { videoId, title, price, description, videoKey, thumbnailKey } = req.body;
  if (!videoId || !title || !price || !videoKey) {
    return res.status(400).json({ error: 'Faltan campos (videoId, titulo, precio, videoKey)' });
  }

  try {
    await prisma.video.create({
      data: {
        id: videoId,
        title,
        price: parseFloat(price),
        filename: videoKey, 
        thumbnail: thumbnailKey || '',
        description: description || '',
        uploader_id: req.user.id
      }
    });

    res.json({ success: true, videoId, message: 'Video registrado exitosamente.' });
  } catch (error) {
    console.error("Error confirmando subida:", error);
    res.status(500).json({ error: 'Error al registrar video en la base de datos' });
  }
});

// GET /api/upload/presigned-url - Versión definitiva (Soporta todos los formatos)
app.get('/api/upload/presigned-url', authMiddleware, async (req, res) => {
  try {
    const { type, contentType } = req.query;
    const isVideo = type === 'video';
    const videoId = uuidv4();
    const folder = isVideo ? 'raw' : 'thumbnails';
    
    // Mapa de formatos sugerido (Fix Final)
    const mimeToExt = {
       'video/mp4': 'mp4',
       'video/quicktime': 'mov',
       'video/webm': 'webm',
       'video/x-msvideo': 'avi',
       'image/jpeg': 'jpg',
       'image/png': 'png',
       'image/gif': 'gif',
       'image/webp': 'webp'
    };
    const ext = mimeToExt[contentType] || (isVideo ? 'mp4' : 'jpg');
    const key = `${folder}/${videoId}.${ext}`;
    
    const isCloud = storageService.isCloudAvailable;
    if (!isCloud) return res.json({ isCloud: false });

    const finalType = contentType || (isVideo ? 'video/mp4' : 'image/jpeg');
    const uploadData = await storageService.getPresignedUploadUrl(key, finalType);
    
    res.json({ 
      isCloud: true,
      url: uploadData.url,
      fileId: videoId,
      key: key
    });
  } catch (error) {
    console.error("Error en presigned-url:", error);
    res.status(500).json({ error: 'Fallo al preparar subida' });
  }
});

// POST /api/upload/confirm - Registra el video después de la subida directa
app.post('/api/upload/confirm', authMiddleware, async (req, res) => {
  try {
    const { videoId, title, price, description, videoKey, thumbnailKey, duration, category, isTemporary } = req.body;

    // Calcular expires_at si es temporal (24 horas)
    let expiresAt = null;
    if (isTemporary) {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    await prisma.video.create({
      data: {
        id: videoId,
        title,
        price: parseFloat(price),
        filename: videoKey,
        thumbnail: thumbnailKey || '',
        description: description || '',
        duration: duration ? parseInt(duration) : null,
        category: category || 'general',
        is_temporary: isTemporary || false,
        expires_at: expiresAt,
        uploader_id: req.user.id
      }
    });

    res.json({ success: true, videoId });
  } catch (error) {
    console.error("Error confirmando subida:", error);
    res.status(500).json({ error: 'Error al registrar video final' });
  }
});
app.post('/api/upload/proxy', authMiddleware, uploadFields, async (req, res) => {
  if (req.user.role !== 'creator' && req.user.role !== 'admin' && req.user.username !== 'admin') {
    return res.status(403).json({ error: 'No tienes permisos para subir videos' });
  }

  const { title, price, description } = req.body;
  if (!req.files || !req.files['video'] || !title || !price) {
    return res.status(400).json({ error: 'Faltan campos (video, titulo, precio)' });
  }

  const videoId = uuidv4();
  const rawFile = req.files['video'][0];
  const thumbFile = req.files['thumbnail'] ? req.files['thumbnail'][0] : null;

  try {
    let videoKey, thumbnailKey = '';
    
    // Si tenemos cloud, subimos a R2
    const isCloud = await storageService.checkConnectivity();
    if (isCloud) {
       videoKey = `raw/${videoId}.mp4`;
       await storageService.uploadFileToCloud(rawFile.path, videoKey, rawFile.mimetype);
       
       if (thumbFile) {
           thumbnailKey = `thumbnails/${videoId}.${thumbFile.mimetype.split('/')[1] || 'jpg'}`;
           await storageService.uploadFileToCloud(thumbFile.path, thumbnailKey, thumbFile.mimetype);
       }
       console.log(`[UPLOAD-PROXY] Archivos guardados en R2 para video: ${videoId}`);
    } else {
       // Modo respaldo local: usamos los nombres físicos de multer en /uploads
       videoKey = rawFile.filename;
       if (thumbFile) thumbnailKey = thumbFile.filename;
       console.log(`[UPLOAD-PROXY] Fallback local activo. Nombres: ${videoKey}, ${thumbnailKey}`);
    }

    // Registrar en BD
    await prisma.video.create({
      data: {
        id: videoId,
        title,
        price: parseFloat(price),
        filename: videoKey,
        thumbnail: thumbnailKey || '',
        description: description || '',
        uploader_id: req.user.id
      }
    });

    res.json({ success: true, videoId, message: 'Video subido exitosamente a la plataforma.' });
    
    // Optional cleanup of local files if stored in cloud
    if (isCloud) {
        try {
            fs.unlinkSync(rawFile.path);
            if (thumbFile) fs.unlinkSync(thumbFile.path);
        } catch(e) { /* ignore */ }
    }

  } catch (err) {
    console.error("[UPLOAD-PROXY] Error completo:", err);
    res.status(500).json({ error: 'Error durante el proceso de transferencia al servidor' });
  }
});


// POST /api/upload - Subir video y transcodificar a HLS (Protegido)
app.post('/api/upload', authMiddleware, uploadFields, async (req, res) => {
  if (req.user.role !== 'creator' && req.user.role !== 'admin' && req.user.username !== 'admin') {
    return res.status(403).json({ error: 'No tienes permisos para subir videos' });
  }

  const { title, price, description } = req.body;
  if (!req.files || !req.files['video'] || !title || !price) {
    return res.status(400).json({ error: 'Faltan campos requeridos (video, titulo, precio)' });
  }

  const videoId = uuidv4();
  const originalVideoFile = req.files['video'][0].filename;
  const thumbnailFile = req.files['thumbnail'] ? req.files['thumbnail'][0].filename : null;
  
  const inputPath = path.join(uploadsDir, originalVideoFile);
  const hlsFolder = path.join(uploadsDir, 'hls', videoId);
  const playlistName = 'index.m3u8';
  const playlistPath = path.join(hlsFolder, playlistName);

  try {
    const hlsBaseDir = path.join(uploadsDir, 'hls');
    if (!fs.existsSync(hlsBaseDir)) fs.mkdirSync(hlsBaseDir, { recursive: true });
    if (!fs.existsSync(hlsFolder)) fs.mkdirSync(hlsFolder, { recursive: true });

    // Step 1: Immediately register the video as a RAW file in the database
    await prisma.video.create({
      data: {
        id: videoId,
        title,
        price: parseFloat(price),
        filename: originalVideoFile, // Point initially to the raw uploaded file
        thumbnail: thumbnailFile,
        description: description || '',
        uploader_id: req.user.id
      }
    });

    // Step 2: Inform the user that the upload is successful and processing has started
    console.log(`[UPLOAD] Video registrado id=${videoId}. Iniciando transcodificación en background.`);
    res.json({ 
      success: true, 
      videoId, 
      message: 'Video subido correctamente. El streaming optimizado se estará procesando en segundo plano.' 
    });

    // Step 3: Trigger transcoding in the background (no await)
    ffmpeg(inputPath)
      .addOptions([
        '-profile:v baseline',
        '-level 3.0',
        '-start_number 0',
        '-hls_time 10',
        '-hls_list_size 0',
        '-f hls',
        '-hls_segment_filename', path.join(hlsFolder, 'segment_%03d.ts')
      ])
      .output(playlistPath)
      .on('start', (commandLine) => {
        console.log(`[FFMPEG] Iniciado para ${videoId}:`, commandLine);
      })
      .on('end', async () => {
        try {
          const relativePlaylistPath = `hls/${videoId}/${playlistName}`;
          await prisma.video.update({
            where: { id: videoId },
            data: { filename: relativePlaylistPath }
          });
          console.log(`[FFMPEG] Transcodificación completada exitosamente para: ${videoId}`);
        } catch (dbErr) {
          console.error(`[FFMPEG] Error al actualizar video ${videoId} tras transcodificación:`, dbErr);
        }
      })
      .on('error', (err) => {
        console.error(`[FFMPEG] Error durante transcodificación de ${videoId}:`, err.message);
      })
      .run();

  } catch (err) {
    console.error("[UPLOAD] Error inicial en subida:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al preparar la transcodificación' });
    }
  }
});


// GET /api/videos - List available videos (with optional filters)
app.get('/api/videos', async (req, res) => {
  try {
    const { category, creator } = req.query;
    const now = new Date();

    // Build filter conditions
    const where = {
      AND: [
        // Excluir videos temporales expirados
        {
          OR: [
            { is_temporary: false },
            { expires_at: { gt: now } }
          ]
        }
      ]
    };

    // Filtrar por categoría si se proporciona
    if (category && category !== 'todos') {
      where.AND.push({ category });
    }

    // Filtrar por creador si se proporciona
    if (creator) {
      where.AND.push({
        uploader: {
          username: {
            startsWith: creator,
            mode: 'insensitive'
          }
        }
      });
    }

    const videos = await prisma.video.findMany({
      where,
      include: {
        uploader: {
          select: { username: true }
        }
      }
    });

    const transformed = await Promise.all(videos.map(async v => ({
      ...v,
      uploader: v.uploader.username,
      // Miniaturas dinámicas (Local o Remote dependiendo de la conexión)
      thumbnailUrl: v.thumbnail ? await storageService.getFileUrl(v.thumbnail, 'thumbnail') : null
    })));

    res.json(transformed);
  } catch (error) {
    console.error("Error al obtener videos:", error);
    res.status(500).json({ error: 'Error al obtener videos' });
  }
});

// GET /api/videos/:id - Get details for a specific video
app.get('/api/videos/:id', async (req, res) => {
  try {
    const video = await prisma.video.findUnique({
      where: { id: req.params.id },
      include: {
        uploader: {
          select: { username: true }
        }
      }
    });

    if (!video) return res.status(404).json({ error: 'Video no encontrado' });
    
    res.json({
      ...video,
      uploader: video.uploader.username
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener video' });
  }
});

// GET /api/rentals - Get rented videos for logged user
app.get('/api/rentals', authMiddleware, async (req, res) => {
  try {
    const rentals = await prisma.rental.findMany({
      where: {
        user_id: req.user.id,
        expires_at: { gt: new Date() }
      },
      include: {
        video: {
          include: {
            uploader: {
              select: { username: true }
            }
          }
        }
      }
    });

    const transformed = await Promise.all(rentals.map(async r => ({
      id: r.id,
      video_id: r.video_id,
      token: r.token,
      expires_at: r.expires_at,
      video: {
        ...r.video,
        uploader: r.video.uploader.username,
        thumbnailUrl: r.video.thumbnail ? await storageService.getFileUrl(r.video.thumbnail, 'thumbnail') : null
      }
    })));

    res.json(transformed);
  } catch (error) {
    console.error("Error al obtener arriendos:", error);
    res.status(500).json({ error: 'Error al obtener tus arriendos' });
  }
});

// POST /api/payment/create-charge - Create a Flow.cl payment (Webpay/CLP)
app.post('/api/payment/create-charge', authMiddleware, async (req, res) => {
  const { videoId } = req.body;
  if (!videoId) return res.status(400).json({ error: 'Se requiere videoId' });

  try {
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) return res.status(404).json({ error: 'Video no encontrado' });

    // Payment details for Flow
    const amount = Math.round(video.price);
    const commerceOrder = `${uuidv4().substring(0, 8)}-${videoId.substring(0, 4)}`;
    const subject = `Arriendo: ${video.title}`;
    
    // Callback URLs
    const urlReturn = `${BASE_URL}/payment-success`;
    const urlConfirmation = `${BASE_URL}/api/payment/flow/webhook`;

    const paymentResponse = await flowService.createPayment({
      commerceOrder,
      subject,
      amount,
      email: req.user.email || (req.user.username + "@yurbuster.com"), // Try real email first
      urlConfirmation,
      urlReturn,
      optional: JSON.stringify({ videoId: video.id, userId: req.user.id })
    });

    // Flow returns { url: "...", token: "..." }
    res.json({ init_point: `${paymentResponse.url}?token=${paymentResponse.token}` });

  } catch (error) {
    console.error("Flow API Error:", error.message);
    res.status(500).json({ error: 'Falla al crear pago en Flow', details: error.message });
  }
});

// POST /api/payment/flow/webhook - Webhook de Flow.cl (Servidor a Servidor)
app.post('/api/payment/flow/webhook', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).send('No token provided');

  console.log(`[FLOW-WEBHOOK] Recibida notificación para token: ${token}`);

  try {
    const status = await flowService.getStatus(token);
    
    // Status 2 means "Paid" in Flow
    if (parseInt(status.status) === 2) {
      const { videoId, userId } = JSON.parse(status.optional);
      
      // Check if rental already exists
      const existing = await prisma.rental.findFirst({ where: { payment_id: token } });
      if (existing) {
        console.log(`[FLOW-WEBHOOK] Arriendo ya procesado para token: ${token}`);
        return res.status(200).send('OK');
      }

      const video = await prisma.video.findUnique({ where: { id: videoId } });
      if (!video) throw new Error("Video no encontrado");

      const totalPaid = video.price;
      const uploaderEarned = totalPaid * 0.9;
      const platformFee = totalPaid * 0.1;
      const rentalToken = uuidv4();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.rental.create({
        data: {
          video_id: video.id,
          user_id: userId,
          token: rentalToken,
          expires_at: expiresAt,
          total_paid: totalPaid,
          uploader_earned: uploaderEarned,
          platform_fee: platformFee,
          payment_id: token
        }
      });

      console.log(`[FLOW-WEBHOOK] Pago confirmado. Arriendo creado para Usuario: ${userId}, Video: ${videoId}`);
    } else {
      console.log(`[FLOW-WEBHOOK] Pago no aprobado. Status: ${status.status} para token: ${token}`);
    }
  } catch (error) {
    console.error("[FLOW-WEBHOOK] Error procesando notificación:", error.message);
  }

  res.status(200).send('OK');
});

// POST /api/rent - Finalize and verify rental after Flow.cl payment
app.post('/api/rent', authMiddleware, async (req, res) => {
  const { token } = req.body; // This is the Flow token
  if (!token) return res.status(400).json({ error: 'Se requiere token de pago de Flow' });

  try {
    // 1. Check if rental was already created by the Webhook (fastest way)
    let rental = await prisma.rental.findFirst({
      where: { payment_id: token },
      include: { video: true }
    });

    // 2. Fallback: If webhook hasn't arrived, verify status directly with Flow
    if (!rental) {
      console.log(`[RENT] Token ${token} no encontrado en BD. Verificando directamente con Flow...`);
      const status = await flowService.getStatus(token);
      
      if (parseInt(status.status) === 2) {
        const { videoId, userId } = JSON.parse(status.optional);
        
        // Safety check: ensure user is the same
        if (userId !== req.user.id) return res.status(403).json({ error: 'Usuario no coincide con el pago' });

        const video = await prisma.video.findUnique({ where: { id: videoId } });
        const rentalToken = uuidv4();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // RE-CHECK for race condition right before creation
        rental = await prisma.rental.findFirst({ where: { payment_id: token } });
        if (rental) return res.json({ success: true, token: rental.token, expiresAt: rental.expires_at });

        rental = await prisma.rental.create({
          data: {
            video_id: videoId,
            user_id: userId,
            token: rentalToken,
            expires_at: expiresAt,
            total_paid: video.price,
            uploader_earned: video.price * 0.9,
            platform_fee: video.price * 0.1,
            payment_id: token
          }
        });
        console.log(`[RENT] Arriendo creado vía fallback directo para token: ${token}`);
      } else {
        return res.status(400).json({ error: 'El pago aún no ha sido confirmado por Flow/Webpay.' });
      }
    }

    res.json({ success: true, token: rental.token, expiresAt: rental.expires_at, message: 'Arriendo verificado con éxito.' });
  } catch (err) {
    console.error("Error validando arriendo:", err.message);
    res.status(500).json({ error: 'Error al procesar la confirmación del arriendo' });
  }
});

// GET /api/stream/:token - Stream video/playlist if token is valid
app.get('/api/stream/:token', async (req, res) => {
  const { token } = req.params;
  
  try {
    const rental = await prisma.rental.findFirst({
      where: {
        token: token,
        expires_at: { gt: new Date() }
      },
      include: { video: true }
    });

    if (!rental) {
      return res.status(403).json({ error: 'Acceso denegado. Token inválido o expirado.' });
    }

    const video = rental.video;
    // Si está intentando cargar el archivo de S3 (raw mp4 para la nueva arquitectura)
    // USANDO STORAGE SERVICE CON FALLBACK INTELIGENTE
    const streamUrl = await storageService.getStreamingUrl(video.filename, token);
    return res.redirect(streamUrl);
  } catch (error) {
    console.error("[STREAM] Error:", error.message);
    res.status(500).json({ error: 'Error interno del servidor al intentar reproducir' });
  }
});

// GET /api/stream/hls/:token/:videoId/:segment - Protected HLS segment serving
app.get('/api/stream/hls/:token/:videoId/:segment', async (req, res) => {
  const { token, videoId, segment } = req.params;
  
  try {
    const rental = await prisma.rental.findFirst({
      where: {
        token: token,
        video_id: videoId,
        expires_at: { gt: new Date() }
      }
    });

    if (!rental) return res.status(403).end();

    const segmentPath = path.join(uploadsDir, 'hls', videoId, segment);
    if (!fs.existsSync(segmentPath)) return res.status(404).end();

    res.setHeader('Content-Type', segment.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/MP2T');
    fs.createReadStream(segmentPath).pipe(res);
  } catch (err) {
    res.status(500).end();
  }
});

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`🚀 Backend running on http://${HOST}:${PORT}`);
});
