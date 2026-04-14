const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.update({
      where: { username: 'DonPool' },
      data: { is_verified: true, role: 'creator' }
    });
    console.log('✅ El usuario DonPool ha sido verificado como CREADOR exitosamente.');
  } catch (error) {
    console.error('❌ Error: No se pudo encontrar al usuario DonPool.');
  } finally {
    await prisma.$disconnect();
  }
}

main();
