const DEFAULT_FX4_SUPERADMIN_EMAILS = [
    'admin@fx4.com.br',
    'alexandre.ferreira@fx4.com.br',
];

const configuredEmails = String(process.env.FX4_SUPERADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const FX4_SUPERADMIN_EMAILS = configuredEmails.length
    ? configuredEmails
    : DEFAULT_FX4_SUPERADMIN_EMAILS;

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const isFx4SuperAdminEmail = (email) => FX4_SUPERADMIN_EMAILS.includes(normalizeEmail(email));

const isFx4SuperAdmin = (user) => isFx4SuperAdminEmail(user?.email);

module.exports = {
    FX4_SUPERADMIN_EMAILS,
    isFx4SuperAdmin,
    isFx4SuperAdminEmail,
};
