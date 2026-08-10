const { prisma } = require('../services/prismaService');


const STATUS_TO_CODE = {
    start: 'start',
    step1: '1',
    step2: '2',
    step3: '3',
    step4: '4',
    step5: '5',
};

const STATUS_TO_LABEL = {
    start: 'Iniciado',
    step1: 'Fase 1',
    step2: 'Fase 2',
    step3: 'Fase 3',
    step4: 'Fase 4',
    step5: 'Cadastrado',
};

const FRONTEND_STATUS_TO_PRISMA = {
    start: 'start',
    '1': 'step1',
    '2': 'step2',
    '3': 'step3',
    '4': 'step4',
    '5': 'step5',
    step1: 'step1',
    step2: 'step2',
    step3: 'step3',
    step4: 'step4',
    step5: 'step5',
};

const toDecimalString = (value) => (value === null || value === undefined ? null : value.toString());

const toDateString = (value) => {
    if (!value) return null;
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
};

const toDateTimeString = (value) => {
    if (!value) return null;
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
};

const normalizeStatusFilter = (value) => FRONTEND_STATUS_TO_PRISMA[String(value || '').trim()] || null;

const buildWhereFromQuery = (query = {}) => {
    const and = [];

    if (query.status) {
        const statuses = String(query.status)
            .split(',')
            .map((value) => normalizeStatusFilter(value))
            .filter(Boolean);

        if (statuses.length === 1) {
            and.push({ status: statuses[0] });
        } else if (statuses.length > 1) {
            and.push({ status: { in: statuses } });
        }
    }

    if (query.erp_number) {
        and.push({ erp_number: String(query.erp_number).trim() });
    }

    if (query.updated_since) {
        const updatedSince = new Date(query.updated_since);

        if (Number.isNaN(updatedSince.getTime())) {
            const error = new Error('Invalid updated_since value');
            error.statusCode = 400;
            throw error;
        }

        and.push({ updated_at: { gte: updatedSince } });
    }

    if (query.q) {
        const term = String(query.q).trim();

        if (term) {
            and.push({
                OR: [
                    { project_name: { contains: term, mode: 'insensitive' } },
                    { erp_number: { contains: term, mode: 'insensitive' } },
                ],
            });
        }
    }

    if (!and.length) return {};
    return { AND: and };
};

const mapWorkCore = (tao) => ({
    id: tao.id,
    erp_number: tao.erp_number || null,
    project_name: tao.project_name,
    segment: tao.segment || null,
    project_type: tao.project_type || null,
    status_key: tao.status,
    status_code: STATUS_TO_CODE[tao.status] || tao.status,
    status_label: STATUS_TO_LABEL[tao.status] || tao.status,
    approval_status: tao.approval_status,
    calculation_mode: tao.calculation_mode,
    contract_company_consultancy: tao.contract_company_consultancy,
    hiring_regime: tao.hiring_regime || null,
    area_m2: toDecimalString(tao.area_m2),
    latitude: toDecimalString(tao.latitude),
    longitude: toDecimalString(tao.longitude),
    sharepoint_url: tao.sharepoint_url || null,
    observations_general: tao.observations_general || null,
    dates: {
        signature: toDateString(tao.date_signature),
        mobilization: toDateString(tao.date_mobilization),
        start: toDateString(tao.date_start),
        end: toDateString(tao.date_end),
    },
    billing: {
        company_name: tao.billing_company_name || null,
        address: tao.billing_address || null,
        zip: tao.billing_zip || null,
        neighborhood: tao.billing_neighborhood || null,
        city: tao.billing_city || null,
        state: tao.billing_state || null,
        cnpj: tao.billing_cnpj || null,
        ie: tao.billing_ie || null,
        im: tao.billing_im || null,
        drm: tao.billing_drm || null,
        not_established: tao.billing_not_established,
    },
    construction: {
        address: tao.construction_address || null,
        zip: tao.construction_zip || null,
        neighborhood: tao.construction_neighborhood || null,
        city: tao.construction_city || null,
        state: tao.construction_state || null,
    },
    manager: {
        company_name: tao.manager_company_name || null,
        address: tao.manager_address || null,
        phone: tao.manager_phone || null,
    },
    created_at: toDateTimeString(tao.created_at),
    updated_at: toDateTimeString(tao.updated_at),
});

