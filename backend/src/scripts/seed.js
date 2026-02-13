const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@fxtao.com';
    const password = 'admin'; // Change this in production!

    const exists = await prisma.user.findUnique({ where: { email } });

    if (!exists) {
        const password_hash = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: {
                email,
                password_hash,
                full_name: 'Super Admin',
                role: 'admin',
            },
        });
        console.log(`User ${email} created.`);
    } else {
        console.log(`User ${email} already exists.`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
