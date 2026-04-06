const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log('Users in Prisma DB:');
    users.forEach(u => console.log(`- ${u.username} (${u.role}) [ID: ${u.id}]`));
  } catch (error) {
    console.error('Error connecting to Prisma DB:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
