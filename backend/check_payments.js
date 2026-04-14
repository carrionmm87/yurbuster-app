const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('\n📊 Current Database Status:\n');
  
  const userCount = await prisma.user.count();
  const videoCount = await prisma.video.count();
  const rentalCount = await prisma.rental.count();
  
  console.log(`Users: ${userCount}`);
  console.log(`Videos: ${videoCount}`);
  console.log(`Rentals (Paid): ${rentalCount}`);
  
  if (rentalCount > 0) {
    const rentals = await prisma.rental.findMany({
      include: { video: true, user: true },
      orderBy: { created_at: 'desc' },
      take: 5
    });
    
    console.log('\n📋 Last 5 Rentals:');
    rentals.forEach(r => {
      console.log(`  - Video: ${r.video.title} | User: ${r.user.username} | Amount: ${r.total_paid} CLP | Status: ${r.payment_id ? 'Paid' : 'Pending'}`);
    });
  }
  
  const earnings = await prisma.rental.aggregate({
    _sum: { total_paid: true }
  });
  
  console.log(`\nTotal Revenue: ${earnings._sum.total_paid || 0} CLP`);
  
  await prisma.$disconnect();
}

check().catch(console.error);
