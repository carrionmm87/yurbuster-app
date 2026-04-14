const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function registerPayments() {
  const payments = [
    {
      orderId: '166191290',
      timestamp: '2026-04-14T15:49:00Z',
      amount: 1500,
      videoId: '849843cf-6817-4129-a12d-b9ccdcb5440',
      userId: '9f5bab39-8b99-49ef-a31f-1ca01657884b',
      paymentMethod: 'Khipu',
      concept: 'Arriendo: PENDEJO ME DA RICO!!!'
    },
    {
      orderId: '166193003',
      timestamp: '2026-04-14T16:03:00Z',
      amount: 1500,
      videoId: '849843cf-6817-4129-a12d-b9ccdcb5440',
      userId: '510aa64d-725f-462e-b37a-448476284478',
      paymentMethod: 'Webpay',
      concept: 'Arriendo: PENDEJO ME DA RICO!!!'
    },
    {
      orderId: '166193196',
      timestamp: '2026-04-14T16:03:00Z',
      amount: 1500,
      videoId: '849843cf-6817-4129-a12d-b9ccdcb5440',
      userId: '9f5bab39-8b99-49ef-a31f-1ca01657884b',
      paymentMethod: 'Khipu',
      concept: 'Arriendo: PENDEJO ME DA RICO!!!'
    },
    {
      orderId: '166193471',
      timestamp: '2026-04-14T16:06:00Z',
      amount: 1500,
      videoId: '849843cf-6817-4129-a12d-b9ccdcb5440',
      userId: '510aa64d-725f-462e-b37a-448476284478',
      paymentMethod: 'Webpay',
      concept: 'Arriendo: PENDEJO ME DA RICO!!!'
    },
    {
      orderId: '166194316',
      timestamp: '2026-04-14T16:15:00Z',
      amount: 1000,
      videoId: '9fd8741-8c8e-4c04-8605-d615cef3f5c8',
      userId: 'a1160c37-1e18-40ac-a72b-45fc0ca6b2b2',
      paymentMethod: 'Webpay',
      concept: 'Arriendo: Tocándome bien rico mi chochita'
    }
  ];

  console.log('\n💰 Registrando 5 pagos realizados hoy (14-04-2026)...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const payment of payments) {
    try {
      // Check if already exists
      const existing = await prisma.rental.findFirst({
        where: { payment_id: payment.orderId }
      });

      if (existing) {
        console.log(`⏭️  Orden ${payment.orderId}: Ya existe en BD`);
        continue;
      }

      // Check if video exists
      const video = await prisma.video.findUnique({
        where: { id: payment.videoId },
        include: { uploader: true }
      });

      if (!video) {
        console.log(`❌ Orden ${payment.orderId}: Video no encontrado (${payment.videoId})`);
        errorCount++;
        continue;
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: payment.userId }
      });

      if (!user) {
        console.log(`❌ Orden ${payment.orderId}: Usuario no encontrado (${payment.userId})`);
        errorCount++;
        continue;
      }

      // Calculate earnings
      const uploaderEarned = Math.floor(payment.amount * 0.9);
      const platformFee = payment.amount - uploaderEarned;

      // Create rental
      const rental = await prisma.rental.create({
        data: {
          video_id: payment.videoId,
          user_id: payment.userId,
          token: `khipu_${payment.orderId}`,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
          total_paid: payment.amount,
          uploader_earned: uploaderEarned,
          platform_fee: platformFee,
          payment_id: payment.orderId,
          created_at: new Date(payment.timestamp),
          paid_at: new Date(payment.timestamp)
        }
      });

      console.log(`✅ Orden ${payment.orderId}: ${payment.amount} CLP`);
      console.log(`   Video: ${video.title}`);
      console.log(`   Usuario: ${user.username}`);
      console.log(`   Ganancia creador: ${uploaderEarned} CLP (90%)`);
      console.log(`   Ganancia plataforma: ${platformFee} CLP (10%)\n`);

      successCount++;
    } catch (error) {
      console.log(`❌ Orden ${payment.orderId}: Error - ${error.message}\n`);
      errorCount++;
    }
  }

  // Summary
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalCreatorEarnings = Math.floor(totalAmount * 0.9);
  const totalPlatformFee = totalAmount - totalCreatorEarnings;

  console.log('\n📊 RESUMEN:');
  console.log(`✅ Exitosos: ${successCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  console.log(`💰 Total registrado: ${totalAmount} CLP`);
  console.log(`👤 Ganancias creador: ${totalCreatorEarnings} CLP (90%)`);
  console.log(`🏢 Ganancias plataforma: ${totalPlatformFee} CLP (10%)\n`);

  await prisma.$disconnect();
}

registerPayments().catch(console.error);
