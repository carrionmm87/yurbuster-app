const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

async function clearDatabase() {
  console.log('--- [GLOBAL] Limpiando base de datos con Prisma ---');

  try {
    // Deleting rentals
    await prisma.rental.deleteMany();
    console.log('✓ Arriendos borrados');

    // Deleting videos
    await prisma.video.deleteMany();
    console.log('✓ Videos borrados');

    // Delete files in uploads
    const uploadsDir = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        if (file === '.dummy') continue;
        try {
          fs.unlinkSync(path.join(uploadsDir, file));
        } catch (e) {
          console.error(`Error al borrar ${file}:`, e.message);
        }
      }
      console.log('✓ Archivos en uploads borrados');
    }

    // Hash the new admin password
    const adminPassword = 'reyderscg87';
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

    // Keep or create admin
    const adminUser = await prisma.user.findFirst({
      where: { 
        username: { equals: 'admin', mode: 'insensitive' } 
      }
    });

    if (adminUser) {
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { 
          password: hashedAdminPassword,
          role: 'admin'
        }
      });
      console.log('✓ Usuario ADMIN actualizado.');
    } else {
      await prisma.user.create({
        data: {
          username: 'admin',
          password: hashedAdminPassword,
          role: 'admin'
        }
      });
      console.log('✓ Usuario ADMIN creado.');
    }

    // Delete all other users
    const result = await prisma.user.deleteMany({
      where: {
        NOT: {
          username: { equals: 'admin', mode: 'insensitive' }
        }
      }
    });
    console.log(`✓ ${result.count} otros usuarios eliminados.`);

  } catch (error) {
    console.error('Error durante la limpieza global:', error);
  } finally {
    await prisma.$disconnect();
    console.log('--- Proceso terminado ---');
    process.exit(0);
  }
}

clearDatabase();
