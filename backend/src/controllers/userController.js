const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

exports.list = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                full_name: true,
                role: true,
                is_active: true,
                can_view_restricted_tao_fields: true,
                created_at: true,
                avatar_url: true,
                auth_provider: true
            },
            orderBy: { created_at: 'desc' }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { email, password, full_name, role, can_view_restricted_tao_fields } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password_hash: hashedPassword,
                full_name,
                role: role || 'user',
                can_view_restricted_tao_fields: Boolean(can_view_restricted_tao_fields)
            },
            select: {
                id: true,
                email: true,
                full_name: true,
                role: true,
                is_active: true,
                can_view_restricted_tao_fields: true
            }
        });

        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { full_name, role, password, is_active, can_view_restricted_tao_fields } = req.body;
        const userIdToUpdate = req.params.id;
        const loggedUserId = req.userId; // Assuming auth middleware sets this

        // Prevent self-deactivation
        if (userIdToUpdate === loggedUserId && is_active === false) {
            return res.status(400).json({ error: 'Você não pode desativar seu próprio usuário.' });
        }

        const data = { full_name, role };

        if (is_active !== undefined) {
            data.is_active = is_active;
        }

        if (can_view_restricted_tao_fields !== undefined) {
            data.can_view_restricted_tao_fields = can_view_restricted_tao_fields;
        }

        if (password) {
            data.password_hash = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id: userIdToUpdate },
            data,
            select: {
                id: true,
                email: true,
                full_name: true,
                role: true,
                is_active: true,
                can_view_restricted_tao_fields: true
            }
        });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        await prisma.user.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
