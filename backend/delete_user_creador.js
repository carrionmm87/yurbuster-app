const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const usernameToDelete = 'creador';
  try {
    const user = await prisma.user.findUnique({
      where: { username: usernameToDelete }
    });

    if (!user) {
      console.log(`❌ El usuario "${usernameToDelete}" ya no existe.`);
      return;
    }

    // Borramos al usuario (Prisma manejará la eliminación si no hay dependencias bloqueantes)
    await prisma.user.delete({
      where: { username: usernameToDelete }
    });

    console.log(`✅ Usuario "${usernameToDelete}" ELIMINADO. Ya puedes registrarlo de nuevo.`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
