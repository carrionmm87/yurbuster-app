const db = require('./database');
db.all("SELECT id, username, bank_account, bank_name, account_type, account_number FROM users WHERE role = 'creator'", (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
});
