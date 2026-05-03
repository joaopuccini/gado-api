"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const config_1 = require("@prisma/config");
exports.default = (0, config_1.defineConfig)({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "ts-node prisma/seed.ts",
    },
    datasource: {
        url: process.env.DATABASE_URL || "postgresql://gado_user:gado_password@db:5432/gado_db?schema=gado_fazendas",
    },
});
//# sourceMappingURL=prisma.config.js.map