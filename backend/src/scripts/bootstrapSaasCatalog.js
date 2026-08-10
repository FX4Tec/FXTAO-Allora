const {
    ensureBootstrapTenant,
    ensureDefaultPlan,
} = require('../services/saasCatalogService');

async function main() {
    const plan = await ensureDefaultPlan();
    const tenant = await ensureBootstrapTenant();
    console.log(JSON.stringify({
        status: 'ok',
        tenant: {
            id: tenant.id,
            slug: tenant.slug,
            display_name: tenant.display_name,
            domains: tenant.domains.map((domain) => domain.hostname),
        },
        plan: {
            id: plan.id,
            code: plan.code,
        },
    }, null, 2));
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(() => process.exit(0));
