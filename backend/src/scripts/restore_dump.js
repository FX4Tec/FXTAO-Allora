const { PrismaClient, Prisma } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Helper to whitelist fields
function filterFields(data, modelName) {
    const enumName = `${modelName}ScalarFieldEnum`;
    const EnumObj = Prisma[enumName];
    if (!EnumObj) {
        console.warn(`Enum ${enumName} not found. Returning data as-is.`);
        return data;
    }
    const validFields = new Set(Object.keys(EnumObj));
    const filtered = {};
    for (const key in data) {
        if (validFields.has(key)) {
            filtered[key] = data[key];
        }
    }
    return filtered;
}

async function main() {
    const dumpPath = path.resolve('c:/Projetos/GitHub/FXTAO/FXTAO/fx_tao_db_dump_2026-02-09.json');
    if (!fs.existsSync(dumpPath)) {
        console.error(`Dump file not found at ${dumpPath}`);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));
    console.log(`Loaded dump with ${data.taos?.length || 0} TAOs.`);

    // 1. Create Users
    const users = new Set();
    data.taos.forEach(t => {
        if (t.created_by) users.add(t.created_by);
    });
    // Also scan logs for users
    if (data.tao_logs) {
        data.tao_logs.forEach(l => {
            if (l.user_email) users.add(l.user_email);
        });
    }

    const password_hash = await bcrypt.hash('123456', 10);

    for (const email of users) {
        if (!email) continue;
        const exists = await prisma.user.findUnique({ where: { email } });
        if (!exists) {
            await prisma.user.create({
                data: {
                    email,
                    password_hash,
                    full_name: email.split('@')[0],
                    role: 'user'
                }
            });
            console.log(`Created user: ${email}`);
        }
    }

    // 2. Create Placeholder Bank Accounts
    const bankIds = ['bank_1', 'bank_2', 'bank_3', 'bank_4'];
    for (const id of bankIds) {
        const exists = await prisma.bankAccount.findUnique({ where: { id } });
        if (!exists) {
            await prisma.bankAccount.create({
                data: {
                    id,
                    description: `Bank ${id}`,
                    bank_name: 'Unknown Bank',
                    agency: '0000',
                    account_number: '00000-0'
                }
            });
            console.log(`Created placeholder bank: ${id}`);
        }
    }

    // Track created TAOs
    const createdTaoIds = new Set();

    // 3. Import TAOs and Relations
    // We need to handle dependencies.
    // TAOs first.

    for (const tao of data.taos) {
        const exists = await prisma.tao.findUnique({ where: { id: tao.id } });
        if (exists) {
            console.log(`TAO ${tao.id} already exists. Skipping.`);
            createdTaoIds.add(tao.id);
            continue;
        }

        // Clean up TAO fields that might not match schema or are null
        let taoData = { ...tao };

        // Handle date fields - convert strings to Date objects or null
        ['date_start', 'date_end', 'created_date', 'updated_date'].forEach(field => {
            if (taoData[field]) taoData[field] = new Date(taoData[field]);
        });
        // Map created_date -> created_at, updated_date -> updated_at
        taoData.created_at = taoData.created_date;
        taoData.updated_at = taoData.updated_date;

        // Connect User logic
        const createdByEmail = taoData.created_by; // store it before filtering

        // Define allowed fields based on schema.prisma
        const ALLOWED_TAO_FIELDS = [
            'id', 'created_by_id',
            'project_name', 'segment', 'project_type',
            'status', 'approval_status', 'current_approval_level', 'calculation_mode',
            'erp_number', 'area_m2', 'latitude', 'longitude',
            'contract_company_consultancy', 'hiring_regime', 'contract_description',
            'sharepoint_url', 'observations_general',
            'date_signature', 'date_mobilization', 'date_start', 'date_end',
            'billing_company_name', 'billing_address', 'billing_zip', 'billing_city',
            'billing_state', 'billing_cnpj',
            'construction_address', 'construction_city', 'construction_state',
            'manager_company_name',
            'value_total_contract', 'value_billing_direct', 'value_billing_consultancy',
            'value_billing_construction', 'value_team_technical', 'value_cost_construction',
            'value_taxes', 'value_b_revenue',
            'tax_iss_percent', 'tax_iss_value',
            'tax_inss_percent', 'tax_inss_value',
            'tax_pis_percent', 'tax_pis_value',
            'tax_cofins_percent', 'tax_cofins_value',
            'tax_csll_percent', 'tax_csll_value',
            'tax_ir_percent', 'tax_ir_value',
            'scope_project_legal_status', 'scope_project_legal_text',
            'avcb_status', 'avcb_text',
            'habite_se_status',
            'created_at', 'updated_at'
        ];

        // Filter using whitelist
        const filteredTao = {};
        for (const key of ALLOWED_TAO_FIELDS) {
            if (taoData.hasOwnProperty(key)) {
                filteredTao[key] = taoData[key];
            }
        }
        taoData = filteredTao;

        console.log(`Tao keys after strict whitelist: ${Object.keys(taoData).join(', ')}`);

        // Sanitize non-nullable Booleans and Ints
        const boolFields = ['contract_company_consultancy', 'scope_project_legal_status', 'avcb_status', 'habite_se_status'];
        boolFields.forEach(f => {
            if (taoData[f] === null || taoData[f] === undefined) taoData[f] = false;
        });

        if (taoData['current_approval_level'] === null || taoData['current_approval_level'] === undefined) {
            taoData['current_approval_level'] = 0;
        }

        // Connect User
        const user = await prisma.user.findUnique({ where: { email: createdByEmail } });
        if (user) {
            taoData.created_by = { connect: { id: user.id } };
        } else {
            console.warn(`User ${createdByEmail} not found. Fallback to admin.`);
            let admin = await prisma.user.findUnique({ where: { email: 'admin@fxtao.com' } });
            if (!admin) {
                console.log('Admin not found, creating admin...');
                const hash = await bcrypt.hash('admin', 10);
                admin = await prisma.user.create({
                    data: {
                        email: 'admin@fxtao.com',
                        password_hash: hash,
                        full_name: 'Admin',
                        role: 'admin'
                    }
                });
            }
            taoData.created_by = { connect: { id: admin.id } };
        }
        delete taoData.created_by_id; // Ensure we don't pass scalar and relation if conflicts

        // Map status '1'..'5' to Enum names
        const statusMap = {
            '1': 'step1',
            '2': 'step2',
            '3': 'step3',
            '4': 'step4',
            '5': 'step5',
            'start': 'start'
        };
        // Need to check raw status from original object since filteFields might have kept it if 'status' is valid key
        // processing
        const rawStatus = tao.status;
        if (rawStatus && statusMap[rawStatus]) {
            taoData.status = statusMap[rawStatus];
        } else {
            taoData.status = 'start'; // Default
        }

        try {
            await prisma.tao.create({ data: taoData });
            console.log(`Imported TAO: ${tao.project_name}`);
            createdTaoIds.add(tao.id);
        } catch (e) {
            if (e.code === 'P2002') {
                createdTaoIds.add(tao.id);
                console.log(`TAO ${tao.id} already exists.`);
            } else {
                const fs = require('fs');
                const errMsg = `Failed TAO ${tao.id}: ${e.message}\nDate: ${new Date().toISOString()}\n`;
                fs.writeFileSync('/app/error.log', errMsg); // Overwrite/Create
                console.error(`Logged error to /app/error.log`);
            }
        }
    }

    // 4. Import Sub-entities
    // Helper to import array of items
    const importItems = async (items, modelName, tableName) => {
        if (!items || items.length === 0) return;

        // modelName in prisma client is usually camelCase, e.g. taoInstallment
        // The ScalarFieldEnum name is usually PascalCase, e.g. TaoInstallment
        // I need to map instance model name to type name
        // Simple hack: capitalize first letter for Enum lookup
        const typeName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

        for (const item of items) {
            // Check if parent TAO exists
            if (item.tao_id && !createdTaoIds.has(item.tao_id)) {
                console.warn(`Skipping ${tableName} ${item.id} because TAO ${item.tao_id} not found.`);
                continue;
            }

            const exists = await prisma[modelName].findUnique({ where: { id: item.id } });
            if (exists) continue;

            let cleanItem = { ...item };

            // Fix dates
            ['created_date', 'updated_date', 'due_date', 'approval_date', 'paid_date'].forEach(field => {
                if (cleanItem[field]) cleanItem[field] = new Date(cleanItem[field]);
            });

            // Default Installment Type
            if (modelName === 'taoInstallment' && !cleanItem.type) {
                cleanItem.type = 'direct';
            }

            // Filter fields
            cleanItem = filterFields(cleanItem, typeName);

            try {
                await prisma[modelName].create({ data: cleanItem });
            } catch (e) {
                console.error(`Failed to import ${tableName} ${item.id}:`, e.message);
            }
        }
        console.log(`Processed ${items.length} ${tableName}.`);
    };

    await importItems(data.tao_installments, 'taoInstallment', 'installments');
    await importItems(data.tao_contacts, 'taoContact', 'contacts');
    await importItems(data.tao_attachments, 'taoAttachment', 'attachments');

    // Logs have specific fields
    if (data.tao_logs) {
        const LogEnum = Prisma.TaoLogScalarFieldEnum;
        const validLogFields = new Set(Object.keys(LogEnum));

        for (const log of data.tao_logs) {
            const exists = await prisma.taoLog.findUnique({ where: { id: log.id } });
            if (exists) continue;

            let taoId = log.tao_id;
            if (taoId && !createdTaoIds.has(taoId)) {
                taoId = null; // Detach from deleted TAO
            }

            // Map
            const cleanLog = {
                id: log.id,
                tao_id: taoId,
                user_email: log.user_email,
                action: log.action,
                details: log.details, // Json
                created_at: new Date(log.created_date)
            };

            // Filter log fields? Hand-mapped above so probably safe, 
            // but let's double check if I missed any required field.
            // Just use cleanLog.

            try {
                await prisma.taoLog.create({ data: cleanLog });
            } catch (e) {
                console.error(`Failed to import log ${log.id}:`, e.message);
            }
        }
        console.log(`Processed ${data.tao_logs.length} logs.`);
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