const mapWorkSummary = (tao) => mapWorkCore(tao);

const mapWorkDetail = (tao) => ({
    ...mapWorkCore(tao),
    created_by: tao.created_by
        ? {
            full_name: tao.created_by.full_name || null,
            email: tao.created_by.email || null,
        }
        : null,
});

const mapFinancialData = (tao) => ({
    tao_id: tao.id,
    erp_number: tao.erp_number || null,
    project_name: tao.project_name,
    status_code: STATUS_TO_CODE[tao.status] || tao.status,
    approval_status: tao.approval_status,
    bank_accounts: {
        consultancy_id: tao.bank_account_consultancy_id || null,
        construction_id: tao.bank_account_construction_id || null,
    },
    contract: {
        description: tao.contract_description || null,
        total_value: toDecimalString(tao.value_total_contract),
        billing_direct: toDecimalString(tao.value_billing_direct),
        billing_consultancy: toDecimalString(tao.value_billing_consultancy),
        billing_construction: toDecimalString(tao.value_billing_construction),
        team_technical: toDecimalString(tao.value_team_technical),
        cost_construction: toDecimalString(tao.value_cost_construction),
        taxes: toDecimalString(tao.value_taxes),
        b_revenue: toDecimalString(tao.value_b_revenue),
        rateable_1: toDecimalString(tao.value_rateable_1),
        rateable_2: toDecimalString(tao.value_rateable_2),
    },
    taxes: {
        pis_percent: toDecimalString(tao.tax_pis_percent),
        pis_value: toDecimalString(tao.tax_pis_value),
        cofins_percent: toDecimalString(tao.tax_cofins_percent),
        cofins_value: toDecimalString(tao.tax_cofins_value),
        csll_percent: toDecimalString(tao.tax_csll_percent),
        csll_value: toDecimalString(tao.tax_csll_value),
        ir_percent: toDecimalString(tao.tax_ir_percent),
        ir_value: toDecimalString(tao.tax_ir_value),
        iss_percent: toDecimalString(tao.tax_iss_percent),
        iss_value: toDecimalString(tao.tax_iss_value),
        iss_retained_client_percent: toDecimalString(tao.tax_iss_retained_client_percent),
        iss_retained_client_value: toDecimalString(tao.tax_iss_retained_client_value),
        iss_collected_company_percent: toDecimalString(tao.tax_iss_collected_company_percent),
        iss_collected_company_value: toDecimalString(tao.tax_iss_collected_company_value),
        inss_percent: toDecimalString(tao.tax_inss_percent),
        inss_value: toDecimalString(tao.tax_inss_value),
        inss_retained_client_percent: toDecimalString(tao.tax_inss_retained_client_percent),
        inss_retained_client_value: toDecimalString(tao.tax_inss_retained_client_value),
        inss_collected_company_percent: toDecimalString(tao.tax_inss_collected_company_percent),
        inss_collected_company_value: toDecimalString(tao.tax_inss_collected_company_value),
        cofins_retained_client_percent: toDecimalString(tao.tax_cofins_retained_client_percent),
        cofins_retained_client_value: toDecimalString(tao.tax_cofins_retained_client_value),
        deduction_signal_percent: toDecimalString(tao.tax_deduction_signal_percent),
        deduction_signal_value: toDecimalString(tao.tax_deduction_signal_value),
        contractual_retention_percent: toDecimalString(tao.tax_contractual_retention_percent),
        contractual_retention_value: toDecimalString(tao.tax_contractual_retention_value),
    },
    ome: {
        procedure: tao.ome_procedure || null,
        billing_company: tao.ome_billing_company,
    },
    updated_at: toDateTimeString(tao.updated_at),
});

