/**
 * Payment Recovery Script
 *
 * Usage:
 *   node recover_payments.js < payment_orders.json
 *
 * Input JSON format (array of payment objects):
 * [
 *   {
 *     "orderId": "order_123",
 *     "timestamp": "2026-04-13T10:30:45Z",
 *     "amount": 5000,
 *     "videoId": "video_xyz",
 *     "userId": "user_abc",
 *     "paymentMethod": "Webpay"
 *   },
 *   ...
 * ]
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recoverPayments() {
  try {
    let inputData = '';

    // Read from stdin
    process.stdin.setEncoding('utf8');

    return new Promise((resolve, reject) => {
      process.stdin.on('readable', () => {
        let chunk;
        while ((chunk = process.stdin.read()) !== null) {
          inputData += chunk;
        }
      });

      process.stdin.on('end', async () => {
        try {
          if (!inputData.trim()) {
            console.log('No input data provided. Format: node recover_payments.js < payment_orders.json');
            process.exit(0);
          }

          const payments = JSON.parse(inputData);

          if (!Array.isArray(payments)) {
            throw new Error('Input must be a JSON array of payment objects');
          }

          console.log(`Processing ${payments.length} payment(s)...`);

          let successCount = 0;
          let errorCount = 0;
          const results = [];

          for (const payment of payments) {
            try {
              // Validate required fields
              const { orderId, timestamp, amount, videoId, userId, paymentMethod } = payment;

              if (!orderId || !timestamp || !amount || !videoId || !userId) {
                throw new Error('Missing required fields: orderId, timestamp, amount, videoId, userId');
              }

              // Check if this payment already exists
              const existing = await prisma.rental.findFirst({
                where: { payment_id: orderId }
              });

              if (existing) {
                console.log(`⏭️  Order ${orderId}: Already exists (skipping)`);
                results.push({ orderId, status: 'skipped', reason: 'Already exists' });
                continue;
              }

              // Verify video exists
              const video = await prisma.video.findUnique({
                where: { id: videoId }
              });

              if (!video) {
                throw new Error(`Video ${videoId} not found`);
              }

              // Verify user exists
              const user = await prisma.user.findUnique({
                where: { id: userId }
              });

              if (!user) {
                throw new Error(`User ${userId} not found`);
              }

              // Calculate split (90% creator, 10% platform)
              const uploaderEarned = Math.floor(amount * 0.9);
              const platformFee = amount - uploaderEarned;

              // Create rental record
              const rental = await prisma.rental.create({
                data: {
                  video_id: videoId,
                  user_id: userId,
                  token: `recovered_${orderId}`, // Dummy token for recovered payments
                  expires_at: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // 24h from now
                  total_paid: amount,
                  uploader_earned: uploaderEarned,
                  platform_fee: platformFee,
                  payment_id: orderId,
                  created_at: new Date(timestamp),
                  paid_at: new Date(timestamp)
                }
              });

              console.log(`✅ Order ${orderId}: Created rental (${amount} CLP)`);
              results.push({
                orderId,
                status: 'success',
                rentalId: rental.id,
                amount,
                uploaderEarned,
                platformFee
              });

              successCount++;

            } catch (error) {
              errorCount++;
              console.log(`❌ Order ${payment.orderId}: ${error.message}`);
              results.push({
                orderId: payment.orderId,
                status: 'error',
                error: error.message
              });
            }
          }

          console.log(`\n📊 Summary:`);
          console.log(`  ✅ Successful: ${successCount}`);
          console.log(`  ❌ Failed: ${errorCount}`);
          console.log(`  ⏭️  Skipped: ${payments.length - successCount - errorCount}`);

          resolve(results);
        } catch (error) {
          reject(error);
        }
      });
    });

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

recoverPayments().then(() => {
  process.exit(0);
}).catch(error => {
  console.error(error);
  process.exit(1);
});
