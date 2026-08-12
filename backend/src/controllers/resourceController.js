const { prisma } = require('../services/prismaService');

const modelMap = {
    'tao-installments': 'taoInstallment',
    'tao-additives': 'taoAdditive',
    'tao-logs': 'taoLog',
    'tao-approvers': 'taoApprover',
    'tao-access-permissions': 'taoAccessPermission',
    'tao-approval-history': 'taoApprovalHistory',
    'tao-global-settings': 'taoGlobalSettings',
    'tao-contacts': 'taoContact',
    'tao-team-members': 'taoTeamMember',
    'tao-attachments': 'taoAttachment',
    'tao-progress-topics': 'taoProgressTopic',
    'tao-direct-billing-document-items': 'taoDirectBillingDocumentItem',
    'tao-initial-checklist-items': 'taoInitialChecklistItem',
    'bank-accounts': 'bankAccount',
    companies: 'company',
    clients: 'client',
    'business-areas': 'businessArea',
    'cost-center-categories': 'costCenterCategory',
    'tao-cost-centers': 'taoCostCenter',
    'tao-authorized-bank-accounts': 'taoAuthorizedBankAccount',
    'notifications': 'notification',
    'system-configs': 'systemConfig'
};

const getModel = (resourceName) => {
    const modelName = modelMap[resourceName];
    if (!modelName) return null;
    return prisma[modelName];
};

exports.list = async (req, res) => {
    const model = getModel(req.params.resource);
    if (!model) return res.status(404).json({ error: 'Resource not found' });
    try {
        // Simple filtering: exclude 'page', 'limit', 'sort' if you had them, 
        // but for now just pass everything as 'where' clause (be careful with sensitive fields in prod)
        // We'll strip empty values just in case.
        const where = {};
        for (const [key, value] of Object.entries(req.query)) {
            if (value !== undefined && value !== null && value !== '') {
                // Auto-convert boolean strings
                if (value === 'true') {
                    where[key] = true;
                } else if (value === 'false') {
                    where[key] = false;
                } else if (!isNaN(Number(value)) && key !== 'user_email' && !key.endsWith('_id') && !key.includes('phone') && !key.includes('cnpj')) {
                    // Try to convert to number if it looks like one, but be careful with IDs/Strings that look like numbers
                    // For now, let's strictly convert 'is_read' or similar flags.
                    // Actually, safer to just handle booleans for now as that's the known issue.
                    where[key] = Number(value);
                } else {
                    where[key] = value;
                }
            }
        }

        console.log(`[ResourceController] Listing ${req.params.resource} with where:`, where);
        const data = await model.findMany({ where });
        res.json(data);
    } catch (error) {
        console.error("List error:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.create = async (req, res) => {
    const model = getModel(req.params.resource);
    if (!model) return res.status(404).json({ error: 'Resource not found' });
    try {
        const data = await model.create({ data: req.body });
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.get = async (req, res) => {
    const model = getModel(req.params.resource);
    if (!model) return res.status(404).json({ error: 'Resource not found' });
    try {
        const data = await model.findUnique({ where: { id: req.params.id } });
        if (!data) return res.status(404).json({ error: 'Not found' });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.update = async (req, res) => {
    const model = getModel(req.params.resource);
    if (!model) return res.status(404).json({ error: 'Resource not found' });
    try {
        const data = await model.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.delete = async (req, res) => {
    const model = getModel(req.params.resource);
    if (!model) return res.status(404).json({ error: 'Resource not found' });
    try {
        const existing = req.params.resource === 'tao-approvers'
            ? await model.findUnique({ where: { id: req.params.id } })
            : null;

        await model.delete({ where: { id: req.params.id } });

        if (existing?.tao_id) {
            const remainingApprovalApprovers = await model.count({
                where: {
                    tao_id: existing.tao_id,
                    scope: { in: ['tao', 'both'] },
                },
            });

            if (remainingApprovalApprovers === 0) {
                await prisma.tao.update({
                    where: { id: existing.tao_id },
                    data: {
                        approval_flow_enabled: false,
                        approval_status: 'draft',
                        current_approval_level: 0,
                        tao_lifecycle_status: null,
                    },
                });
            }
        }

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
