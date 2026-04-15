/**
 * Register payments by video instead of by user
 * All 5 payments are for the same video, so earnings go to the creator
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// All 5 payments are for this video
const VIDEO_ID = '4fa6aabd-e0ac-4d34-9e55-a5e453b49fb0';

const payments = [
  {
    orderId: '166208041-Mach',
    timestamp: new Date('2026-04-14T19:13:00'),
    amount: 1499,
    method: 'Mach'
  },
  {
    orderId: '166208909-Mach',
    timestamp: new Date('2026-04-14T19:20:00'),
    amount: 1499,
    method: 'Mach'
  },
  {
    orderId: '166210135-Webpay',
    timestamp: new Date('2026-04-14T19:43:00'),
    amount: 1499,
    method: 'Webpay'
  },
  {
    orderId: '166210161-Khipu',
    timestamp: new Date('2026-04-14T19:44:00'),
    amount: 1499,
    method: 'Khipu'
  },
  {
    orderId: '166214345-Webpay',
    timestamp: new Date('2026-04-14T20:49:00'),
    amount: 1499,
    method: 'Webpay'
  }
];

async function registerPayments() {
  console.log('\n💰 Registrando 5 pagos del 14-04-2026 (por video)...\n');

  try {
    // Get video and creator
    const video = await prisma.video.findUnique({
      where: { id: VIDEO_ID },
      include: { uploader: true }
    });

    if (!video) {
      console.log(`❌ Video ${VIDEO_ID} no encontrado`);
      process.exit(1);
    }

    console.log(`📹 Video: ${video.title}`);
    console.log(`👤 Creador: ${video.uploader.username}`);
    console.log(`💰 Precio: $${video.price} CLP\n`);

    let created = 0;
    let skipped = 0;
    let totalCreatorEarnings = 0;
    let totalPlatformFee = 0;

    for (const payment of payments) {
      // Check if already exists
      const existing = await prisma.rental.findFirst({
        where: { payment_id: payment.orderId }
      });

      if (existing) {
        console.log(`⏭️  ${payment.orderId} ya existe`);
        skipped++;
        continue;
      }

      // Create rental for the video creator
      const uploaderEarned = Math.floor(payment.amount * 0.9);
      const platformFee = Math.floor(payment.amount * 0.1);

      const rental = await prisma.rental.create({
        data: {
          payment_id: payment.orderId,
          video_id: video.id,
          user_id: video.uploader_id, // Creator owns this payment
          token: uuidv4(),
          expires_at: new Date(payment.timestamp.getTime() + 24 * 60 * 60 * 1000),
          total_paid: payment.amount,
          uploader_earned: uploaderEarned,
          platform_fee: platformFee,
          created_at: payment.timestamp
        }
      });

      console.log(`✅ ${payment.orderId} (${payment.method})`);
      console.log(`   → Creador: +$${uploaderEarned} CLP | Plataforma: +$${platformFee} CLP`);

      totalCreatorEarnings += uploaderEarned;
      totalPlatformFee += platformFee;
      created++;
    }

    console.log(`\n📊 Resumen:`);
    console.log(`  ✅ Pagos registrados: ${created}`);
    console.log(`  ⏭️  Saltados: ${skipped}`);
    console.log(`  💰 Total ${video.uploader.username}: +$${totalCreatorEarnings} CLP (sin liquidar)`);
    console.log(`  💰 Total plataforma: +$${totalPlatformFee} CLP\n`);

    // Show creator earnings
    const creatorStats = await prisma.rental.aggregate({
      where: { user_id: video.uploader_id, paid_at: null },
      _sum: { uploader_earned: true }
    });

    console.log(`📈 Earnings pendientes de ${video.uploader.username}: $${creatorStats._sum.uploader_earned || 0} CLP`);
    console.log(`   (Marcar como pagado desde el panel de admin)\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

registerPayments();
