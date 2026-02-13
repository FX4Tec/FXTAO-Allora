const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Map frontend status values ('1', '2', etc.) to Prisma enum values ('step1', 'step2', etc.)
const mapTaoStatus = (status) => {
    const statusMap = { '1': 'step1', '2': 'step2', '3': 'step3', '4': 'step4', '5': 'step5', 'start': 'start' };
    return statusMap[status] || status;
};

// Map Prisma enum values back to frontend values for responses
const unmapTaoStatus = (status) => {
    const reverseMap = { 'step1': '1', 'step2': '2', 'step3': '3', 'step4': '4', 'step5': '5', 'start': 'start' };
    return reverseMap[status] || status;
};

// Allowlist: only fields that exist in the Prisma Tao model
const TAO_ALLOWED_FIELDS = [
    'project_name', 'segment', 'project_type', 'status', 'approval_status',
    'current_approval_level', 'calculation_mode', 'erp_number', 'area_m2',
    'latitude', 'longitude', 'contract_company_consultancy', 'hiring_regime',
    'contract_description', 'sharepoint_url', 'observations_general',
    // Dates
    'date_signature', 'date_mobilization', 'date_start', 'date_end',
    // Billing
    'billing_company_name', 'billing_address', 'billing_zip', 'billing_neighborhood',
    'billing_city', 'billing_state', 'billing_cnpj', 'billing_ie', 'billing_im',
    'billing_drm', 'billing_not_established',
    // Construction
    'construction_address', 'construction_zip', 'construction_neighborhood',
    'construction_city', 'construction_state',
    // Manager
    'manager_company_name', 'manager_address', 'manager_phone',
    // Bank Accounts
    'bank_account_consultancy_id', 'bank_account_construction_id',
    // Financial Values
    'value_total_contract', 'value_billing_direct', 'value_billing_consultancy',
    'value_billing_construction', 'value_team_technical', 'value_cost_construction',
    'value_taxes', 'value_b_revenue', 'value_rateable_1', 'value_rateable_2',
    // Taxes - PIS, COFINS, CSLL, IR
    'tax_pis_percent', 'tax_pis_value', 'tax_cofins_percent', 'tax_cofins_value',
    'tax_csll_percent', 'tax_csll_value', 'tax_ir_percent', 'tax_ir_value',
    // Taxes - ISS
    'tax_iss_percent', 'tax_iss_value',
    'tax_iss_retained_client_percent', 'tax_iss_retained_client_value',
    'tax_iss_collected_company_percent', 'tax_iss_collected_company_value',
    // Taxes - INSS
    'tax_inss_percent', 'tax_inss_value',
    'tax_inss_retained_client_percent', 'tax_inss_retained_client_value',
    'tax_inss_collected_company_percent', 'tax_inss_collected_company_value',
    // Taxes - COFINS retained, deductions, contractual retention
    'tax_cofins_retained_client_percent', 'tax_cofins_retained_client_value',
    'tax_deduction_signal_percent', 'tax_deduction_signal_value',
    'tax_contractual_retention_percent', 'tax_contractual_retention_value',
    // OME
    'ome_procedure', 'ome_billing_company',
    // Contract Text (Step 4)
    'obligations_text', 'fines_text', 'measurements_text',
    // Scope / Docs
    'scope_project_legal_status', 'scope_project_legal_text',
    'avcb_status', 'avcb_text', 'habite_se_status',
];

// Create new TAO
exports.create = async (req, res) => {
    try {
        const body = req.body;



        const data = {};
        for (const field of TAO_ALLOWED_FIELDS) {
            if (field in body) {
                data[field] = body[field];
            }
        }

        // Map frontend status values to Prisma enum values
        if (data.status) data.status = mapTaoStatus(data.status);

        // Associate with creating user
        data.created_by_id = req.userId;

        const tao = await prisma.tao.create({
            data: data,
        });

        res.status(201).json(tao);
    } catch (error) {
        console.error('Failed to create TAO:', error);
        res.status(500).json({ error: 'Failed to create TAO', details: error.message });
    }
};

// List all TAOs (with simple pagination/filter support)
exports.list = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const skip = (page - 1) * limit;

        const where = {};
        if (status) where.status = status;

        const taos = await prisma.tao.findMany({
            where,
            skip: parseInt(skip),
            take: parseInt(limit),
            orderBy: { created_at: 'desc' },
            include: {
                created_by: { select: { full_name: true, email: true } }
            }
        });

        const total = await prisma.tao.count({ where });

        res.status(200).json({
            data: taos,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch TAOs' });
    }
};

// Get TAO by ID
exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const tao = await prisma.tao.findUnique({
            where: { id },
            include: {
                installments: true,
                additives: true,
                team_members: true,
                contacts: true,
                attachments: true,
                approvers: true,
                logs: { orderBy: { created_at: 'desc' } },
                created_by: { select: { full_name: true, email: true } }
            }
        });

        if (!tao) {
            return res.status(404).json({ error: 'TAO not found' });
        }

        res.status(200).json(tao);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch TAO' });
    }
};

// Update TAO
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body;



        const data = {};
        for (const field of TAO_ALLOWED_FIELDS) {
            if (field in body) {
                data[field] = body[field];
            }
        }

        // Map frontend status values to Prisma enum values
        if (data.status) data.status = mapTaoStatus(data.status);

        const tao = await prisma.tao.update({
            where: { id },
            data: data,
        });

        res.status(200).json(tao);
    } catch (error) {
        console.error('Failed to update TAO:', error);
        res.status(500).json({ error: 'Failed to update TAO', details: error.message });
    }
};

// Delete TAO
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.tao.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete TAO' });
    }
};
// Check Access for Deep Linking
exports.checkAccess = async (req, res) => {
    try {
        const { identifier } = req.params;
        const userId = req.userId; // From authMiddleware

        // Fetch User Details (Middleware only gives ID)
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        const userEmail = user.email;
        const userRole = user.role;

        // 1. Find TAO by ID or ERP Number
        const tao = await prisma.tao.findFirst({
            where: {
                OR: [
                    { id: identifier },
                    { erp_number: identifier }
                ]
            },
            include: {
                approvers: true,
                team_members: true,
                created_by: true
            }
        });

        if (!tao) {
            return res.status(404).json({ authorized: false, reason: 'TAO_NOT_FOUND' });
        }

        // 2. Check Permissions
        // Admin or Director -> Always Allow
        if (userRole === 'admin' || userRole === 'director') {
            return res.status(200).json({ authorized: true, taoId: tao.id, reason: 'ADMIN_OR_DIRECTOR' });
        }

        // Creator -> Always Allow
        if (tao.created_by.email === userEmail) {
            return res.status(200).json({ authorized: true, taoId: tao.id, reason: 'CREATOR' });
        }

        // Approver -> Allow
        const isApprover = tao.approvers.some(a => a.user_email === userEmail);
        if (isApprover) {
            return res.status(200).json({ authorized: true, taoId: tao.id, reason: 'APPROVER' });
        }

        // Team Member -> Allow
        const isTeamMember = tao.team_members.some(m => m.email === userEmail);
        if (isTeamMember) {
            return res.status(200).json({ authorized: true, taoId: tao.id, reason: 'TEAM_MEMBER' });
        }

        // If none match -> Deny
        return res.status(403).json({ authorized: false, taoId: tao.id, reason: 'UNAUTHORIZED' });

    } catch (error) {
        console.error('Check Access Error:', error);
        res.status(500).json({ error: 'Failed to check access' });
    }
};