const mapTeamMember = (member) => ({
    id: member.id,
    tao_id: member.tao_id,
    name: member.name,
    role: member.role,
    email: member.email,
    team_type: member.team_type || null,
});

const findWorkByIdentifier = async (identifier, include = {}) =>
    prisma.tao.findFirst({
        where: {
            OR: [
                { id: identifier },
                { erp_number: identifier },
            ],
        },
        include,
    });

exports.listWorks = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 200);
        const skip = (page - 1) * limit;
        const where = buildWhereFromQuery(req.query);

        const [works, total] = await Promise.all([
            prisma.tao.findMany({
                where,
                skip,
                take: limit,
                orderBy: { updated_at: 'desc' },
                include: {
                    created_by: {
                        select: {
                            full_name: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.tao.count({ where }),
        ]);

        return res.status(200).json({
            data: works.map(mapWorkSummary),
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
                synced_at: new Date().toISOString(),
                integration_client: req.integrationClient?.key || null,
            },
        });
    } catch (error) {
        console.error('Failed to list integration works:', error);
        return res.status(error.statusCode || 500).json({
            error: error.message || 'Failed to fetch works',
        });
    }
};

exports.lookupWorks = async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
        const where = buildWhereFromQuery(req.query);

        const works = await prisma.tao.findMany({
            where,
            take: limit,
            orderBy: { project_name: 'asc' },
            select: {
                id: true,
                erp_number: true,
                project_name: true,
                status: true,
                updated_at: true,
            },
        });

        return res.status(200).json({
            data: works.map((tao) => ({
                id: tao.id,
                erp_number: tao.erp_number || null,
                project_name: tao.project_name,
                status_key: tao.status,
                status_code: STATUS_TO_CODE[tao.status] || tao.status,
                status_label: STATUS_TO_LABEL[tao.status] || tao.status,
                updated_at: toDateTimeString(tao.updated_at),
            })),
        });
    } catch (error) {
        console.error('Failed to lookup integration works:', error);
        return res.status(error.statusCode || 500).json({
            error: error.message || 'Failed to lookup works',
        });
    }
};

exports.getWorkById = async (req, res) => {
    try {
        const work = await findWorkByIdentifier(req.params.id, {
            created_by: {
                select: {
                    full_name: true,
                    email: true,
                },
            },
        });

        if (!work) {
            return res.status(404).json({ error: 'Work not found' });
        }

        return res.status(200).json(mapWorkDetail(work));
    } catch (error) {
        console.error('Failed to fetch integration work:', error);
        return res.status(500).json({ error: 'Failed to fetch work' });
    }
};

exports.getWorkFinancial = async (req, res) => {
    try {
        const work = await findWorkByIdentifier(req.params.id);

        if (!work) {
            return res.status(404).json({ error: 'Work not found' });
        }

        return res.status(200).json(mapFinancialData(work));
    } catch (error) {
        console.error('Failed to fetch integration work financials:', error);
        return res.status(500).json({ error: 'Failed to fetch financial data' });
    }
};

exports.getWorkTeam = async (req, res) => {
    try {
        const work = await findWorkByIdentifier(req.params.id, {
            team_members: {
                orderBy: { name: 'asc' },
            },
        });

        if (!work) {
            return res.status(404).json({ error: 'Work not found' });
        }

        return res.status(200).json({
            tao_id: work.id,
            erp_number: work.erp_number || null,
            project_name: work.project_name,
            team: work.team_members.map(mapTeamMember),
            updated_at: toDateTimeString(work.updated_at),
        });
    } catch (error) {
        console.error('Failed to fetch integration work team:', error);
        return res.status(500).json({ error: 'Failed to fetch team data' });
    }
};
