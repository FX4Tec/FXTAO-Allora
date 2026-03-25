const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = async (req, res, next) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                role: true,
                is_active: true,
            },
        });

        if (!user || !user.is_active) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (!['admin', 'director'].includes(user.role)) {
            return res.status(403).json({ error: 'Restricted area' });
        }

        req.currentUserRole = user.role;
        return next();
    } catch (error) {
        console.error('Role guard failed:', error);
        return res.status(500).json({ error: 'Failed to validate permissions' });
    }
};
