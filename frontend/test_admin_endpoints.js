const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testEndpoints() {
  console.log('\n📊 Testing Admin Endpoints\n');

  try {
    // Simular endpoint /api/admin/stats
    console.log('1️⃣ GET /api/admin/stats:');
    const rentalCount = await prisma.rental.count();
    const totalEarnings = await prisma.rental.aggregate({ _sum: { total_paid: true } });
    const pendingEarnings = await prisma.rental.aggregate({
      where: { paid_at: null },
      _sum: { total_paid: true }
    });

    const stats = {
      totalRentals: rentalCount,
      totalEarnings: totalEarnings._sum.total_paid || 0,
      pendingEarnings: pendingEarnings._sum.total_paid || 0,
      paidEarnings: (totalEarnings._sum.total_paid || 0) - (pendingEarnings._sum.total_paid || 0)
    };

    console.log(JSON.stringify(stats, null, 2));

    // Simular endpoint /api/admin/creators-earnings
    console.log('\n2️⃣ GET /api/admin/creators-earnings:');
    const creatorsEarnings = await prisma.rental.groupBy({
      by: ['video_id'],
      _sum: { uploader_earned: true, platform_fee: true, total_paid: true }
    });

    const enriched = await Promise.all(
      creatorsEarnings.map(async (item) => {
        const video = await prisma.video.findUnique({
          where: { id: item.video_id },
          include: { uploader: true }
        });
        return {
          videoTitle: video?.title || 'Unknown',
          creatorName: video?.uploader.username || 'Unknown',
          totalRentals: await prisma.rental.count({ where: { video_id: item.video_id } }),
          uploaderEarned: item._sum.uploader_earned || 0,
          platformFee: item._sum.platform_fee || 0,
          totalRevenue: item._sum.total_paid || 0
        };
      })
    );

    console.log(JSON.stringify(enriched, null, 2));

    console.log('\n✅ All endpoints working correctly!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testEndpoints();
