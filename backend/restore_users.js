const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'prisma', 'database.sqlite');
const db = new Database(dbPath);

console.log('\n👥 Restaurando usuarios...\n');

try {
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, username, password, role, email, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);

  // Recreate gatadolce with a temporary password
  const gatadolceId = uuidv4();
  const gatadolceHash = bcrypt.hashSync('temp123', 10);
  insertUser.run(gatadolceId, 'gatadolce', gatadolceHash, 'creator', 'gatadolce@yurbuster.com');
  console.log('✅ gatadolce restaurado');

  // Recreate Mankekeee
  const mankekeeeId = uuidv4();
  const mankekeeeHash = bcrypt.hashSync('temp123', 10);
  insertUser.run(mankekeeeId, 'Mankekeee', mankekeeeHash, 'viewer', 'mankekeee@yurbuster.com');
  console.log('✅ Mankekeee restaurado');

  // Verify
  const users = db.prepare('SELECT username, role FROM users ORDER BY username').all();
  console.log('\n📊 Usuarios actuales:');
  users.forEach(u => console.log(`  - ${u.username} (${u.role})`));
  console.log();

  db.close();
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  db.close();
  process.exit(1);
}
