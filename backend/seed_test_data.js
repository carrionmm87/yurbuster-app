const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed de datos de prueba...");

  // 1. Crear Creador
  const hashedPassword = await bcrypt.hash('test1234', 10);
  const creator = await prisma.user.upsert({
    where: { username: 'creator_test' },
    update: {},
    create: {
      id: uuidv4(),
      username: 'creator_test',
      password: hashedPassword,
      role: 'creator',
      email: 'creator@test.com',
      phone: '+56900000001'
    }
  });
  console.log(`Creador listo: ${creator.username}`);

  // 2. Crear Video
  const video = await prisma.video.upsert({
    where: { id: 'test-video-id' },
    update: {},
    create: {
      id: 'test-video-id',
      title: 'Video de Prueba Flow',
      price: 500, // 500 CLP
      filename: 'test_video.mp4',
      thumbnail: 'https://placehold.co/600x400?text=Test+Video',
      description: 'Este es un video de prueba para validar el flujo de pago.',
      uploader_id: creator.id
    }
  });
  console.log(`Video listo: ${video.title}`);

  // 3. Crear Viewer
  const viewer = await prisma.user.upsert({
    where: { username: 'viewer_test' },
    update: {},
    create: {
      id: uuidv4(),
      username: 'viewer_test',
      password: hashedPassword,
      role: 'viewer',
      email: 'viewer@test.com',
      phone: '+56999999999'
    }
  });
  console.log(`Viewer listo: ${viewer.username}`);

  console.log("Seed completado exitosamente.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
