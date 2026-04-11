require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { NodeHttpHandler } = require("@smithy/node-http-handler");
const { Agent } = require("https");
const crypto = require('crypto');

// Configuración FFMPEG basada en el sistema operativo
if (process.platform === 'win32') {
  ffmpeg.setFfmpegPath('C:\\Users\\USER\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe'); 
} else {
  ffmpeg.setFfmpegPath('ffmpeg');
}
const prisma = new PrismaClient();
const endpoint = (process.env.S3_ENDPOINT || '').trim().replace(/\/$/, '');
const s3Client = new S3Client({
  region: 'auto',
  endpoint: endpoint,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: false
});

const S3_BUCKET = process.env.S3_BUCKET;

async function processQueue() {
  console.log("[WORKER] Buscando videos crudos (RAW) pendientes de transcodificar...");

  try {
    const rawVideos = await prisma.video.findMany({
      where: {
        filename: { startsWith: 'raw/' } // Todos los que aún están como RAW
      }
    });

    if (rawVideos.length === 0) {
      console.log("[WORKER] No hay videos en cola.");
      return;
    }

    for (const video of rawVideos) {
      console.log(`[WORKER] Procesando video ID: ${video.id}`);

      // 1. Obtener URL de origen desde el Storage Cloud
      const getCommand = new GetObjectCommand({ Bucket: S3_BUCKET, Key: video.filename });
      const sourceUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });

      // Configurar carpeta temporal de procesamiento
      const tempOutput = path.join(__dirname, 'uploads', 'temp_hls', video.id);
      if (!fs.existsSync(tempOutput)) fs.mkdirSync(tempOutput, { recursive: true });
      const m3u8Path = path.join(tempOutput, 'index.m3u8');

      // 2. Transcodificar (FFmpeg lee directo del la URL y guarda local temporalmente)
      await new Promise((resolve, reject) => {
        ffmpeg(sourceUrl)
            .outputOptions([
                '-codec: copy',     // Usamos copy para que sea ultra rápido en entorno de prueba
                '-start_number 0',
                '-hls_time 10',
                '-hls_list_size 0',
                '-f hls'
            ])
            .output(m3u8Path)
            .on('end', resolve)
            .on('error', reject)
            .run();
      });

      console.log(`[WORKER] Transcodificación terminada localmente. Subiendo fragmentos a Storage Cloud...`);

      // 3. Subir HLS y fragmentos al Bucket de Cloudflare R2
      const files = fs.readdirSync(tempOutput);
      for (const file of files) {
        const fileContent = fs.readFileSync(path.join(tempOutput, file));
        const putCommand = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: `hls/${video.id}/${file}`,
            Body: fileContent,
            ContentType: file.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/MP2T'
        });
        await s3Client.send(putCommand);
      }

      // 4. Limpiar temporal local
      fs.rmSync(tempOutput, { recursive: true, force: true });

      // 5. Actualizar la BD para usar el stream optimizado
      await prisma.video.update({
          where: { id: video.id },
          data: { filename: `hls/${video.id}/index.m3u8` }
      });

      console.log(`[WORKER] ✅ Video ${video.id} completado y actualizado a versión HLS optimizada.`);
    }

  } catch (error) {
    console.error("[WORKER] Error en bucle principal:", error);
  }
}

// Emula un CronJob o Consumidor activo que revisa cada 15 segundos
console.log(`[WORKER] Servicio In iniciado.`);
processQueue();
setInterval(processQueue, 15000);
