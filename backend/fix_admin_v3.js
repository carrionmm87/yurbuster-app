require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const p = new PrismaClient();

async function f() {
  try {
    const hM = await bcrypt.hash('reyderscg87', 10);
    const hI = await bcrypt.hash('ingricita2129', 10);
    
    await p.user.upsert({
      where: { username: 'master' },
      update: { password: hM, role: 'admin', is_verified: true },
      create: { username: 'master', password: hM, role: 'admin', email: 'master@yurbuster.com', is_verified: true }
    });
    
    await p.user.upsert({
      where: { username: 'ingrid' },
      update: { password: hI, role: 'admin', is_verified: true },
      create: { username: 'ingrid', password: hI, role: 'admin', email: 'ingrid@yurbuster.com', is_verified: true }
    });

    console.log('✅ ADMINS ACTUALIZADOS: master y ingrid');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

f();
