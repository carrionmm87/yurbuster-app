const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

// Usuarios a conservar (insensible a mayúsculas)
const KEEP_USERNAMES = ['master', 'ingrid'];

async function clearDatabase() {
  console.log('--- Limpiando base de datos ---');
  console.log(`Usuarios a conservar: ${KEEP_USERNAMES.join(', ')}`);

  try {
    // 1. Borrar todos los arriendos
    const rentalsDeleted = await prisma.rental.deleteMany();
    console.log(`✓ ${rentalsDeleted.count} arriendos borrados`);

    // 2. Borrar todos los videos de la BD
    const videosDeleted = await prisma.video.deleteMany();
    console.log(`✓ ${videosDeleted.count} videos borrados de la base de datos`);

    // 3. Borrar archivos físicos en /uploads
    const uploadsDir = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      let deletedFiles = 0;
      for (const file of files) {
        if (file === '.dummy' || file === '.gitkeep') continue;
        const filePath = path.join(uploadsDir, file);
        try {
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            // Borrar subdirectorios (ej: hls/)
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
          deletedFiles++;
        } catch (e) {
          console.error(`  ⚠ Error al borrar ${file}:`, e.message);
        }
      }
      console.log(`✓ ${deletedFiles} archivos/carpetas borrados de /uploads`);
    } else {
      console.log('  (carpeta /uploads no existe, omitiendo)');
    }

    // 4. Verificar usuarios a conservar
    console.log('\n--- Verificando usuarios a conservar ---');
    for (const name of KEEP_USERNAMES) {
      const user = await prisma.user.findFirst({
        where: { username: name }
      });
      if (user) {
        console.log(`✓ Usuario '${user.username}' encontrado (rol: ${user.role})`);
      } else {
        console.warn(`⚠ Usuario '${name}' NO encontrado en la base de datos`);
      }
    }

    // 5. Borrar todos los usuarios EXCEPTO master e ingrid
    const result = await prisma.user.deleteMany({
      where: {
        NOT: {
          username: { in: KEEP_USERNAMES }
        }
      }
    });
    console.log(`\n✓ ${result.count} otros usuarios eliminados`);

    // 6. Mostrar usuarios restantes
    const remaining = await prisma.user.findMany({
      select: { id: true, username: true, role: true, email: true }
    });
    console.log('\n--- Usuarios restantes en la BD ---');
    remaining.forEach(u => {
      console.log(`  · ${u.username} (rol: ${u.role}, email: ${u.email || 'N/A'})`);
    });

  } catch (error) {
    console.error('\n❌ Error durante la limpieza:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n--- Proceso terminado ---');
    process.exit(0);
  }
}

clearDatabase();
