const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'database.sqlite');
const db = new Database(dbPath);

console.log('\n🔐 Actualizando usuarios...\n');

try {
  // 1. Hash the new password
  const hashedPassword = bcrypt.hashSync('cometas.811', 10);

  // 2. Update gatadolce's password
  const updateGatadolce = db.prepare('UPDATE users SET password = ? WHERE username = ?');
  const result = updateGatadolce.run(hashedPassword, 'gatadolce');
  console.log(`✅ Contraseña de gatadolce actualizada (filas afectadas: ${result.changes})`);

  // 3. Delete all users EXCEPT gatadolce, Mankekeee, and admins
  const deleteOthers = db.prepare(
    'DELETE FROM users WHERE username NOT IN (?, ?) AND role != ?'
  );
  const deleteResult = deleteOthers.run('gatadolce', 'Mankekeee', 'admin');
  console.log(`✅ Eliminados ${deleteResult.changes} usuarios`);

  // Verify final state
  const users = db.prepare('SELECT id, username, role FROM users ORDER BY username').all();

  console.log('\n📊 Usuarios finales:');
  users.forEach(user => {
    console.log(`  - ${user.username} (${user.role})`);
  });

  console.log(`\n✅ Total: ${users.length} usuarios\n`);

  db.close();
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  db.close();
  process.exit(1);
}
