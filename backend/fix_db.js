const db = require('./database');

db.serialize(() => {
  // Update admin user
  db.run("UPDATE users SET role = 'admin' WHERE username = 'admin'", function(err) {
    if (err) console.error("Error updating admin:", err.message);
    else console.log("Admin user role updated to 'admin'");
  });

  // Verify roles
  db.all("SELECT username, role FROM users", (err, rows) => {
    if (err) console.error("Error fetching users:", err.message);
    else {
      console.log("Current user roles:");
      console.table(rows);
    }
    process.exit();
  });
});
