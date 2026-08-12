const DEFAULT_FX4_SUPERADMIN_EMAILS = [
  'admin@fx4.com.br',
  'alexandre.ferreira@fx4.com.br',
];

const configuredEmails = (import.meta.env.VITE_FX4_SUPERADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const FX4_SUPERADMIN_EMAILS = configuredEmails.length
  ? configuredEmails
  : DEFAULT_FX4_SUPERADMIN_EMAILS;

export const isFx4SuperAdminEmail = (email) => (
  Boolean(email) && FX4_SUPERADMIN_EMAILS.includes(String(email).trim().toLowerCase())
);

export const isFx4SuperAdmin = (user) => isFx4SuperAdminEmail(user?.email);
