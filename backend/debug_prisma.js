const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log('Users:', users);
  } catch (e) {
    console.error('FULL PRISMA ERROR:');
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
