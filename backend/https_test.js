const https = require('https');

const options = {
  hostname: 'f58bd66758750ad79cb4e9a1976696d0.r2.cloudflarestorage.com',
  port: 443,
  path: '/',
  method: 'GET'
};

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});
req.end();
