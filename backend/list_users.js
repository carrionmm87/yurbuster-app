const db = require('./database');
db.all("SELECT username, role FROM users", (err, rows) => {
  if (err) console.error(err);
  else rows.forEach(r => console.log(`${r.username} (${r.role})`));
  process.exit(0);
});
