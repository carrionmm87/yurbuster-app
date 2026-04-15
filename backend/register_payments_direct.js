/**
 * Register 5 payments directly to database
 * Run on VPS: node register_payments_direct.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

const payments = [
  {
    orderId: '166208041-Mach',
    timestamp: new Date('2026-04-14T19:13:00'),
    amount: 1499,
    videoId: '4fa6aabd-e0ac-4d34-9e55-a5e453b49fb0',
    userId: 'db5cca84-1707-4d56-a34b-41adb47f9fb8',
    method: 'Mach'
  },
  {
    orderId: '166208909-Mach',
    timestamp: new Date('2026-04-14T19:20:00'),
    amount: 1499,
    videoId: '4fa6aabd-e0ac-4d34-9e55-a5e453b49fb0',
    userId: 'db5cca84-1707-4d56-a34b-41adb47f9fb8',
    method: 'Mach'
  },
  {
    orderId: '166210135-Webpay',
    timestamp: new Date('2026-04-14T19:43:00'),
    amount: 1499,
    videoId: '4fa6aabd-e0ac-4d34-9e55-a5e453b49fb0',
    userId: 'a3c498c1-937a-41e6-af4f-4f797296a9a1',
    method: 'Webpay'
  },
  {
    orderId: '166210161-Khipu',
    timestamp: new Date('2026-04-14T19:44:00'),
    amount: 1499,
    videoId: '4fa6aabd-e0ac-4d34-9e55-a5e453b49fb0',
    userId: 'a92054ac-67a6-437d-89b7-675c94959670',
    method: 'Khipu'
  },
  {
    orderId: '166214345-Webpay',
    timestamp: new Date('2026-04-14T20:49:00'),
    amount: 1499,
    videoId: '4fa6aabd-e0ac-4d34-9e55-a5e453b49fb0',
    userId: '99fcdd83-3d90-41fb-aecc-82074fdcab7d',
    method: 'Webpay'
  }
];

async function registerPayments() {
  console.log('\n💰 Registrando 5 pagos del 14-04-2026...\n');

  try {
    let created = 0;
    let skipped = 0;

    for (const payment of payments) {
      // Check if already exists
      const existing = await prisma.rental.findFirst({
        where: { payment_id: payment.orderId }
      });

      if (existing) {
        console.log(`⏭️  ${payment.orderId} ya existe, saltando...`);
        skipped++;
        continue;
      }

      // Verify user and video exist
      const [user, video] = await Promise.all([
        prisma.user.findUnique({ where: { id: payment.userId } }),
        prisma.video.findUnique({ where: { id: payment.videoId } })
      ]);

      if (!user) {
        console.log(`❌ ${payment.orderId}: Usuario ${payment.userId} no encontrado`);
        continue;
      }

      if (!video) {
        console.log(`❌ ${payment.orderId}: Video ${payment.videoId} no encontrado`);
        continue;
      }

      // Create rental record
      const uploaderEarned = Math.floor(payment.amount * 0.9);
      const platformFee = Math.floor(payment.amount * 0.1);

      const rental = await prisma.rental.create({
        data: {
          payment_id: payment.orderId,
          video_id: payment.videoId,
          user_id: payment.userId,
          token: uuidv4(),
          expires_at: new Date(payment.timestamp.getTime() + 24 * 60 * 60 * 1000),
          total_paid: payment.amount,
          uploader_earned: uploaderEarned,
          platform_fee: platformFee,
          created_at: payment.timestamp
        }
      });

      console.log(`✅ ${payment.orderId} (${payment.method}) - Usuario: ${user.username}`);
      console.log(`   Ingreso creador: $${uploaderEarned} CLP | Fee plataforma: $${platformFee} CLP\n`);
      created++;
    }

    console.log(`\n📊 Resumen:`);
    console.log(`  ✅ Creados: ${created}`);
    console.log(`  ⏭️  Saltados: ${skipped}`);
    console.log(`  💰 Total ingreso creadores: $${created * Math.floor(1499 * 0.9)} CLP`);
    console.log(`  💰 Total fee plataforma: $${created * Math.floor(1499 * 0.1)} CLP\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

registerPayments();
