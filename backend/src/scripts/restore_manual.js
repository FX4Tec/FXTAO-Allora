
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
    try {
        console.log('Starting manual verification...');

        // 1. Ensure User
        const hash = await bcrypt.hash('admin', 10);
        const user = await prisma.user.upsert({
            where: { email: 'admin@fxtao.com' },
            update: {},
            create: {
                email: 'admin@fxtao.com',
                password_hash: hash,
                full_name: 'Admin',
                role: 'admin'
            }
        });
        console.log(`User confirmed: ${user.id}`);

        // 2. Try minimal TAO
        const minimalTao = await prisma.tao.create({
            data: {
                project_name: 'Minimal Test Project',
                created_by_id: user.id
            }
        });
        console.log('Minimal TAO created:', minimalTao.id);

        // 3. Try Full TAO from dump data (simulated)
        const dumpTaoData = {
            id: '692b3c4c069215add91a7026',
            project_name: 'Residencial Harmonia Gardens',
            segment: 'Residencial',
            project_type: 'Construção Nova',
            status: 'step5', // Mapped
            approval_status: 'draft',
            current_approval_level: 0,
            calculation_mode: 'manual',
            erp_number: 'OB-2024-001',
            area_m2: 12500,
            latitude: -23.5533,
            longitude: -46.6883,
            contract_company_consultancy: true,
            billing_company_name: 'Construtora Horizonte Ltda',
            billing_address: 'Av. Paulista, 1000',
            billing_zip: '01310-100',
            billing_neighborhood: 'Bela Vista',
            billing_city: 'São Paulo',
            billing_state: 'SP',
            billing_cnpj: '12.345.678/0001-90',
            construction_address: 'Rua Harmonia, 500',
            construction_zip: '05435-000',
            construction_neighborhood: 'Vila Madalena',
            construction_city: 'São Paulo',
            construction_state: 'SP',
            // Dates
            date_signature: new Date('2024-01-15'),
            date_mobilization: new Date('2026-12-30'),
            created_at: new Date('2025-11-29T18:32:44.084Z'),
            updated_at: new Date('2025-12-04T14:47:56.525Z'),
            created_by_id: user.id
        };

        // Check availability
        const existing = await prisma.tao.findUnique({ where: { id: dumpTaoData.id } });
        if (existing) {
            console.log('Target TAO already exists, skipping create.');
        } else {
            const fullTao = await prisma.tao.create({ data: dumpTaoData });
            console.log('Full TAO created:', fullTao.id);
        }

    } catch (e) {
        console.error('Error in manual script:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
