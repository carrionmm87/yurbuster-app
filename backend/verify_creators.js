const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'database.sqlite');
const db = new Database(dbPath);

console.log('\n✅ Verificando creadores...\n');

try {
  // Update all creators to verified
  const updateCreators = db.prepare('UPDATE users SET is_verified = 1 WHERE role = ?');
  const result = updateCreators.run('creator');
  console.log(`✅ ${result.changes} creadores marcados como verificados`);

  // Show all creators
  const creators = db.prepare('SELECT username, is_verified FROM users WHERE role = ? ORDER BY username').all('creator');

  console.log('\n📊 Creadores verificados:');
  creators.forEach(c => {
    const status = c.is_verified ? '✅' : '❌';
    console.log(`  ${status} ${c.username}`);
  });
  console.log();

  db.close();
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  db.close();
  process.exit(1);
}
