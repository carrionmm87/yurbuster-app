const S3rver = require('s3rver');
const path = require('path');
const fs = require('fs');

const bucketDir = path.join(__dirname, 'mock-cloud-storage');
const BUCKET_NAME = 'yurbuster-videos-local';

if (!fs.existsSync(bucketDir)) {
  fs.mkdirSync(bucketDir);
}
// Create the default bucket directory so it's auto-provisioned
const defaultBucketPath = path.join(bucketDir, BUCKET_NAME);
if (!fs.existsSync(defaultBucketPath)) {
  fs.mkdirSync(defaultBucketPath);
}

const instance = new S3rver({
  port: 4568,
  address: 'localhost',
  directory: bucketDir,
  silent: false,
  configureBuckets: [
    {
      name: BUCKET_NAME,
      configs: [
        `<?xml version="1.0" encoding="UTF-8"?>
         <CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
           <CORSRule>
             <AllowedOrigin>*</AllowedOrigin>
             <AllowedMethod>GET</AllowedMethod>
             <AllowedMethod>PUT</AllowedMethod>
             <AllowedMethod>POST</AllowedMethod>
             <AllowedHeader>*</AllowedHeader>
           </CORSRule>
         </CORSConfiguration>`
      ],
    },
  ],
});

instance.run((err, { address, port } = {}) => {
  if (err) {
    console.error('Error starting S3rver:', err);
  } else {
    console.log(`[S3 SIMULATOR] Cloudflare R2 Mock running at http://${address}:${port}`);
    console.log(`[S3 SIMULATOR] Bucket "${BUCKET_NAME}" is ready.`);
  }
});
