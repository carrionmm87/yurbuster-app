const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, 'prisma', 'database.sqlite');
const db = new Database(dbPath);

console.log('\n👤 Creando usuario admin...\n');

try {
  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (id, username, password, role, email, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);

  // Create ingrid admin user
  const hashedPassword1 = bcrypt.hashSync('ingricita2129', 10);
  insertUser.run('admin-ingrid-id', 'ingrid', hashedPassword1, 'admin', 'ingrid@yurbuster.com');

  console.log('✅ Usuario admin creado:');
  console.log('   Username: ingrid');
  console.log('   Password: ingricita2129');
  console.log('   Role: admin\n');

  // Create admin user
  const hashedPassword2 = bcrypt.hashSync('reyderscg87', 10);
  insertUser.run('admin-user-id', 'admin', hashedPassword2, 'admin', 'admin@yurbuster.com');

  console.log('✅ Usuario admin creado:');
  console.log('   Username: admin');
  console.log('   Password: reyderscg87');
  console.log('   Role: admin\n');

  db.close();
  process.exit(0);

} catch (error) {
  console.error('❌ Error:', error.message);
  db.close();
  process.exit(1);
}
