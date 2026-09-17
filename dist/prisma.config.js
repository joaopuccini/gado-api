"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const config_1 = require("@prisma/config");
const databaseUrl = process.env.DATABASE_URL;
const isTenant = process.env.PRISMA_SCHEMA === 'tenant';
exports.default = (0, config_1.defineConfig)({
    schema: isTenant ? 'prisma/tenant/schema.prisma' : 'prisma/admin/schema.prisma',
    migrations: {
        path: isTenant ? 'prisma/tenant/migrations' : 'prisma/admin/migrations',
        seed: 'ts-node prisma/seed.ts',
    },
    datasource: databaseUrl ? { url: databaseUrl } : undefined,
});
//# sourceMappingURL=prisma.config.js.map