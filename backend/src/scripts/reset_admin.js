
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@fxtao.com';
    const password = '123456';
    const hash = await bcrypt.hash(password, 10);

    console.log(`Resetting password for ${email}...`);

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: { password_hash: hash },
            create: {
                email,
                password_hash: hash,
                full_name: 'Admin',
                role: 'admin'
            }
        });
        console.log(`User ${user.email} updated/created successfully.`);
        console.log('New hash:', hash);
    } catch (e) {
        console.error('Error resetting password:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
