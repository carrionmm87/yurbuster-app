const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'database.sqlite');
const db = new Database(dbPath);

console.log('\n🔧 Arreglando creadores...\n');

try {
  // Delete viewer users that conflict
  const deleteUser = db.prepare('DELETE FROM users WHERE id = ?');

  const viewersToDelete = [
    '9f5bab39-8b99-49ef-a31f-1ca01657884b', // javiera viewer
    '510aa64d-725f-462e-b37a-448476284478', // gatadolce viewer
    'a1160c37-1e18-40ac-a72b-45fc0ca6b2b2'  // donpool viewer
  ];

  for (const id of viewersToDelete) {
    deleteUser.run(id);
    console.log(`✅ Eliminado usuario viewer: ${id}`);
  }

  // Now rename creators
  const updateUser = db.prepare(`UPDATE users SET username = ? WHERE id = ?`);

  const renames = [
    { id: 'creator_javiera_id', newName: 'javiera' },
    { id: 'creator_gatadolce_id', newName: 'gatadolce' },
    { id: 'creator_donpool_id', newName: 'donpool' }
  ];

  for (const rename of renames) {
    updateUser.run(rename.newName, rename.id);
    console.log(`✅ Renombrado: ${rename.id} → ${rename.newName}`);
  }

  console.log('\n✅ Completado!\n');

  db.close();
  process.exit(0);

} catch (error) {
  console.error('❌ Error:', error.message);
  db.close();
  process.exit(1);
}
