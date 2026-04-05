const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

async function testR2() {
  console.log('--- Probando Conexión a Cloudflare R2 ---');
  console.log('Endpoint:', process.env.S3_ENDPOINT);
  console.log('Bucket:', process.env.S3_BUCKET);

  const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
    },
    forcePathStyle: false
  });

  try {
    const data = await s3Client.send(new ListBucketsCommand({}));
    console.log('✅ Éxito: Conexión establecida correctamente.');
    console.log('Tus buckets:', data.Buckets.map(b => b.Name).join(', '));
    
    const bucketExists = data.Buckets.some(b => b.Name === process.env.S3_BUCKET);
    if (bucketExists) {
      console.log(`✅ Bucket "${process.env.S3_BUCKET}" encontrado.`);
    } else {
      console.log(`⚠️ Bucket "${process.env.S3_BUCKET}" NO encontrado en la lista.`);
    }
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
    if (err.name === 'SignatureDoesNotMatch') {
      console.error('Pista: Las claves (Access/Secret Key) o el Account ID podrían estar incorrectos.');
    }
  }
}

testR2();
