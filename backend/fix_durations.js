const { PrismaClient } = require('@prisma/client');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Buscando videos sin duracion ---');
  const videos = await prisma.video.findMany({
    where: { OR: [{ duration: null }, { duration: '' }] }
  });
  console.log('Se encontraron ' + videos.length + ' videos.');

  for (const v of videos) {
    const filePath = path.join(__dirname, 'uploads', v.filename);
    if (fs.existsSync(filePath)) {
      await new Promise((resolve) => {
        ffmpeg.ffprobe(filePath, async (err, metadata) => {
          if (!err && metadata && metadata.format.duration) {
            const seconds = Math.floor(metadata.format.duration);
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            const label = m + ':' + s.toString().padStart(2, '0');
            await prisma.video.update({
              where: { id: v.id },
              data: { duration: label }
            });
            console.log('Actualizado: ' + v.title + ' (' + label + ')');
          }
          resolve();
        });
      });
    }
  }
  console.log('--- Proceso finalizado ---');
}
main().catch(console.error).finally(() => prisma.$disconnect());
