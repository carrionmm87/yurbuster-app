const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function diagnose() {
  // 1. List all users
  const users = await prisma.user.findMany({
    select: { id: true, username: true, email: true, role: true, password: true }
  });
  console.log(`\n=== Usuarios en BD: ${users.length} ===`);
  for (const u of users) {
    console.log(`  · ${u.username} (${u.role}) - email: ${u.email}`);
    // Test password
    const testPass = u.username === 'master' ? 'reyderscg87' : 'ingricita2129';
    const match = await bcrypt.compare(testPass, u.password);
    console.log(`    Password "${testPass}" → ${match ? '✓ CORRECTO' : '✗ incorrecto'}`);
  }

  await prisma.$disconnect();
  process.exit(0);
}

diagnose().catch(e => { console.error(e); process.exit(1); });
