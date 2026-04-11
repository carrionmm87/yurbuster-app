require('dotenv').config();
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { NodeHttpHandler } = require("@smithy/node-http-handler");
const { Agent } = require("https");
const dns = require("dns");

async function testConnection(family) {
  console.log(`\n--- Testing with IP family: ${family || 'any'} ---`);
  
  const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: (process.env.S3_ACCESS_KEY || '').trim(),
      secretAccessKey: (process.env.S3_SECRET_KEY || '').trim(),
    },
    forcePathStyle: true,
    requestHandler: new NodeHttpHandler({
      httpsAgent: new Agent({
        rejectUnauthorized: false,
        family: family // 4 for IPv4, 6 for IPv6
      })
    })
  });

  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET,
      MaxKeys: 1
    });

    await s3Client.send(command);
    console.log("✅ Success!");
    return true;
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    return false;
  }
}

async function run() {
  await testConnection(4); // Force IPv4
  await testConnection(6); // Force IPv6
}

run();
