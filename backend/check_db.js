const db = require('./database');
db.all('SELECT username, role FROM users', (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log('Current users:', rows);
    }
    db.close();
});
