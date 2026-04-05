const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');
const fs = require('fs');

async function test() {
  const dbPath = path.resolve(__dirname, 'database.sqlite');
  const betterSqlite = new Database(dbPath);
  const adapter = new PrismaBetterSqlite3(betterSqlite);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("Testing Prisma findMany query...");
    const videos = await prisma.video.findMany({
      include: {
        uploader: {
          select: { username: true }
        }
      }
    });
    console.log("Videos found:", videos.length);
    console.log(JSON.stringify(videos, null, 2));
  } catch (error) {
    console.error("PRISMA ERROR DETECTED:");
    console.error(error);
    fs.writeFileSync('prisma_error.log', error.stack || error.message || JSON.stringify(error));
  } finally {
    await prisma.$disconnect();
    betterSqlite.close();
  }
}

test();
