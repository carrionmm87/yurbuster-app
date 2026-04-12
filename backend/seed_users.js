const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function seed() {
  const users = [
    { username: 'master', password: 'reyderscg87',   role: 'admin', email: 'master@yurbuster.com',   phone: '+56911111111' },
    { username: 'ingrid',  password: 'ingricita2129', role: 'admin', email: 'ingrid@yurbuster.com',    phone: '+56922222222' }
  ];

  for (const u of users) {
    const exists = await prisma.user.findFirst({ where: { username: u.username } });
    if (exists) {
      // Update password and role
      const hashed = await bcrypt.hash(u.password, 10);
      await prisma.user.update({ where: { id: exists.id }, data: { password: hashed, role: u.role } });
      console.log(`✓ '${u.username}' actualizado`);
    } else {
      // Create fresh
      const hashed = await bcrypt.hash(u.password, 10);
      await prisma.user.create({
        data: {
          username: u.username,
          password: hashed,
          role:     u.role,
          email:    u.email,
          phone:    u.phone,
          is_verified: true
        }
      });
      console.log(`✓ '${u.username}' creado`);
    }
  }

  const all = await prisma.user.findMany({ select: { username: true, role: true } });
  console.log('\nUsuarios en BD:', all);

  await prisma.$disconnect();
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
