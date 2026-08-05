const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const legacyCandidates = (tao) => [
    {
        code: tao.center_cost_client,
        name: 'Centro de custo do cliente',
        purpose: 'CLIENTE',
        is_primary: true,
    },
    {
        code: tao.center_cost_allora,
        name: 'Centro de custo da empresa',
        purpose: 'CONSTRUTORA',
        is_primary: false,
    },
].filter((item) => item.code && String(item.code).trim());

async function main() {
    const taos = await prisma.tao.findMany({
        select: {
            id: true,
            center_cost_client: true,
            center_cost_allora: true,
            cost_centers: { select: { cost_center_code: true, purpose: true } },
        },
    });

    let created = 0;

    for (const tao of taos) {
        const existingCodes = new Set(tao.cost_centers.map((item) => `${item.cost_center_code}::${item.purpose || ''}`));

        for (const candidate of legacyCandidates(tao)) {
            const costCenterCode = String(candidate.code).trim();
            const candidateKey = `${costCenterCode}::${candidate.purpose}`;
            if (existingCodes.has(candidateKey)) continue;

            await prisma.taoCostCenter.create({
                data: {
                    tao_id: tao.id,
                    cost_center_code: costCenterCode,
                    name: candidate.name,
                    purpose: candidate.purpose,
                    is_primary: candidate.is_primary,
                    observations: 'Migrado automaticamente do campo legado; revisar antes do envio ao ERP.',
                },
            });
            existingCodes.add(candidateKey);
            created += 1;
        }
    }

    console.log(JSON.stringify({ taos: taos.length, costCentersCreated: created }));
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
