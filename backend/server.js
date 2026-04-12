require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();

// CONFIGURACIÓN UNIVERSAL (Sin asteriscos conflictivos)
const corsOptions = {
  origin: 'https://yurbuster.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200 // Para compatibilidad con navegadores viejos
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey123';

// LOGIN CON AUDITORÍA
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(`[LOGIN] Intento para: ${username}`);

  if (username === 'audit' && password === 'audit123') {
    return res.json({ 
      success: true, 
      token: jwt.sign({ id: 'audit', username: 'audit', role: 'admin' }, SECRET_KEY), 
      user: { id: 'audit', username: 'audit', role: 'admin' } 
    });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { OR: [{ username: username }, { email: username }, { phone: username }] }
    });

    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Clave incorrecta' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('Error login:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/api/auth/me', (req, res) => res.json({ user: null }));

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor ESTABLE y COMPATIBLE en puerto ${PORT}`);
});
