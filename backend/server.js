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
const FlowApi = require('flowcl-node-api-client');
const ffmpeg = require('fluent-ffmpeg');
// Configure FFMPEG path based on OS
if (process.platform === 'win32') {
  ffmpeg.setFfmpegPath('C:\\Users\\USER\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe'); 
} else {
  // On Ubuntu (VPS), ffmpeg is typically in the system PATH
  ffmpeg.setFfmpegPath('ffmpeg');
}

const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: false // Cloudflare R2 does not need path style
});
const S3_BUCKET = process.env.S3_BUCKET;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // Domain connected to R2 bucket

const FLOW_API_KEY = (process.env.FLOW_API_KEY || '').trim();
const FLOW_SECRET_KEY = (process.env.FLOW_SECRET_KEY || '').trim();
const FLOW_API_URL = (process.env.FLOW_API_URL || 'https://sandbox.flow.cl/api').trim();

const FRONTEND_URL = 'http://localhost:5173'; 

const flow = new FlowApi({
  apiKey: FLOW_API_KEY,
  secretKey: FLOW_SECRET_KEY,
  apiURL: FLOW_API_URL
});

const app = express();
app.use(cors());
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
app.post('/api/auth/register', async (req, res) => {
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
        console.warn(`[REGISTER] El nombre de usuario '${username}' ya está en uso.`);
        return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
      }
      if (existingUser.email === email) {
        console.warn(`[REGISTER] El email '${email}' ya está registrado.`);
        return res.status(400).json({ error: 'El email ya está registrado' });
      }
      if (existingUser.phone === phone) {
        console.warn(`[REGISTER] El teléfono '${phone}' ya está registrado.`);
        return res.status(400).json({ error: 'El teléfono ya está registrado' });
      }
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
        bank_holder_rut: bank_holder_rut || null
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
  console.log(`[LOGIN] Intento de login para usuario: ${username}`);
  
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
// GET /api/upload/presigned-url - Obtiene URL firmada para subir directo a S3/R2
app.get('/api/upload/presigned-url', authMiddleware, async (req, res) => {
  if (req.user.role !== 'creator' && req.user.role !== 'admin' && req.user.username !== 'admin') {
    return res.status(403).json({ error: 'No tienes permisos para subir videos' });
  }

  try {
    const contentType = req.query.contentType || 'video/mp4';
    const videoId = uuidv4();
    const command = new PutObjectCommand({ 
      Bucket: S3_BUCKET, 
      Key: `raw/${videoId}.mp4`,
      ContentType: contentType
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    res.json({ success: true, url: signedUrl, videoId });
  } catch (error) {
    console.error("Error generando presigned URL:", error);
    res.status(500).json({ error: 'Error del servidor al generar URL de subida' });
  }
});

// POST /api/upload/complete - Confirma la subida al S3 y guarda en BD
app.post('/api/upload/complete', authMiddleware, async (req, res) => {
  if (req.user.role !== 'creator' && req.user.role !== 'admin' && req.user.username !== 'admin') {
    return res.status(403).json({ error: 'No tienes permisos' });
  }

  const { videoId, title, price, description } = req.body;
  if (!videoId || !title || !price) {
    return res.status(400).json({ error: 'Faltan campos (videoId, titulo, precio)' });
  }

  try {
    await prisma.video.create({
      data: {
        id: videoId,
        title,
        price: parseFloat(price),
        filename: `raw/${videoId}.mp4`, // Point to the S3 object key
        thumbnail: '', // Needs separate upload logic if we use S3, leaving empty for now
        description: description || '',
        uploader_id: req.user.id
      }
    });

    res.json({ success: true, videoId, message: 'Video registrado exitosamente en la BD.' });
  } catch (error) {
    console.error("Error confirmando subida:", error);
    res.status(500).json({ error: 'Error al registrar video' });
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


// GET /api/videos - List available videos
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await prisma.video.findMany({
      include: {
        uploader: {
          select: { username: true }
        }
      }
    });
    
    const transformed = videos.map(v => ({
      ...v,
      uploader: v.uploader.username
    }));
    
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

    const transformed = rentals.map(r => ({
      id: r.id,
      video_id: r.video_id,
      token: r.token,
      expires_at: r.expires_at,
      video: {
        ...r.video,
        uploader: r.video.uploader.username
      }
    }));

    res.json(transformed);
  } catch (error) {
    console.error("Error al obtener arriendos:", error);
    res.status(500).json({ error: 'Error al obtener tus arriendos' });
  }
});

// POST /api/payment/create-charge - Create a CCBill payment (PRODUCTION)
app.post('/api/payment/create-charge', authMiddleware, async (req, res) => {
  const { videoId } = req.body;
  if (!videoId) return res.status(400).json({ error: 'Se requiere videoId' });

  try {
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) return res.status(404).json({ error: 'Video no encontrado' });

    // CCBill Configuration Setup
    const clientAccnum = process.env.CCBILL_ACCOUNT || '999999';
    const clientSubacc = process.env.CCBILL_SUBACCOUNT || '0000';
    const salt = process.env.CCBILL_SALT || 'your_secure_salt_key_here';
    const currencyCode = '840'; // USD
    
    // Convertir CLP a USD o usar un precio base en USD (Ej. Asumiremos $3000 CLP = $3 USD)
    // CCBill exige precios en un formato sin decimales con las centésimas, e.g. "3.00" (o 3 USD)
    const priceInUSD = (Math.max(1, video.price / 1000)).toFixed(2);
    const formPrice = priceInUSD;
    const formPeriod = '30'; // Dias de acceso u horas en sistema regular (CCbill standard)
    const formName = 'CCBILL_DYNAMIC_FLEX_FORM_ID';

    // Construcción del Hash MD5:
    // La fórmula estándar de CCBill para Dynamic Pricing es: formPrice, formPeriod, currencyCode, salt
    const rawString = `${formPrice}${formPeriod}${currencyCode}${salt}`;
    const formDigest = crypto.createHash('md5').update(rawString).digest('hex');

    // Construcción de la URL Oficial de FlexForms
    const init_point = `https://bill.ccbill.com/jpost/signup.cgi?clientAccnum=${clientAccnum}&clientSubacc=${clientSubacc}&formName=${formName}&formPrice=${formPrice}&formPeriod=${formPeriod}&currencyCode=${currencyCode}&formDigest=${formDigest}&videoId=${videoId}&userId=${req.user.id}`;

    res.json({ init_point });

  } catch (error) {
    console.error("CCBill API Error:", error.message);
    res.status(500).json({ error: 'Falla al crear pago en CCBill', details: error.message });
  }
});

// POST /api/payment/ccbill-postback - Webhook de CCBill
app.post('/api/payment/ccbill-postback', async (req, res) => {
  // Aquí CCBill nos habla directamente desde sus servidores cuando la tarjeta es aprobada
  const { clientAccnum, clientSubacc, eventType, videoId, userId, responseDigest, subscriptionId } = req.body;

  const salt = process.env.CCBILL_SALT || 'your_secure_salt_key_here';

  // CCBill en un Approval Postback exige validar el hash de reversa
  const rawString = `${subscriptionId}1${salt}`;
  const validDigest = crypto.createHash('md5').update(rawString).digest('hex');

  if (responseDigest !== validDigest) {
    console.error(`[CCBILL] Postback Fallido: Hash Inválido para Video ${videoId}`);
    return res.status(400).send('Declined');
  }

  // Si pasa, registramos el arriendo en la Base de Datos automáticamente
  try {
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (video) {
        // En producción CCBill aprueba el arriendo de forma asíncrona.
        // Aquí almacenaríamos el arriendo. El frontend se encarga de checkearlo.
        console.log(`[CCBILL] Pago Aprobado Exitosamente vía Webhook. Video: ${videoId}`);
    }
  } catch (error) {
    console.error("[CCBILL] Error guardando arriendo en postback:", error);
  }

  res.status(200).send('OK');
});

// POST /api/rent - Confirmación temporal de 24h para UI (Protected)
app.post('/api/rent', authMiddleware, async (req, res) => {
  const { videoId, token } = req.body;
  if (!token) return res.status(400).json({ error: 'Se requiere token de pago' });

  try {
    // Aquí normalmente validarías el Webhook Approval Postback (background) o comprobarías el recibo.
    // Nosotros validaremos que el token simulado sea válido
    if (!token.startsWith('ccbill_mock_')) {
      return res.status(400).json({ error: 'El pago no ha sido validado por CCBill.' });
    }

    let actualVideoId = videoId;

    
    // Extract videoId if it's encoded in JSON-like string
    if (typeof actualVideoId === 'string' && actualVideoId.includes('videoId')) {
      try {
        const cleaned = actualVideoId.replace(/\\"/g, '"');
        const match = cleaned.match(/"videoId":"([^"]+)"/);
        if (match && match[1]) actualVideoId = match[1];
      } catch (e) { console.warn("Error parsing optional field:", e.message); }
    }

    // Check if rental already exists for this payment_id
    const existing = await prisma.rental.findFirst({ where: { payment_id: token } });
    if (existing) {
      return res.json({ success: true, token: existing.token, message: 'Arriendo ya procesado.' });
    }

    const video = await prisma.video.findUnique({ where: { id: actualVideoId } });
    if (!video) return res.status(404).json({ error: 'Video no encontrado' });

    // Finalize rental
    const totalPaid = video.price;
    const uploaderEarned = totalPaid * 0.9;
    const platformFee = totalPaid * 0.1;
    const rentalToken = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const rental = await prisma.rental.create({
      data: {
        video_id: video.id,
        user_id: req.user.id,
        token: rentalToken,
        expires_at: expiresAt,
        total_paid: totalPaid,
        uploader_earned: uploaderEarned,
        platform_fee: platformFee,
        payment_id: token
      }
    });

    res.json({ success: true, token: rentalToken, expiresAt: rental.expires_at, message: 'Arriendo exitoso.' });
  } catch (err) {
    console.error("Error validando pago con Flow:", err.message);
    return res.status(500).json({ error: 'Error al verificar estado de pago con Flow' });
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
    if (video.filename.startsWith('raw/') || video.filename.endsWith('.mp4')) {
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: video.filename
      });
      // El link es válido por 6 horas para la sesión actual
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 6 * 3600 });
      return res.redirect(signedUrl);
    }

    // Si es HLS (.m3u8), generamos el contenido dinámico para proteger los segmentos
    // O si preferimos simplicidad y el bucket es público/custom domain, redirigimos
    if (video.filename.endsWith('.m3u8')) {
      // Si usamos un dominio personalizado en R2, podemos construir la URL directamente
      if (R2_PUBLIC_URL) {
        const manifestUrl = `${R2_PUBLIC_URL}/${video.filename}`;
        return res.redirect(manifestUrl);
      }
      
      // Si no hay dominio público, usamos URLs firmadas para el manifiesto
      const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: video.filename });
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      return res.redirect(signedUrl);
    }
  } catch (error) {
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
