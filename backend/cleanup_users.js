const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'database.sqlite');
const db = new Database(dbPath);

console.log('\n🧹 Limpiando usuarios...\n');

try {
  // Step 1: Update rentals - move from viewers to creators
  const updateRental = db.prepare('UPDATE rentals SET user_id = ? WHERE user_id = ?');

  updateRental.run('creator_javiera_id', '9f5bab39-8b99-49ef-a31f-1ca01657884b');
  console.log('✅ Rentals de javiera (viewer) → javiera (creator)');

  updateRental.run('creator_gatadolce_id', '510aa64d-725f-462e-b37a-448476284478');
  console.log('✅ Rentals de gatadolce (viewer) → gatadolce (creator)');

  updateRental.run('creator_donpool_id', 'a1160c37-1e18-40ac-a72b-45fc0ca6b2b2');
  console.log('✅ Rentals de donpool (viewer) → donpool (creator)');

  // Step 2: Delete viewer users
  const deleteUser = db.prepare('DELETE FROM users WHERE id = ?');

  deleteUser.run('9f5bab39-8b99-49ef-a31f-1ca01657884b');
  deleteUser.run('510aa64d-725f-462e-b37a-448476284478');
  deleteUser.run('a1160c37-1e18-40ac-a72b-45fc0ca6b2b2');
  console.log('✅ Eliminados viewers duplicados');

  // Step 3: Rename creators to remove "_creator"
  const updateUser = db.prepare('UPDATE users SET username = ? WHERE id = ?');

  updateUser.run('javiera', 'creator_javiera_id');
  console.log('✅ javiera_creator → javiera');

  updateUser.run('gatadolce', 'creator_gatadolce_id');
  console.log('✅ gatadolce_creator → gatadolce');

  updateUser.run('donpool', 'creator_donpool_id');
  console.log('✅ donpool_creator → donpool');

  console.log('\n✅ ¡Listo! Solo creadores sin "_creator"\n');

  db.close();
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  db.close();
  process.exit(1);
}
