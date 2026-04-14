const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.update({
      where: { username: 'javiera' },
      data: { is_verified: true }
    });
    console.log('✅ Usuario javiera verificado exitosamente');
  } catch (error) {
    console.error('❌ Error: No se pudo verificar a javiera. Asegúrate de que el usuario exista.');
  } finally {
    await prisma.$disconnect();
  }
}

main();
