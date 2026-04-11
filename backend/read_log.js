const fs = require('fs');
try {
  const content = fs.readFileSync('error.log', 'utf16le');
  fs.writeFileSync('error_utf8.log', content, 'utf8');
  console.log('Done error.log');
} catch (e) {
  console.log('No error.log or error:', e);
}
try {
  const content2 = fs.readFileSync('server.log', 'utf8'); // Maybe this one is utf8
  fs.writeFileSync('server_utf8.log', content2, 'utf8');
  console.log('Done server.log');
} catch (e) {}
