#!/usr/bin/env node

/**
 * Interactive Payment Data Collection Tool
 *
 * This script helps format payment order data for recovery.
 * Usage: node collect_payments.js
 */

const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

async function main() {
  console.log('\n📊 YurBuster Payment Recovery Tool\n');
  console.log('This tool will help you collect and format payment data.\n');

  const payments = [];
  let addMore = true;

  while (addMore) {
    console.log(`\n--- Payment ${payments.length + 1} ---`);

    const orderId = await question('Order ID (from payment provider): ');
    if (!orderId.trim()) {
      console.log('❌ Order ID is required. Skipping.');
      continue;
    }

    const timestampInput = await question('Timestamp (YYYY-MM-DDTHH:mm:ssZ or press Enter for now): ');
    const timestamp = timestampInput.trim() || new Date().toISOString();

    const amountInput = await question('Amount (CLP): ');
    const amount = parseInt(amountInput);
    if (isNaN(amount) || amount <= 0) {
      console.log('❌ Amount must be a positive number. Skipping.');
      continue;
    }

    const videoId = await question('Video ID (UUID): ');
    if (!videoId.trim()) {
      console.log('❌ Video ID is required. Skipping.');
      continue;
    }

    const userId = await question('User ID (UUID): ');
    if (!userId.trim()) {
      console.log('❌ User ID is required. Skipping.');
      continue;
    }

    const paymentMethod = await question('Payment Method (Webpay/Khipu/Mach/Flow): ');

    payments.push({
      orderId: orderId.trim(),
      timestamp,
      amount,
      videoId: videoId.trim(),
      userId: userId.trim(),
      paymentMethod: paymentMethod.trim() || 'Unknown'
    });

    console.log('✅ Payment added');

    const continueInput = await question('\nAdd another payment? (y/n): ');
    addMore = continueInput.toLowerCase() === 'y';
  }

  if (payments.length === 0) {
    console.log('\n❌ No payments collected.');
    rl.close();
    return;
  }

  // Save to file
  const filename = `payments_${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(payments, null, 2));

  console.log(`\n✅ ${payments.length} payment(s) saved to: ${filename}`);
  console.log('\n📋 Summary:');
  console.log(`   Total amount: ${payments.reduce((sum, p) => sum + p.amount, 0)} CLP`);
  console.log(`   Expected creator earnings: ${Math.floor(payments.reduce((sum, p) => sum + p.amount, 0) * 0.9)} CLP (90%)`);
  console.log(`   Expected platform fee: ${payments.reduce((sum, p) => sum + p.amount, 0) - Math.floor(payments.reduce((sum, p) => sum + p.amount, 0) * 0.9)} CLP (10%)`);

  console.log('\n📝 Next steps:');
  console.log(`   1. Review: cat ${filename}`);
  console.log(`   2. Submit via API:`);
  console.log(`      curl -X POST https://api.yurbuster.com/api/admin/recover-payments \\`);
  console.log(`        -H "Authorization: Bearer YOUR_TOKEN" \\`);
  console.log(`        -H "Content-Type: application/json" \\`);
  console.log(`        -d @${filename}`);
  console.log(`   3. Or use the recovery script: node recover_payments.js < ${filename}\n`);

  rl.close();
}

main().catch(console.error);
