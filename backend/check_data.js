const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const v = await prisma.video.findMany({
    select: { title: true, duration: true, filename: true }
  });
  console.log('--- ESTADO DE VIDEOS ---');
  console.table(v);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
