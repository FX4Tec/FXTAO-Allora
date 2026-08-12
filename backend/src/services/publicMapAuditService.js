const { prisma } = require('./prismaService');

const sanitizeNullableString = (value) => {
    if (value === null || value === undefined) return null;

    const normalized = String(value).trim();
    return normalized || null;
};

const normalizeNullableInteger = (value) => {
    if (value === null || value === undefined || value === '') return null;

    const numericValue = Number(value);
    return Number.isInteger(numericValue) ? numericValue : null;
};

const recordPublicMapAudit = async (payload = {}) =>
    prisma.publicMapAuditLog.create({
        data: {
            client_key: sanitizeNullableString(payload.clientKey),
            request_ip: sanitizeNullableString(payload.requestIp),
            origin: sanitizeNullableString(payload.origin),
            success: Boolean(payload.success),
            status_code: normalizeNullableInteger(payload.statusCode) || 500,
            result_count: normalizeNullableInteger(payload.resultCount),
            error_code: sanitizeNullableString(payload.errorCode),
        },
    });

const safeRecordPublicMapAudit = async (payload = {}) => {
    try {
        await recordPublicMapAudit(payload);
    } catch (error) {
        console.error('Failed to persist public map audit log:', error.message);
    }
};

module.exports = {
    recordPublicMapAudit,
    safeRecordPublicMapAudit,
};
