const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
console.log("Using DB at:", dbPath);

if (!fs.existsSync(dbPath)) {
  console.error("DB file not found at:", dbPath);
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);

const alterStatements = [
  "ALTER TABLE users ADD COLUMN bank_name TEXT",
  "ALTER TABLE users ADD COLUMN account_type TEXT",
  "ALTER TABLE users ADD COLUMN account_number TEXT",
  "ALTER TABLE users ADD COLUMN payout_email TEXT",
  "ALTER TABLE rentals ADD COLUMN paid_at DATETIME"
];

db.serialize(() => {
  alterStatements.forEach(sql => {
    db.run(sql, (err) => {
      if (err) {
        if (err.message.includes("duplicate column name")) {
          console.log(`Skipping: column already exists for "${sql}"`);
        } else {
          console.error(`Error running "${sql}":`, err.message);
        }
      } else {
        console.log(`Success: "${sql}"`);
      }
    });
  });
});

setTimeout(() => {
  db.close();
  console.log("Migration finalized.");
}, 3000);
