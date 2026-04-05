const db = require('./database');

db.all("SELECT username, role, email, phone FROM users", (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log("Usuarios en el sistema:");
  console.table(rows);
  process.exit(0);
});
