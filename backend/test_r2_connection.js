require('dotenv').config();
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { NodeHttpHandler } = require("@smithy/node-http-handler");
const { Agent } = require("https");

async function testConnection() {
  console.log("Testing connection to R2...");
  console.log("Endpoint:", process.env.S3_ENDPOINT);
  console.log("Bucket:", process.env.S3_BUCKET);

  const s3Client = new S3Client({
    region: 'us-east-1',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: (process.env.S3_ACCESS_KEY || '').trim(),
      secretAccessKey: (process.env.S3_SECRET_KEY || '').trim(),
    },
    forcePathStyle: false,
    requestHandler: new NodeHttpHandler({
      httpsAgent: new Agent({
        rejectUnauthorized: false, // Bypass SSL for local debugging
        minVersion: 'TLSv1.2'
      })
    })
  });

  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET,
      MaxKeys: 1
    });

    const response = await s3Client.send(command);
    console.log("Connection successful!");
    console.log("Response metadata:", response.$metadata);
  } catch (error) {
    console.error("Connection failed!");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Stack:", error.stack);
  }
}

testConnection();
