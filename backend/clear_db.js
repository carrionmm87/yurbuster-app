const db = require('./database');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function clearDatabase() {
    console.log('--- Limpiando base de datos ---');
    
    // Deleting rentals
    db.run('DELETE FROM rentals', (err) => {
        if (err) console.error('Error al borrar rentals:', err.message);
        else console.log('✓ Rentals borrados');
    });

    // Deleting videos
    db.run('DELETE FROM videos', (err) => {
        if (err) console.error('Error al borrar videos:', err.message);
        else console.log('✓ Videos borrados');
    });

    // Delete files in uploads
    const uploadsDir = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        for (const file of files) {
            try {
                fs.unlinkSync(path.join(uploadsDir, file));
            } catch (e) {
                console.error(`Error al borrar ${file}:`, e.message);
            }
        }
        console.log('✓ Archivos en uploads borrados');
    }

    // Hash the new admin password
    const adminPassword = 'reyderscg87';
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

    // Keeping only 'admin' user or creating it
    db.serialize(() => {
        // Delete all users except admin (case insensitive)
        db.run("DELETE FROM users WHERE LOWER(username) != 'admin'", (err) => {
            if (err) console.error('Error al borrar usuarios:', err.message);
            else console.log('✓ Usuarios borrados (excepto admin)');
            
            // Check if admin exists
            db.get("SELECT id FROM users WHERE LOWER(username) = 'admin'", async (err, row) => {
                if (row) {
                    // Update admin password
                    db.run("UPDATE users SET password = ?, role = 'admin' WHERE LOWER(username) = 'admin'", [hashedAdminPassword], (err) => {
                        if (err) console.error('Error al actualizar admin:', err.message);
                        else console.log('✓ Usuario ADMIN actualizado con la contraseña solicitada.');
                    });
                } else {
                    // Create admin
                    const adminId = uuidv4();
                    db.run("INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)", 
                        [adminId, 'admin', hashedAdminPassword, 'admin'], (err) => {
                            if (err) console.error('Error al crear admin:', err.message);
                            else console.log('✓ Usuario ADMIN creado con la contraseña solicitada.');
                        }
                    );
                }
                
                setTimeout(() => {
                    console.log('--- Proceso terminado ---');
                    process.exit(0);
                }, 1000);
            });
        });
    });
}

clearDatabase();
