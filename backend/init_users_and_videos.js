const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function initializeData() {
  try {
    console.log('\n🔧 Inicializando usuarios y videos...\n');

    // Create users
    const users = [
      {
        id: '9f5bab39-8b99-49ef-a31f-1ca01657884b',
        username: 'javiera',
        email: 'javiera@yurbuster.com',
        role: 'viewer'
      },
      {
        id: '510aa64d-725f-462e-b37a-448476284478',
        username: 'gatadolce',
        email: 'gatadolce@yurbuster.com',
        role: 'viewer'
      },
      {
        id: 'a1160c37-1e18-40ac-a72b-45fc0ca6b2b2',
        username: 'donpool',
        email: 'donpool@yurbuster.com',
        role: 'viewer'
      }
    ];

    for (const user of users) {
      const existing = await prisma.user.findUnique({ where: { id: user.id } });
      if (!existing) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        await prisma.user.create({
          data: {
            ...user,
            password: hashedPassword
          }
        });
        console.log(`✅ Usuario creado: ${user.username} (${user.id})`);
      } else {
        console.log(`⏭️  Usuario ya existe: ${user.username}`);
      }
    }

    // Create videos and their creators (uploader users)
    const videoCreators = [
      {
        id: 'creator_javiera_id',
        username: 'javiera_creator',
        email: 'javiera.creator@yurbuster.com',
        role: 'creator'
      },
      {
        id: 'creator_gatadolce_id',
        username: 'gatadolce_creator',
        email: 'gatadolce.creator@yurbuster.com',
        role: 'creator'
      },
      {
        id: 'creator_donpool_id',
        username: 'donpool_creator',
        email: 'donpool.creator@yurbuster.com',
        role: 'creator'
      }
    ];

    for (const creator of videoCreators) {
      const existing = await prisma.user.findUnique({ where: { id: creator.id } });
      if (!existing) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        await prisma.user.create({
          data: {
            ...creator,
            password: hashedPassword
          }
        });
        console.log(`✅ Creador creado: ${creator.username} (${creator.id})`);
      }
    }

    // Create videos
    const videos = [
      {
        id: '849843cf-6817-4129-a12d-b9ccdcb5440',
        title: 'PENDEJO ME DA RICO!!!',
        price: 1500,
        description: 'Video exclusivo de Javiera',
        uploader_id: 'creator_javiera_id',
        category: 'exclusivo',
        is_temporary: false
      },
      {
        id: '9fd8741-8c8e-4c04-8605-d615cef3f5c8',
        title: 'Tocándome bien rico mi chochita',
        price: 1000,
        description: 'Video exclusivo de Gatadolce',
        uploader_id: 'creator_gatadolce_id',
        category: 'exclusivo',
        is_temporary: false
      }
    ];

    for (const video of videos) {
      const existing = await prisma.video.findUnique({ where: { id: video.id } });
      if (!existing) {
        await prisma.video.create({
          data: {
            ...video,
            filename: `video_${video.id}.mp4`,
            thumbnail: `thumb_${video.id}.jpg`
          }
        });
        console.log(`✅ Video creado: ${video.title} (${video.id})`);
      } else {
        console.log(`⏭️  Video ya existe: ${video.title}`);
      }
    }

    console.log('\n✅ Inicialización completada!\n');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

initializeData();
