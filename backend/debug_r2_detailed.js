const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function debugR2() {
  console.log('--- Debugging Cloudflare R2 ---');
  console.log('Endpoint:', process.env.S3_ENDPOINT);
  
  const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
    },
    // R2 often requires this for some SDK versions to avoid SSL issues
    tls: true,
    forcePathStyle: false
  });

  try {
    const data = await s3Client.send(new ListBucketsCommand({}));
    console.log('Success! Buckets found:', data.Buckets.length);
  } catch (err) {
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    if (err.stack) console.error('Stack Trace:', err.stack);
  }
}

debugR2();
