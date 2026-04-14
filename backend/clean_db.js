const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'database.sqlite');
const db = new Database(dbPath);

console.log('\n🧹 Limpiando BD...\n');

try {
  // Disable FK constraints temporarily for cleanup
  db.exec('PRAGMA foreign_keys = OFF;');

  // 1. Create system user for orphaned rentals
  const systemUserId = 'system-user-id';
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, username, password, role, email, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);
  insertUser.run(systemUserId, 'system', 'N/A', 'system', 'system@yurbuster.com');
  console.log('✅ Usuario system creado');

  // 2. Update all rentals: user_id -> system, paid_at -> null (pending)
  const updateRental = db.prepare('UPDATE rentals SET user_id = ?, paid_at = NULL');
  updateRental.run(systemUserId);
  console.log('✅ Todos los rentals ahora son pendientes (paid_at = NULL)');

  // 3. Delete all non-admin users
  const deleteUser = db.prepare('DELETE FROM users WHERE role NOT IN (?, ?) AND id != ?');
  deleteUser.run('admin', 'system', systemUserId);
  console.log('✅ Eliminados usuarios no-admin');

  // 4. Delete all videos (FK constraints temporarily disabled)
  const deleteVideos = db.prepare('DELETE FROM videos');
  deleteVideos.run();
  console.log('✅ Eliminados todos los videos');

  // Re-enable FK constraints
  db.exec('PRAGMA foreign_keys = ON;');

  // Verify final state
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const rentalCount = db.prepare('SELECT COUNT(*) as count FROM rentals').get();
  const videoCount = db.prepare('SELECT COUNT(*) as count FROM videos').get();

  console.log('\n📊 Estado final:');
  console.log(`  Users: ${userCount.count} (solo admins + system)`);
  console.log(`  Videos: ${videoCount.count}`);
  console.log(`  Rentals: ${rentalCount.count} (pendientes)\n`);

  db.close();
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  db.exec('PRAGMA foreign_keys = ON;');
  db.close();
  process.exit(1);
}
