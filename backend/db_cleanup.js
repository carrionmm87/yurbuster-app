const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('--- Cleaning up database for production ---');

    const rentals = await prisma.rental.deleteMany({});
    console.log(`Deleted ${rentals.count} rentals.`);

    const videos = await prisma.video.deleteMany({});
    console.log(`Deleted ${videos.count} videos.`);

    const users = await prisma.user.deleteMany({
      where: {
        NOT: {
          username: 'admin'
        }
      }
    });
    console.log(`Deleted ${users.count} user accounts (except admin).`);

    console.log('--- Database is now clean and ready! ---');
  } catch (e) {
    console.error('Error during cleanup:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
