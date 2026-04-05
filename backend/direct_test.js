const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: 'auto',
  endpoint: 'https://f58bd66758750ad79cb4e9a1976696d0.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: 'ecce20136ea1cd20050258494d220cda',
    secretAccessKey: 'b60c59119129fe8283eb07a6bad107823d29d19e0ea075cb023efa24961299cd',
  },
  forcePathStyle: false
});

async function run() {
  try {
    const data = await s3Client.send(new ListBucketsCommand({}));
    console.log('Success:', data.Buckets.map(b => b.Name));
  } catch (err) {
    console.error('Error:', err);
  }
}
run();
