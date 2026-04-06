const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'prisma', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // --- USERS TABLE ---
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'viewer',
      bank_account TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration for users: add role, email, phone if missing
  db.all("PRAGMA table_info(users)", (err, rows) => {
    if (rows) {
      if (!rows.find(r => r.name === 'role')) {
        db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'viewer'");
        console.log("Migration: Added 'role' column to users table.");
      }
      if (!rows.find(r => r.name === 'email')) {
        db.run("ALTER TABLE users ADD COLUMN email TEXT");
        console.log("Migration: Added 'email' column to users table.");
      }
      if (!rows.find(r => r.name === 'phone')) {
        db.run("ALTER TABLE users ADD COLUMN phone TEXT");
        console.log("Migration: Added 'phone' column to users table.");
      }
      if (!rows.find(r => r.name === 'bank_name')) {
        db.run("ALTER TABLE users ADD COLUMN bank_name TEXT");
        console.log("Migration: Added 'bank_name' column to users table.");
      }
      if (!rows.find(r => r.name === 'account_type')) {
        db.run("ALTER TABLE users ADD COLUMN account_type TEXT");
        console.log("Migration: Added 'account_type' column to users table.");
      }
      if (!rows.find(r => r.name === 'account_number')) {
        db.run("ALTER TABLE users ADD COLUMN account_number TEXT");
        console.log("Migration: Added 'account_number' column to users table.");
      }
      if (!rows.find(r => r.name === 'payout_email')) {
        db.run("ALTER TABLE users ADD COLUMN payout_email TEXT");
        console.log("Migration: Added 'payout_email' column to users table.");
      }
      if (!rows.find(r => r.name === 'bank_holder_name')) {
        db.run("ALTER TABLE users ADD COLUMN bank_holder_name TEXT");
        console.log("Migration: Added 'bank_holder_name' column to users table.");
      }
      if (!rows.find(r => r.name === 'bank_holder_rut')) {
        db.run("ALTER TABLE users ADD COLUMN bank_holder_rut TEXT");
        console.log("Migration: Added 'bank_holder_rut' column to users table.");
      }
    }
  });

  // --- VIDEOS TABLE ---
  db.run(`
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      price REAL NOT NULL,
      filename TEXT NOT NULL,
      thumbnail TEXT,
      description TEXT,
      uploader_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploader_id) REFERENCES users(id)
    )
  `);

  // Migration for videos: add thumbnail and description if missing
  db.all("PRAGMA table_info(videos)", (err, rows) => {
    if (rows) {
      if (!rows.find(r => r.name === 'thumbnail')) {
        db.run("ALTER TABLE videos ADD COLUMN thumbnail TEXT");
        console.log("Migration: Added 'thumbnail' column to videos table.");
      }
      if (!rows.find(r => r.name === 'description')) {
        db.run("ALTER TABLE videos ADD COLUMN description TEXT");
        console.log("Migration: Added 'description' column to videos table.");
      }
    }
  });

  // --- RENTALS TABLE ---
  db.run(`
    CREATE TABLE IF NOT EXISTS rentals (
      id TEXT PRIMARY KEY,
      video_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      total_paid REAL NOT NULL,
      uploader_earned REAL NOT NULL,
      platform_fee REAL NOT NULL,
      payment_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (video_id) REFERENCES videos(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Migration for rentals: add payment_id, paid_at if missing
  db.all("PRAGMA table_info(rentals)", (err, rows) => {
    if (rows) {
      if (!rows.find(r => r.name === 'payment_id')) {
        db.run("ALTER TABLE rentals ADD COLUMN payment_id TEXT");
        console.log("Migration: Added 'payment_id' column to rentals table.");
      }
      if (!rows.find(r => r.name === 'paid_at')) {
        db.run("ALTER TABLE rentals ADD COLUMN paid_at DATETIME");
        console.log("Migration: Added 'paid_at' column to rentals table.");
      }
    }
  });
});

module.exports = db;
