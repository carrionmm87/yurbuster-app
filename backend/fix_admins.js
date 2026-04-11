const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function fixAdmins() {
  console.log("🛠️ Actualizando o creando administradores...");
  try {
    const h1 = await bcrypt.hash('reyderscg87', 10);
    const randomPhone1 = '+569' + Math.floor(10000000 + Math.random() * 90000000).toString();
    await prisma.user.upsert({
      where: { username: 'master' },
      update: { password: h1, role: 'admin', is_verified: true },
      create: {
        username: 'master',
        password: h1,
        role: 'admin',
        email: 'master@yurbuster.com',
        phone: randomPhone1,
        is_verified: true
      }
    });
    console.log("✅ Admin maestro listo (Nuevo nombre de usuario).");

    const h2 = await bcrypt.hash('ingricita2129', 10);
    const randomPhone2 = '+569' + Math.floor(10000000 + Math.random() * 90000000).toString();
    await prisma.user.upsert({
      where: { username: 'ingrid' },
      update: { password: h2, role: 'admin', is_verified: true },
      create: {
        username: 'ingrid',
        password: h2,
        role: 'admin',
        email: 'ingrid_real@yurbuster.com',
        phone: randomPhone2,
        is_verified: true
      }
    });
    console.log("✅ Ingrid administradora lista.");

    console.log(`
=========================================
✅ ÉXITO TOTAL. CLAVES REESTABLECIDAS:
=========================================
Usuario 1: admin
Clave 1: reyderscg

Usuario 2: ingrid
Clave 2: ingricita2129
=========================================
`);

  } catch (err) {
    console.error("❌ Ocurrió un error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdmins();
