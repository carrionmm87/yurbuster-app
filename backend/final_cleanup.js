const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'database.sqlite');
const db = new Database(dbPath);

console.log('\n🧹 Limpieza final...\n');

try {
  // Disable FK constraints
  db.exec('PRAGMA foreign_keys = OFF;');

  // 1. Create system user for orphaned rentals
  const systemUserId = 'system-user-id';
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, username, password, role, email, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);
  insertUser.run(systemUserId, 'system', 'N/A', 'system', 'system@yurbuster.com');
  console.log('✅ Usuario system creado');

  // 2. Update gatadolce's password FIRST
  const hashedPassword = bcrypt.hashSync('cometas.811', 10);
  const updateGatadolce = db.prepare('UPDATE users SET password = ? WHERE username = ?');
  const pwResult = updateGatadolce.run(hashedPassword, 'gatadolce');
  console.log(`✅ Contraseña de gatadolce actualizada (${pwResult.changes} filas)`);

  // 3. Update all rentals: user_id -> system, paid_at -> null
  const updateRental = db.prepare('UPDATE rentals SET user_id = ?, paid_at = NULL');
  updateRental.run(systemUserId);
  console.log('✅ Todos los rentals ahora son pendientes (paid_at = NULL)');

  // 4. Delete all users EXCEPT gatadolce, Mankekeee, and admins
  const deleteOthers = db.prepare(
    'DELETE FROM users WHERE username NOT IN (?, ?) AND role != ?'
  );
  const deleteResult = deleteOthers.run('gatadolce', 'Mankekeee', 'admin');
  console.log(`✅ Eliminados ${deleteResult.changes} usuarios no-permitidos`);

  // 5. Delete all videos
  const deleteVideos = db.prepare('DELETE FROM videos');
  deleteVideos.run();
  console.log('✅ Eliminados todos los videos');

  // Re-enable FK constraints
  db.exec('PRAGMA foreign_keys = ON;');

  // Verify final state
  const users = db.prepare('SELECT id, username, role FROM users ORDER BY username').all();
  const rentalCount = db.prepare('SELECT COUNT(*) as count FROM rentals').get();
  const videoCount = db.prepare('SELECT COUNT(*) as count FROM videos').get();

  console.log('\n📊 Estado final:');
  console.log('Usuarios:');
  users.forEach(u => console.log(`  - ${u.username} (${u.role})`));
  console.log(`\nVideos: ${videoCount.count}`);
  console.log(`Rentals: ${rentalCount.count} (pendientes)\n`);

  db.close();
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  db.exec('PRAGMA foreign_keys = ON;');
  db.close();
  process.exit(1);
}
