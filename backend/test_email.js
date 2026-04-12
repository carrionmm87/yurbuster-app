require('dotenv').config();
const { sendApprovalEmail, sendRejectionEmail } = require('./email.service');

const testEmail = process.argv[2];
const testType = process.argv[3] || 'approval'; // 'approval' or 'rejection'

if (!testEmail) {
  console.error('Uso: node test_email.js tu@correo.com [approval|rejection]');
  process.exit(1);
}

console.log(`Enviando email de prueba (${testType}) a: ${testEmail}`);

const fn = testType === 'rejection' ? sendRejectionEmail : sendApprovalEmail;

fn(testEmail, 'CreadorTest')
  .then(() => {
    console.log('✅ Email enviado correctamente');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
