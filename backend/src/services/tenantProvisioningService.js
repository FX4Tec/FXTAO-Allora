const { execFile, spawn } = require('child_process');

const DATABASE_NAME_PATTERN = /^[a-z][a-z0-9_]{1,62}$/;

const execFileAsync = (command, args, options = {}) => new Promise((resolve, reject) => {
    execFile(command, args, { ...options, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
            error.stderr = stderr;
            error.stdout = stdout;
            return reject(error);
        }

        return resolve({ stdout, stderr });
    });
});

const sanitizeDatabaseName = (value) => {
    const normalized = String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .replace(/_+/g, '_');

    const prefixed = normalized.startsWith('tenant_') ? normalized : `tenant_${normalized}`;
    const databaseName = prefixed.slice(0, 63).replace(/_+$/g, '');

    if (!DATABASE_NAME_PATTERN.test(databaseName)) {
        const error = new Error('Nome de banco inválido para provisionamento do tenant.');
        error.statusCode = 400;
        throw error;
    }

    return databaseName;
};

const databaseUrlForName = (databaseName, baseUrl = process.env.DATABASE_URL) => {
    if (!baseUrl) {
        const error = new Error('DATABASE_URL não configurada para provisionar banco do tenant.');
        error.statusCode = 500;
        throw error;
    }

    const url = new URL(baseUrl);
    url.pathname = `/${databaseName}`;
    return url.toString();
};

const adminDatabaseUrl = () => databaseUrlForName('postgres');

const templateDatabaseUrl = () =>
    process.env.SAAS_TENANT_TEMPLATE_DATABASE_URL || process.env.DATABASE_URL;

const databaseExists = async (databaseName) => {
    const escapedName = databaseName.replace(/'/g, "''");
    const { stdout } = await execFileAsync('psql', [
        adminDatabaseUrl(),
        '-Atc',
        `SELECT 1 FROM pg_database WHERE datname = '${escapedName}'`,
    ]);

    return stdout.trim() === '1';
};

const createDatabaseIfMissing = async (databaseName) => {
    if (await databaseExists(databaseName)) return false;

    await execFileAsync('createdb', ['--maintenance-db', adminDatabaseUrl(), databaseName]);
    return true;
};

const pipeSchema = async (sourceDatabaseUrl, targetDatabaseUrl) => new Promise((resolve, reject) => {
    const dump = spawn('pg_dump', [
        '--schema-only',
        '--no-owner',
        '--no-acl',
        '--dbname',
        sourceDatabaseUrl,
    ]);

    const restore = spawn('psql', [
        '--dbname',
        targetDatabaseUrl,
        '-v',
        'ON_ERROR_STOP=1',
    ]);

    let stderr = '';
    dump.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    restore.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    dump.on('error', reject);
    restore.on('error', reject);

    dump.stdout.pipe(restore.stdin);

    let dumpCode = null;
    let restoreCode = null;

    const done = () => {
        if (dumpCode === null || restoreCode === null) return;

        if (dumpCode !== 0 || restoreCode !== 0) {
            const error = new Error('Falha ao clonar schema para o banco do tenant.');
            error.stderr = stderr;
            reject(error);
            return;
        }

        resolve();
    };

    dump.on('close', (code) => {
        dumpCode = code;
        done();
    });

    restore.on('close', (code) => {
        restoreCode = code;
        done();
    });
});

const cloneSchemaToTenantDatabase = async (tenantDatabaseUrl) => {
    await pipeSchema(templateDatabaseUrl(), tenantDatabaseUrl);
};

const provisionTenantDatabase = async ({ slug, databaseLabel } = {}) => {
    const databaseName = sanitizeDatabaseName(databaseLabel || slug);
    const databaseUrl = databaseUrlForName(databaseName);
    const created = await createDatabaseIfMissing(databaseName);

    if (created) {
        await cloneSchemaToTenantDatabase(databaseUrl);
    }

    return {
        databaseName,
        databaseLabel: databaseName.replace(/_/g, '-'),
        databaseUrl,
        created,
    };
};

module.exports = {
    cloneSchemaToTenantDatabase,
    databaseUrlForName,
    provisionTenantDatabase,
    sanitizeDatabaseName,
};
