const tls = require('tls');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const url = new URL(process.env.S3_ENDPOINT);
const host = url.hostname;
const port = 443;

console.log(`Conectando a ${host}:${port}...`);

const socket = tls.connect(port, host, { servername: host }, () => {
  console.log('--- Conexión Establecida ---');
  console.log('Protocolo:', socket.getProtocol());
  console.log('Cipher:', socket.getCipher());
  console.log('Certificado Autorizado:', socket.authorized ? 'Sí' : 'No');
  if (!socket.authorized) {
    console.log('Error de Autorización:', socket.authorizationError);
  }
  socket.end();
});

socket.on('error', (err) => {
  console.error('--- Error de TLS ---');
  console.error('Mensaje:', err.message);
  console.error('Código:', err.code);
  console.error('Stack:', err.stack);
});

socket.on('secureConnect', () => {
    console.log('Conexión segura completa.');
});
