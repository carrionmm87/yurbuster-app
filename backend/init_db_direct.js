const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, 'prisma', 'database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('\n🔧 Inicializando BD directamente...\n');

try {
  // Create users table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'viewer',
      bank_account TEXT,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      bank_name TEXT,
      account_type TEXT,
      account_number TEXT,
      payout_email TEXT,
      bank_holder_name TEXT,
      bank_holder_rut TEXT,
      id_document TEXT,
      is_verified BOOLEAN DEFAULT false,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      price INTEGER NOT NULL,
      filename TEXT NOT NULL,
      thumbnail TEXT,
      description TEXT,
      duration INTEGER,
      category TEXT DEFAULT 'general',
      is_temporary BOOLEAN DEFAULT false,
      expires_at DATETIME,
      uploader_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploader_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS rentals (
      id TEXT PRIMARY KEY,
      video_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      total_paid INTEGER NOT NULL,
      uploader_earned INTEGER NOT NULL,
      platform_fee INTEGER NOT NULL,
      payment_id TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      paid_at DATETIME,
      FOREIGN KEY (video_id) REFERENCES videos(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Insert viewers
  const viewers = [
    { id: '9f5bab39-8b99-49ef-a31f-1ca01657884b', username: 'javiera', email: 'javiera@yurbuster.com' },
    { id: '510aa64d-725f-462e-b37a-448476284478', username: 'gatadolce', email: 'gatadolce@yurbuster.com' },
    { id: 'a1160c37-1e18-40ac-a72b-45fc0ca6b2b2', username: 'donpool', email: 'donpool@yurbuster.com' }
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, username, password, role, email)
    VALUES (?, ?, ?, 'viewer', ?)
  `);

  const hashedPassword = bcrypt.hashSync('password123', 10);

  for (const user of viewers) {
    insertUser.run(user.id, user.username, hashedPassword, user.email);
    console.log(`✅ Usuario viewer: ${user.username}`);
  }

  // Insert creators
  const creators = [
    { id: 'creator_javiera_id', username: 'javiera_creator', email: 'javiera.creator@yurbuster.com' },
    { id: 'creator_gatadolce_id', username: 'gatadolce_creator', email: 'gatadolce.creator@yurbuster.com' },
    { id: 'creator_donpool_id', username: 'donpool_creator', email: 'donpool.creator@yurbuster.com' }
  ];

  for (const creator of creators) {
    insertUser.run(creator.id, creator.username, hashedPassword, creator.email);
    console.log(`✅ Usuario creator: ${creator.username}`);
  }

  // Insert videos
  const insertVideo = db.prepare(`
    INSERT OR IGNORE INTO videos (id, title, price, filename, thumbnail, description, uploader_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const videos = [
    {
      id: '849843cf-6817-4129-a12d-b9ccdcb5440',
      title: 'PENDEJO ME DA RICO!!!',
      price: 1500,
      uploader_id: 'creator_javiera_id'
    },
    {
      id: '9fd8741-8c8e-4c04-8605-d615cef3f5c8',
      title: 'Tocándome bien rico mi chochita',
      price: 1000,
      uploader_id: 'creator_gatadolce_id'
    }
  ];

  for (const video of videos) {
    insertVideo.run(
      video.id,
      video.title,
      video.price,
      `video_${video.id}.mp4`,
      `thumb_${video.id}.jpg`,
      'Video exclusivo',
      video.uploader_id
    );
    console.log(`✅ Video: ${video.title}`);
  }

  console.log('\n✅ BD inicializada correctamente!\n');
  db.close();

} catch (error) {
  console.error('❌ Error:', error.message);
  db.close();
  process.exit(1);
}
