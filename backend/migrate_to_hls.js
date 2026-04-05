const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

// Set FFmpeg path as in server.js
ffmpeg.setFfmpegPath('C:\\Users\\USER\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe');

const uploadsDir = path.join(__dirname, 'uploads');
const hlsBaseDir = path.join(uploadsDir, 'hls');

async function migrate() {
  console.log('🚀 Iniciando migración a HLS...');
  
  if (!fs.existsSync(hlsBaseDir)) {
    fs.mkdirSync(hlsBaseDir, { recursive: true });
  }

  const videos = await prisma.video.findMany();
  console.log(`Encontrados ${videos.length} videos en la base de datos.`);

  for (const video of videos) {
    // Check if video is already HLS or still raw
    if (video.filename.endsWith('.m3u8')) {
      console.log(`⏩ [${video.title}] Ya está en formato HLS. Saltando.`);
      continue;
    }

    const inputPath = path.join(uploadsDir, video.filename);
    if (!fs.existsSync(inputPath)) {
      console.error(`❌ [${video.title}] Archivo original no encontrado en: ${inputPath}`);
      continue;
    }

    const videoHlsFolder = path.join(hlsBaseDir, video.id);
    const playlistName = 'index.m3u8';
    const playlistPath = path.join(videoHlsFolder, playlistName);

    if (!fs.existsSync(videoHlsFolder)) {
      fs.mkdirSync(videoHlsFolder, { recursive: true });
    }

    console.log(`🎞️  [${video.title}] Convirtiendo a HLS...`);

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .addOptions([
          '-profile:v baseline',
          '-level 3.0',
          '-start_number 0',
          '-hls_time 10',
          '-hls_list_size 0',
          '-f hls',
          '-hls_segment_filename', path.join(videoHlsFolder, 'segment_%03d.ts')
        ])
        .output(playlistPath)
        .on('end', async () => {
          const relativePlaylistPath = `hls/${video.id}/${playlistName}`;
          await prisma.video.update({
            where: { id: video.id },
            data: { filename: relativePlaylistPath }
          });
          console.log(`✅ [${video.title}] Migración completada exitosamente.`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`❌ [${video.title}] Error en FFmpeg:`, err.message);
          reject(err);
        })
        .run();
    });
  }

  console.log('🏁 Proceso de migración finalizado.');
}

migrate()
  .catch(err => console.error('❌ Error fatal en migración:', err))
  .finally(async () => {
    await prisma.$disconnect();
  });
