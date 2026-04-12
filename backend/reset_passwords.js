const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function resetPasswords() {
  const users = [
    { username: 'master', password: 'reyderscg87' },
    { username: 'ingrid',  password: 'ingricita2129' }
  ];

  for (const { username, password } of users) {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.findFirst({ where: { username } });
    if (user) {
      await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
      console.log(`✓ Contraseña de '${username}' actualizada`);
    } else {
      console.warn(`⚠ Usuario '${username}' no encontrado`);
    }
  }

  await prisma.$disconnect();
  process.exit(0);
}

resetPasswords();
