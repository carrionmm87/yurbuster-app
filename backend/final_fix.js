const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'database.sqlite');
const db = new Database(dbPath);

console.log('\n🧹 Limpiando y arreglando BD...\n');

try {
  // 1. Delete viewer users that conflict
  const deleteStmt = db.prepare('DELETE FROM users WHERE username = ?');
  deleteStmt.run('javiera');
  deleteStmt.run('gatadolce');
  deleteStmt.run('donpool');
  console.log('✅ Eliminados viewers duplicados');

  // 2. Rename creators
  const updateUser = db.prepare('UPDATE users SET username = ? WHERE id = ?');

  updateUser.run('javiera', 'creator_javiera_id');
  console.log('✅ javiera_creator → javiera');

  updateUser.run('gatadolce', 'creator_gatadolce_id');
  console.log('✅ gatadolce_creator → gatadolce');

  updateUser.run('donpool', 'creator_donpool_id');
  console.log('✅ donpool_creator → donpool');

  // 3. Note: Videos keep their original owners (javiera and gatadolce)
  // Can't change owners due to rental FK constraints
  console.log('✅ Videos mantienen sus propietarios originales');

  console.log('\n✅ Listo!\n');

  db.close();
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  db.close();
  process.exit(1);
}
