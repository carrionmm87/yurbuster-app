const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetDatabase() {
    console.log("🧹 Iniciando borrado completo de la base de datos...");

    try {
        // Borrar dependencias primero (Rentals -> Videos -> Users)
        console.log("Borrando transacciones (Rentals)...");
        await prisma.rental.deleteMany({});
        
        console.log("Borrando videos (Videos)...");
        await prisma.video.deleteMany({});
        
        console.log("Borrando usuarios (Users)...");
        await prisma.user.deleteMany({});

        console.log("✅ Base de datos completamente limpia.");

        // Crear al "admin"
        const plainPassword = "reyderscg87";
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        console.log(`👑 Creando usuario administrador 'admin'...`);
        await prisma.user.create({
            data: {
                username: "admin",
                password: hashedPassword,
                role: "admin",
                email: "admin@yurbuster.com",
                phone: "+56900000000"
            }
        });

        console.log("✅ Usuario administrador creado exitosamente.");
        console.log("Misión Cumplida. Cierra este script de forma segura.");
        
    } catch (e) {
        console.error("❌ Error durante el reinicio de la base de datos:", e);
    } finally {
        await prisma.$disconnect();
    }
}

resetDatabase();
