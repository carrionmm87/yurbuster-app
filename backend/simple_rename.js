const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'database.sqlite');
const db = new Database(dbPath);

console.log('\n📝 Renombrando creadores...\n');

try {
  const updateUser = db.prepare('UPDATE users SET username = ? WHERE id = ?');

  updateUser.run('javiera', 'creator_javiera_id');
  console.log('✅ javiera_creator → javiera');

  updateUser.run('gatadolce', 'creator_gatadolce_id');
  console.log('✅ gatadolce_creator → gatadolce');

  updateUser.run('donpool', 'creator_donpool_id');
  console.log('✅ donpool_creator → donpool');

  console.log('\n✅ ¡Listo!\n');

  db.close();
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  db.close();
  process.exit(1);
}
