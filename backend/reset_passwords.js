const db = require('./database');
const bcrypt = require('bcrypt');

async function reset() {
  const hashedPassword = await bcrypt.hash('123456', 10);
  db.run("UPDATE users SET password = ? WHERE username = ?", [hashedPassword, 'admin'], (err) => {
    if (err) console.error(err);
    else console.log("Admin password reset to 123456");
    db.run("UPDATE users SET password = ? WHERE role = 'creator'", [hashedPassword], (err2) => {
      if (err2) console.error(err2);
      else console.log("Creator passwords reset to 123456");
      process.exit(0);
    });
  });
}

reset();
