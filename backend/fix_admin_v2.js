require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./database.sqlite';
}

const p = new PrismaClient();

async function f() {
  try {
    console.log('--- Iniciando reseteo de administrador ---');
    const hash = await bcrypt.hash('reyderscg87', 10);
    
    await p.user.upsert({
      where: { username: 'master' },
      update: { password: hash, role: 'admin', is_verified: true },
      create: { 
        username: 'master', 
        password: hash, 
        role: 'admin', 
        email: 'master@yurbuster.com', 
        is_verified: true 
      }
    });

    console.log('✅ USUARIO MASTER ACTUALIZADO: reyderscg87');
    process.exit(0);
  } catch (err) {
    console.error('❌ ERROR EN EL SCRIPT:', err.message);
    process.exit(1);
  }
}

f();
