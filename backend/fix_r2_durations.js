const { PrismaClient } = require('@prisma/client');
const ffmpeg = require('fluent-ffmpeg');
const storageService = require('./storage.service');
const prisma = new PrismaClient();

async function main() {
  console.log('--- INICIANDO REPARACIÓN CLOUD (R2) ---');
  
  const videos = await prisma.video.findMany({
    where: { OR: [{ duration: null }, { duration: '' }] }
  });

  console.log('Se encontraron ' + videos.length + ' videos en la nube para procesar.');

  for (const v of videos) {
    try {
      console.log('Procesando: ' + v.title + '...');
      
      // Obtenemos una URL temporal de R2 para que ffprobe pueda leer el archivo
      const videoUrl = await storageService.getFileUrl(v.filename, 'video');
      
      if (!videoUrl) {
        console.log('❌ No se pudo obtener la URL de R2 para ' + v.title);
        continue;
      }

      await new Promise((resolve) => {
        ffmpeg.ffprobe(videoUrl, async (err, metadata) => {
          if (!err && metadata && metadata.format.duration) {
            const seconds = Math.floor(metadata.format.duration);
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            const label = m + ':' + s.toString().padStart(2, '0');
            
            await prisma.video.update({
              where: { id: v.id },
              data: { duration: label }
            });
            console.log('✅ EXITO: ' + v.title + ' -> ' + label);
          } else {
            console.log('❌ Error al medir con ffprobe: ' + (err ? err.message : 'Metadatos vacios'));
          }
          resolve();
        });
      });
    } catch (e) {
      console.log('❌ Error critico en ' + v.title + ': ' + e.message);
    }
  }

  console.log('--- REPARACIÓN CLOUD FINALIZADA ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
