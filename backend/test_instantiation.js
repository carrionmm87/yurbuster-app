try {
  const { PrismaClient } = require('@prisma/client');
  console.log('✅ Importación de @prisma/client exitosa');
  const prisma = new PrismaClient();
  console.log('✅ Instanciación de PrismaClient exitosa');
} catch (e) {
  console.error('❌ Error fatal:');
  console.error(e);
}
