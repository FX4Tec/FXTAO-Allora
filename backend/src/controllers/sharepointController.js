const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const STATUS_LABELS = {
    RASCUNHO: 'Em preparação',
    EM_VALIDACAO: 'Em validação',
    APROVADA: 'Aprovada',
    REPROVADA: 'Reprovada',
    CADASTRADA_NO_SIENGE: 'Cadastrada no Sienge',
    CANCELADA: 'Cancelada',
};

const isImageAttachment = (attachment) => {
    const fileType = String(attachment.file_type || '').toLowerCase();
    const fileName = String(attachment.file_name || '').toLowerCase();
    return fileType.startsWith('image/') || /\.(png|jpe?g|webp|gif|avif)$/i.test(fileName);
};

const serializeWork = (tao) => {
    const companyName = tao.responsible_company?.trade_name
        || tao.responsible_company?.legal_name
        || tao.manager_company_name
        || null;
    const clientName = tao.client?.name || tao.billing_company_name || null;
    const images = tao.attachments.filter(isImageAttachment).map((attachment) => ({
        id: attachment.id,
        name: attachment.file_name,
        url: attachment.file_url,
        contentType: attachment.file_type,
    }));

    return {
        id: tao.id,
        erpNumber: tao.erp_number,
        projectCode: tao.project_code,
        projectName: tao.project_name,
        clientCode: tao.client_code,
        clientName,
        companyCode: tao.company_code,
        companyName,
        architecture: tao.contacts.find((contact) => contact.role === 'Arquitetura')?.name || null,
        areaM2: tao.area_m2,
        status: tao.tao_lifecycle_status || tao.approval_status,
        statusLabel: STATUS_LABELS[tao.tao_lifecycle_status] || tao.approval_status,
        segment: tao.segment,
        projectType: tao.project_type,
        contractType: tao.hiring_regime_detail || tao.hiring_regime,
        startDate: tao.actual_start_date || tao.date_start,
        endDate: tao.actual_end_date || tao.date_end,
        address: {
            street: tao.construction_address,
            neighborhood: tao.construction_neighborhood,
            zipCode: tao.construction_zip,
            city: tao.construction_city,
            state: tao.construction_state,
            complement: tao.delivery_address,
        },
        costCenters: tao.cost_centers.map((costCenter) => ({
            id: costCenter.id,
            code: costCenter.cost_center_code,
            name: costCenter.name,
            purpose: costCenter.purpose,
            isPrimary: costCenter.is_primary,
        })),
        contacts: tao.contacts
            .filter((contact) => !['Contato para envio de relatorios', 'Com copia'].includes(contact.role))
            .map((contact) => ({
                id: contact.id,
                name: contact.name,
                role: contact.role,
                email: contact.email,
                phone: contact.phone,
            })),
        team: tao.team_members.map((member) => ({
            id: member.id,
            name: member.name,
            role: member.role,
            teamType: member.team_type,
        })),
        images,
        taoUrl: tao.sharepoint_url,
        updatedAt: tao.updated_at,
    };
};

exports.getWork = async (req, res) => {
    try {
        const identifier = String(req.params.identifier || '').trim();
        if (!identifier) {
            return res.status(400).json({ error: 'Identificador da obra é obrigatório.' });
        }

        const tao = await prisma.tao.findFirst({
            where: {
                OR: [
                    { id: identifier },
                    { erp_number: identifier },
                    { project_code: identifier },
                ],
            },
            include: {
                responsible_company: true,
                client: true,
                cost_centers: { orderBy: [{ is_primary: 'desc' }, { cost_center_code: 'asc' }] },
                contacts: true,
                team_members: { orderBy: [{ sort_order: 'asc' }, { name: 'asc' }] },
                attachments: true,
            },
        });

        if (!tao) {
            return res.status(404).json({ error: 'Obra não encontrada.' });
        }

        return res.status(200).json(serializeWork(tao));
    } catch (error) {
        console.error('Failed to load SharePoint work data:', error);
        return res.status(500).json({ error: 'Falha ao carregar os dados da obra.' });
    }
};
