require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const emailService = require('./email.service');

async function main() {
  const usernames = ['DonPool', 'credor', 'creador']; // Incluyo variaciones por si acaso
  console.log('🚀 Iniciando envío manual de emails...');

  for (const username of usernames) {
    try {
      const user = await prisma.user.findUnique({ where: { username } });
      if (user && user.email) {
        console.log(`📧 Enviando correo a ${username} (${user.email})...`);
        await emailService.sendApprovalEmail(user.email, user.username);
        console.log(`✅ Correo enviado a ${username}`);
      } else {
        console.log(`⚠️ Usuario ${username} no encontrado o sin email registrado.`);
      }
    } catch (err) {
      console.error(`❌ Error con ${username}:`, err.message);
    }
  }
  
  await prisma.$disconnect();
  console.log('🏁 Proceso finalizado.');
}

main();
