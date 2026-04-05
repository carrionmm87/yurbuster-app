const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('--- START PRISMA TEST ---');
    console.log('Attempting connection...');
    await prisma.$connect();
    console.log('Connected successfully!');
  } catch (e) {
    console.error('PRISMA TEST FAILED!');
    fs.writeFileSync('error_full.json', JSON.stringify({
      name: e.name,
      message: e.message,
      stack: e.stack,
      clientVersion: e.clientVersion,
      errorCode: e.errorCode,
    }, null, 2));
    console.log('Full error written to error_full.json');
  } finally {
    await prisma.$disconnect();
    console.log('--- END PRISMA TEST ---');
  }
}

main();
