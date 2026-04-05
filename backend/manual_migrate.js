const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  const columns = [
    { name: 'bank_name', table: 'users' },
    { name: 'account_type', table: 'users' },
    { name: 'account_number', table: 'users' },
    { name: 'payout_email', table: 'users' },
    { name: 'paid_at', table: 'rentals', type: 'DATETIME' }
  ];

  columns.forEach(col => {
    db.all(`PRAGMA table_info(${col.table})`, (err, rows) => {
      if (rows && !rows.find(r => r.name === col.name)) {
        const type = col.type || 'TEXT';
        db.run(`ALTER TABLE ${col.table} ADD COLUMN ${col.name} ${type}`, (err) => {
          if (err) console.error(`Error adding ${col.name} to ${col.table}:`, err.message);
          else console.log(`Added ${col.name} to ${col.table}`);
        });
      }
    });
  });
});

setTimeout(() => {
  db.close();
  console.log('Migration finished.');
}, 2000);
