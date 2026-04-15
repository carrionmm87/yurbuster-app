const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('\n📽️ Videos en la BD:\n');
  
  const videos = await prisma.video.findMany({
    include: { uploader: true }
  });

  if (videos.length === 0) {
    console.log('❌ No hay videos en la BD');
  } else {
    videos.forEach(v => {
      console.log(`✅ ${v.title}`);
      console.log(`   Subido por: ${v.uploader.username}`);
      console.log(`   Precio: ${v.price} CLP`);
      console.log(`   ID: ${v.id}\n`);
    });
  }

  // Check specific creator
  const gatadolceVideos = await prisma.video.findMany({
    where: { 
      uploader: { username: 'gatadolce' }
    },
    include: { uploader: true }
  });

  console.log(`📊 Videos de gatadolce: ${gatadolceVideos.length}`);

  await prisma.$disconnect();
}

check().catch(console.error);
