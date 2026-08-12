const { prisma } = require('../services/prismaService');
const { safeRecordPublicMapAudit } = require('../services/publicMapAuditService');

const clampPercentage = (value) => {
    const numericValue = Number(value || 0);
    if (!Number.isFinite(numericValue)) return 0;
    return Math.min(100, Math.max(0, numericValue));
};

const normalizeWorkRef = (value) => String(value || '').trim();

const buildWorkWhere = (workRef) => {
    const normalizedRef = normalizeWorkRef(workRef);
    const conditions = [
        { id: normalizedRef },
        { erp_number: normalizedRef },
        { public_slug: normalizedRef },
        { project_name: { equals: normalizedRef, mode: 'insensitive' } },
    ];

    if (normalizedRef.length >= 3) {
        conditions.push({ project_name: { contains: normalizedRef, mode: 'insensitive' } });
    }

    return {
        is_public_progress_enabled: true,
        OR: conditions,
    };
};

const serializeProgress = (tao) => ({
    obra: {
        id: tao.id,
        project_name: tao.project_name,
        erp_number: tao.erp_number,
        public_slug: tao.public_slug,
        sharepoint_url: tao.sharepoint_url,
    },
    items: (tao.progress_topics || [])
        .filter((item) => item.is_active !== false)
        .map((item) => ({
            id: item.id,
            topic: item.topic,
            percentage: clampPercentage(item.percentage),
            sort_order: item.sort_order || 0,
            updated_at: item.updated_at,
        })),
});

exports.show = async (req, res) => {
    const workRef = normalizeWorkRef(req.params.workRef || req.query.obra);
    const origin = String(req.headers.origin || '').trim() || null;

    if (!workRef) {
        return res.status(400).json({
            error: 'WORK_REQUIRED',
            message: 'Informe a obra pelo ID, ERP, slug publico ou nome.',
        });
    }

    try {
        const tao = await prisma.tao.findFirst({
            where: buildWorkWhere(workRef),
            include: {
                progress_topics: {
                    where: { is_active: true },
                    orderBy: [
                        { sort_order: 'asc' },
                        { topic: 'asc' },
                    ],
                },
            },
            orderBy: { updated_at: 'desc' },
        });

        if (!tao) {
            await safeRecordPublicMapAudit({
                clientKey: req.publicMapClient?.key || 'progress_chart',
                tenantSlug: req.publicMapTenant?.slug || null,
                errorCode: 'PUBLIC_PROGRESS_WORK_NOT_FOUND',
                origin,
                requestIp: req.publicMapRequestIp,
                route: req.originalUrl,
                statusCode: 404,
                success: false,
            });

            return res.status(404).json({
                error: 'PUBLIC_PROGRESS_WORK_NOT_FOUND',
                message: 'Obra nao encontrada ou nao publicada para grafico de evolucao.',
            });
        }

        const payload = serializeProgress(tao);

        await safeRecordPublicMapAudit({
            clientKey: req.publicMapClient?.key || 'progress_chart',
            tenantSlug: req.publicMapTenant?.slug || null,
            origin,
            requestIp: req.publicMapRequestIp,
            route: req.originalUrl,
            statusCode: 200,
            success: true,
        });

        return res.json({
            success: true,
            tenant: req.publicMapTenant,
            data: payload,
            last_update: tao.updated_at,
        });
    } catch (error) {
        console.error('Public progress failed:', error);
        await safeRecordPublicMapAudit({
            clientKey: req.publicMapClient?.key || 'progress_chart',
            tenantSlug: req.publicMapTenant?.slug || null,
            errorCode: 'PUBLIC_PROGRESS_FAILED',
            origin,
            requestIp: req.publicMapRequestIp,
            route: req.originalUrl,
            statusCode: 500,
            success: false,
        });

        return res.status(500).json({
            error: 'PUBLIC_PROGRESS_FAILED',
            message: 'Falha ao carregar o grafico publico de evolucao.',
        });
    }
};
