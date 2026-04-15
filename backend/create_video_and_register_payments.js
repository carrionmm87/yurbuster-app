/**
 * Create video for gatadolce and register 5 payments
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

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

async function setupAndRegister() {
  console.log('\n🎬 Creando video y registrando pagos...\n');

  try {
    // Get gatadolce user
    const gatadolce = await prisma.user.findUnique({
      where: { username: 'gatadolce' }
    });

    if (!gatadolce) {
      console.log('❌ Usuario gatadolce no encontrado');
      process.exit(1);
    }

    console.log(`👤 Creador: ${gatadolce.username}`);

    // Check if video exists
    let video = await prisma.video.findUnique({
      where: { id: VIDEO_ID }
    });

    // If not, create it
    if (!video) {
      console.log(`\n🎥 Creando video...`);
      video = await prisma.video.create({
        data: {
          id: VIDEO_ID,
          title: 'PENDEJO ME DA RICO RICO!!',
          price: 1499,
          filename: 'video_gatadolce_01.mp4',
          thumbnail: 'thumb_gatadolce_01.jpg',
          description: 'Video de prueba para registrar pagos',
          duration: 3600,
          category: 'general',
          uploader_id: gatadolce.id,
          created_at: new Date('2026-04-13T00:00:00')
        }
      });
      console.log(`✅ Video creado: ${video.title}`);
    } else {
      console.log(`\n🎥 Video encontrado: ${video.title}`);
    }

    // Register payments
    console.log(`\n💰 Registrando 5 pagos...\n`);

    let created = 0;
    let skipped = 0;
    let totalCreatorEarnings = 0;
    let totalPlatformFee = 0;

    for (const payment of payments) {
      const existing = await prisma.rental.findFirst({
        where: { payment_id: payment.orderId }
      });

      if (existing) {
        console.log(`⏭️  ${payment.orderId} ya existe`);
        skipped++;
        continue;
      }

      const uploaderEarned = Math.floor(payment.amount * 0.9);
      const platformFee = Math.floor(payment.amount * 0.1);

      await prisma.rental.create({
        data: {
          payment_id: payment.orderId,
          video_id: video.id,
          user_id: gatadolce.id,
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
    console.log(`  💰 Total ${gatadolce.username}: +$${totalCreatorEarnings} CLP (SIN LIQUIDAR)`);
    console.log(`  💰 Total plataforma: +$${totalPlatformFee} CLP`);
    console.log(`\n✨ Los pagos aparecen en el panel de admin como "Earnings Pendientes"`);
    console.log(`✨ Marca como "Pagado" cuando hayas transferido el dinero\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupAndRegister();
