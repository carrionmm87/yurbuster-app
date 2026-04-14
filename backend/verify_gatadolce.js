const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.update({
      where: { username: 'Gatadolce' },
      data: { is_verified: true, role: 'creator' }
    });
    console.log('✅ El usuario Gatadolce ha sido verificado como CREADOR exitosamente.');
  } catch (error) {
    console.error('❌ Error: No se pudo encontrar al usuario Gatadolce.');
  } finally {
    await prisma.$disconnect();
  }
}

main();
