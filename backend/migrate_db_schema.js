const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'database.sqlite');
const db = new Database(dbPath);

console.log('\n🔧 Migrando esquema de BD...\n');

try {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Add missing columns to videos table if they don't exist
  console.log('📋 Verificando columnas en tabla videos...');

  const videosInfo = db.prepare("PRAGMA table_info(videos)").all();
  const videoColumns = videosInfo.map(col => col.name);

  if (!videoColumns.includes('duration')) {
    console.log('  ➕ Agregando columna: duration');
    db.exec('ALTER TABLE videos ADD COLUMN duration INTEGER DEFAULT NULL');
  }

  if (!videoColumns.includes('category')) {
    console.log('  ➕ Agregando columna: category');
    db.exec('ALTER TABLE videos ADD COLUMN category TEXT DEFAULT "general"');
  }

  if (!videoColumns.includes('is_temporary')) {
    console.log('  ➕ Agregando columna: is_temporary');
    db.exec('ALTER TABLE videos ADD COLUMN is_temporary BOOLEAN DEFAULT false');
  }

  if (!videoColumns.includes('expires_at')) {
    console.log('  ➕ Agregando columna: expires_at');
    db.exec('ALTER TABLE videos ADD COLUMN expires_at DATETIME DEFAULT NULL');
  }

  // Add missing columns to users table if they don't exist
  console.log('\n📋 Verificando columnas en tabla users...');

  const usersInfo = db.prepare("PRAGMA table_info(users)").all();
  const userColumns = usersInfo.map(col => col.name);

  if (!userColumns.includes('id_document')) {
    console.log('  ➕ Agregando columna: id_document');
    db.exec('ALTER TABLE users ADD COLUMN id_document TEXT DEFAULT NULL');
  }

  if (!userColumns.includes('is_verified')) {
    console.log('  ➕ Agregando columna: is_verified');
    db.exec('ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT false');
  }

  // Add missing columns to rentals table if they don't exist
  console.log('\n📋 Verificando columnas en tabla rentals...');

  const rentalsInfo = db.prepare("PRAGMA table_info(rentals)").all();
  const rentalColumns = rentalsInfo.map(col => col.name);

  if (!rentalColumns.includes('paid_at')) {
    console.log('  ➕ Agregando columna: paid_at');
    db.exec('ALTER TABLE rentals ADD COLUMN paid_at DATETIME DEFAULT NULL');
  }

  console.log('\n✅ Migración completada!\n');

  // Verify structure
  console.log('📊 Verificando integridad:');
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const videoCount = db.prepare('SELECT COUNT(*) as count FROM videos').get();
  const rentalCount = db.prepare('SELECT COUNT(*) as count FROM rentals').get();

  console.log(`  Users: ${userCount.count}`);
  console.log(`  Videos: ${videoCount.count}`);
  console.log(`  Rentals: ${rentalCount.count}`);
  console.log('');

  db.close();
  process.exit(0);

} catch (error) {
  console.error('❌ Error:', error.message);
  db.close();
  process.exit(1);
}
