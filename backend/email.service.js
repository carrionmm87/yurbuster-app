const { Resend } = require('resend');
const FROM = 'Yurbuster <noreply@yurbuster.com>';

async function sendApprovalEmail(toEmail, username) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: FROM,
      to: toEmail,
      subject: '✅ ¡Tu cuenta de creador fue aprobada! – Yurbuster',
      html: `<h1>¡Felicidades ${username}!</h1><p>Ya puedes subir videos.</p>`
    });
  } catch (err) {
    console.error('[EMAIL] Error:', err.message);
  }
}

async function sendRejectionEmail(toEmail, username) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: FROM,
      to: toEmail,
      subject: 'Actualización sobre tu solicitud – Yurbuster',
      html: `<p>Hola ${username}, tu solicitud no fue aprobada.</p>`
    });
  } catch (err) {
    console.error('[EMAIL] Error:', err.message);
  }
}

module.exports = { sendApprovalEmail, sendRejectionEmail };
