const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'database.sqlite');
const db = new Database(dbPath);

console.log('\n👤 Renombrando creadores...\n');

try {
  const updateUser = db.prepare(`UPDATE users SET username = ? WHERE id = ?`);

  // Rename creators
  const renames = [
    { id: 'creator_javiera_id', newName: 'javiera' },
    { id: 'creator_gatadolce_id', newName: 'gatadolce' },
    { id: 'creator_donpool_id', newName: 'donpool' }
  ];

  for (const rename of renames) {
    updateUser.run(rename.newName, rename.id);
    console.log(`✅ ${rename.id} → ${rename.newName}`);
  }

  console.log('\n✅ Renombrado completado!\n');

  db.close();
  process.exit(0);

} catch (error) {
  console.error('❌ Error:', error.message);
  db.close();
  process.exit(1);
}
