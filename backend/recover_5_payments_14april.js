/**
 * Recover 5 payments from 14-04-2026
 * All payments for video: PENDEJO ME DA RICO RICO!!
 */

require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:3001';

// Hardcoded admin token for local testing
const adminToken = 'test-admin-token';

const payments = [
  {
    orderId: '166208041',
    timestamp: new Date('2026-04-14T19:13:00'),
    amount: 1499,
    videoId: '4fa6aabd-e0ac-4d34-9e55-a5e453b49fb0',
    userId: 'db5cca84-1707-4d56-a34b-41adb47f9fb8',
    paymentMethod: 'Mach'
  },
  {
    orderId: '166208909',
    timestamp: new Date('2026-04-14T19:20:00'),
    amount: 1499,
    videoId: '4fa6aabd-e0ac-4d34-9e55-a5e453b49fb0',
    userId: 'db5cca84-1707-4d56-a34b-41adb47f9fb8',
    paymentMethod: 'Mach'
  },
  {
    orderId: '166210135',
    timestamp: new Date('2026-04-14T19:43:00'),
    amount: 1499,
    videoId: '4fa6aabd-e0ac-4d34-9e55-a5e453b49fb0',
    userId: 'a3c498c1-937a-41e6-af4f-4f797296a9a1',
    paymentMethod: 'Webpay'
  },
  {
    orderId: '166210161',
    timestamp: new Date('2026-04-14T19:44:00'),
    amount: 1499,
    videoId: '4fa6aabd-e0ac-4d34-9e55-a5e453b49fb0',
    userId: 'a92054ac-67a6-437d-89b7-675c94959670',
    paymentMethod: 'Khipu'
  },
  {
    orderId: '166214345',
    timestamp: new Date('2026-04-14T20:49:00'),
    amount: 1499,
    videoId: '4fa6aabd-e0ac-4d34-9e55-a5e453b49fb0',
    userId: '99fcdd83-3d90-41fb-aecc-82074fdcab7d',
    paymentMethod: 'Webpay'
  }
];

async function recoverPayments() {
  console.log('\n💰 Recuperando 5 pagos del 14-04-2026...\n');

  try {
    const response = await axios.post(
      `${API_URL}/api/admin/recover-payments`,
      { payments },
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Pagos recuperados exitosamente:\n');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

recoverPayments();
