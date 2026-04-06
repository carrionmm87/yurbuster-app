const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const username = 'admin';
  const password = 'reyderscg87';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      password: hashedPassword,
      role: 'admin'
    },
    create: {
      username,
      password: hashedPassword,
      role: 'admin',
      email: 'admin@reyders.cl',
      phone: '+56900000000'
    }
  });

  console.log('✅ Usuario administrador creado/actualizado:', user.username);
}

main()
  .catch(e => {
    console.error('❌ Error al crear admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
