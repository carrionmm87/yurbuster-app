require('dotenv').config({ path: 'c:/Users/USER/.gemini/antigravity/scratch/video-rental-app/backend/.env' });
const { MercadoPagoConfig, Preference } = require('mercadopago');
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-1234' });
const preference = new Preference(client);

async function test() {
  try {
    const result = await preference.create({
      body: {
        items: [{
          id: "123",
          title: "Test",
          quantity: 1,
          unit_price: 10
        }],
        back_urls: {
          success: 'http://127.0.0.1:5173/payment-success',
          failure: 'http://127.0.0.1:5173/',
          pending: 'http://127.0.0.1:5173/'
        },
        external_reference: "123"
      }
    });
    console.log("SUCCESS:", result.init_point);
  } catch(e) {
    console.error("ERROR:", e);
  }
}
test();
