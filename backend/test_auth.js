const axios = require('axios');

async function testRegister() {
  try {
    const response = await axios.post('http://localhost:3001/api/auth/register', {
      username: 'testuser_' + Date.now(),
      password: 'password123',
      email: 'test' + Date.now() + '@example.com',
      phone: '+569' + Math.floor(Math.random() * 89999999 + 10000000),
      role: 'viewer'
    });
    console.log('Register Success:', response.data);
  } catch (error) {
    console.error('Register Error:', error.response ? error.response.data : error.message);
  }
}

async function testLoginAdmin() {
  try {
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: 'admin123' 
    });
    console.log('Login Success:', response.data);
  } catch (error) {
    console.error('Login Error:', error.response ? error.response.data : error.message);
  }
}

async function run() {
  await testRegister();
  await testLoginAdmin();
}

run();
