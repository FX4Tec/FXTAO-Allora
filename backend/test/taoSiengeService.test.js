const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
    buildCriticalFieldChanges,
    normalizeDocument,
    normalizeCostCenterPayload,
    validateTaoSiengePayload,
} = require('../src/services/taoSiengeService');

test('permite criar TAO somente obra sem empresa financeira', () => {
    assert.doesNotThrow(() => {
        validateTaoSiengePayload({
            registration_type: 'SOMENTE_OBRA',
            project_name: 'Residencial Aroeira',
            cost_centers: [],
        });
    });
});

test('exige empresa, area de negocio e centro de custo principal para obra e centro de custo', () => {
    assert.throws(
        () =>
            validateTaoSiengePayload({
                registration_type: 'OBRA_E_CENTRO_CUSTO',
                project_name: 'Residencial Cedro',
                responsible_company_id: 'company_1',
                cost_centers: [
                    {
                        cost_center_code: 'CC-01',
                        name: 'Centro Principal',
                        is_primary: true,
                    },
                ],
            }),
        /Área de negócio é obrigatória/
    );
});

test('permite TAO com multiplos centros de custo associados quando ha apenas um principal por finalidade', () => {
    assert.doesNotThrow(() => {
        validateTaoSiengePayload({
            registration_type: 'OBRA_E_CENTRO_CUSTO',
            project_name: 'Parque das Torres',
            responsible_company_id: 'company_1',
            financial_business_area_id: 'area_1',
            cost_centers: [
                {
                    cost_center_code: 'CC-01',
                    name: 'Centro Principal',
                    purpose: 'CLIENTE',
                    is_primary: true,
                },
                {
                    cost_center_code: 'CC-02',
                    name: 'Centro Principal Empresa',
                    purpose: 'CONSTRUTORA',
                    is_primary: true,
                },
            ],
        });
    });
});

test('rejeita dois centros principais com a mesma finalidade', () => {
    assert.throws(() => {
        validateTaoSiengePayload({
            registration_type: 'OBRA_E_CENTRO_CUSTO',
            responsible_company_id: 'company_1',
            financial_business_area_id: 'area_1',
            cost_centers: [
                { cost_center_code: 'CC-01', name: 'Cliente A', purpose: 'CLIENTE', is_primary: true },
                { cost_center_code: 'CC-02', name: 'Cliente B', purpose: 'CLIENTE', is_primary: true },
            ],
        });
    }, /no máximo um centro de custo principal por finalidade/);
});

test('preserva registros legados sem tipo de registro definido', () => {
    assert.doesNotThrow(() => {
        validateTaoSiengePayload({
            project_name: 'Registro legado',
            cost_centers: [],
        });
    });
});

test('normaliza documentos removendo caracteres nao numericos', () => {
    assert.equal(normalizeDocument('12.345.678/0001-99'), '12345678000199');
    assert.equal(normalizeDocument(' 111.222.333-44 '), '11122233344');
});

test('gera auditoria para mudancas em campos criticos e centros de custo', () => {
    const changes = buildCriticalFieldChanges(
        {
            registration_type: 'SOMENTE_OBRA',
            responsible_company_id: null,
            cost_centers: [],
        },
        {
            registration_type: 'OBRA_E_CENTRO_CUSTO',
            responsible_company_id: 'company_1',
            cost_centers: [
                { cost_center_code: 'CC-01', name: 'Principal', is_primary: true },
            ],
        }
    );

    assert.equal(changes.length, 3);
    assert.deepEqual(
        changes.map((change) => change.field),
        ['registration_type', 'responsible_company_id', 'cost_centers']
    );
});

test('migration da TAO Sienge nao contem comandos destrutivos e usa guardas de existencia', () => {
    const migrationPath = path.join(
        __dirname,
        '..',
        'prisma',
        'migrations',
        '20260703_tao_sienge_foundation',
        'migration.sql'
    );
    const sql = fs.readFileSync(migrationPath, 'utf8');

    assert.match(sql, /IF NOT EXISTS/);
    assert.doesNotMatch(sql, /\bDROP\s+TABLE\b/i);
    assert.doesNotMatch(sql, /\bTRUNCATE\b/i);
    assert.doesNotMatch(sql, /\bDELETE\s+FROM\b/i);
});

test('migration profissional da TAO preserva tabelas e dados legados', () => {
    const migrationPath = path.join(
        __dirname,
        '..',
        'prisma',
        'migrations',
        '20260720_tao_professional_structure',
        'migration.sql'
    );
    const sql = fs.readFileSync(migrationPath, 'utf8');

    assert.match(sql, /IF NOT EXISTS/);
    assert.doesNotMatch(sql, /\bDROP\s+TABLE\b/i);
    assert.doesNotMatch(sql, /\bTRUNCATE\b/i);
    assert.doesNotMatch(sql, /\bDELETE\s+FROM\b/i);
});

test('normaliza documento vinculado ao centro de custo preservando compatibilidade', async () => {
    const transaction = {
        company: { findUnique: async () => null, findFirst: async () => null, create: async () => null },
        businessArea: { findUnique: async () => null, findFirst: async () => null, create: async () => null },
        costCenterCategory: { findUnique: async () => null, findFirst: async () => null, create: async () => null },
    };

    const [costCenter] = await normalizeCostCenterPayload(transaction, [
        {
            cost_center_code: 'CC-01',
            name: 'Centro Principal',
            linked_document: '12.345.678/0001-99',
        },
    ]);

    assert.equal(costCenter.linked_document, '12.345.678/0001-99');
});
