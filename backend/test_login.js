const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    console.log('✅ Login exitoso:', response.data);
  } catch (error) {
    console.error('❌ Error en login:', error.response ? error.response.data : error.message);
  }
}

testLogin();
