const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('--- Iniciando limpieza de base de datos ---');

  try {
    // 1. Borrar Arriendos y Videos primero (por llaves foráneas)
    await prisma.rental.deleteMany({});
    console.log('✓ Arriendos eliminados');

    await prisma.video.deleteMany({});
    console.log('✓ Videos eliminados');

    // 2. Borrar todos los usuarios
    await prisma.user.deleteMany({});
    console.log('✓ Todos los usuarios eliminados');

    // 3. Crear Master e Ingrid
    const users = [
      { 
        username: 'master', 
        password: 'reyderscg87', 
        role: 'admin', 
        email: 'master@yurbuster.com',
        is_verified: true 
      },
      { 
        username: 'ingrid', 
        password: 'ingricita2129', 
        role: 'admin', 
        email: 'ingrid@yurbuster.com',
        is_verified: true 
      }
    ];

    for (const u of users) {
      const hashed = await bcrypt.hash(u.password, 10);
      await prisma.user.create({
        data: {
          username: u.username,
          password: hashed,
          role: u.role,
          email: u.email,
          is_verified: true
        }
      });
      console.log(`✓ Usuario '${u.username}' creado con éxito`);
    }

    // 4. Limpiar carpeta de uploads (opcional pero recomendado)
    const uploadsDir = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(uploadsDir, file));
        }
      }
      console.log('✓ Carpeta de uploads vaciada');
    }

  } catch (err) {
    console.error('Error durante la limpieza:', err);
  } finally {
    await prisma.$disconnect();
    console.log('--- Proceso terminado ---');
    process.exit(0);
  }
}

cleanDatabase();
