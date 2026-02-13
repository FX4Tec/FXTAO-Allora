
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- USERS ---');
        const users = await prisma.user.findMany();
        console.table(users.map(u => ({ id: u.id, email: u.email, role: u.role })));

        console.log('\n--- TAOS ---');
        const taos = await prisma.tao.findMany({
            include: { created_by: true }
        });
        console.table(taos.map(t => ({
            id: t.id,
            project: t.project_name,
            status: t.status,
            created_by_email: t.created_by?.email,
            created_by_id: t.created_by_id
        })));

        if (taos.length === 0) {
            console.log('NO TAOS FOUND IN DB');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
