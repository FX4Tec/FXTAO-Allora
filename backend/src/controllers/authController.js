const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Register a new user (Internal/Seed use mostly)
exports.register = async (req, res) => {
    try {
        const { email, password, full_name, role } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password_hash,
                full_name,
                role: role || 'user',
                can_view_restricted_tao_fields: Boolean(req.body.can_view_restricted_tao_fields),
            },
        });

        // Remove password from response
        const { password_hash: _, ...userWithoutPassword } = user;

        res.status(201).json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log(`Login attempt for: ${email}`);
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.log('User not found');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: 'User account is inactive' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        console.log(`Password match for ${email}: ${isMatch}`);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '1d',
        });

        const { password_hash: _, ...userWithoutPassword } = user;

        res.status(200).json({ token, user: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get current user
exports.me = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { password_hash: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Public branding used by login page (no token required)
exports.branding = async (_req, res) => {
    try {
        const configs = await prisma.systemConfig.findMany({
            where: { key: { in: ['client_logo_url'] } },
            select: { key: true, value: true }
        });
        res.json(configs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
