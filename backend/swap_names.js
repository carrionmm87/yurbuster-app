const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'database.sqlite');
const db = new Database(dbPath);

console.log('\n🔄 Intercambiando nombres...\n');

try {
  const updateUser = db.prepare('UPDATE users SET username = ? WHERE id = ?');

  // Step 1: Rename viewers to temp names
  updateUser.run('viewer_javiera', '9f5bab39-8b99-49ef-a31f-1ca01657884b');
  console.log('✅ javiera (viewer) → viewer_javiera');

  updateUser.run('viewer_gatadolce', '510aa64d-725f-462e-b37a-448476284478');
  console.log('✅ gatadolce (viewer) → viewer_gatadolce');

  updateUser.run('viewer_donpool', 'a1160c37-1e18-40ac-a72b-45fc0ca6b2b2');
  console.log('✅ donpool (viewer) → viewer_donpool');

  // Step 2: Rename creators to simple names
  updateUser.run('javiera', 'creator_javiera_id');
  console.log('✅ javiera_creator → javiera');

  updateUser.run('gatadolce', 'creator_gatadolce_id');
  console.log('✅ gatadolce_creator → gatadolce');

  updateUser.run('donpool', 'creator_donpool_id');
  console.log('✅ donpool_creator → donpool');

  console.log('\n✅ ¡Listo! Creadores sin "_creator"\n');

  db.close();
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  db.close();
  process.exit(1);
}
