import 'dotenv/config';
import { defineConfig } from '@prisma/config';

const databaseUrl = process.env.DATABASE_URL;
const isTenant = process.env.PRISMA_SCHEMA === 'tenant';

export default defineConfig({
  schema: isTenant ? 'prisma/tenant/schema.prisma' : 'prisma/admin/schema.prisma',
  migrations: {
    path: isTenant ? 'prisma/tenant/migrations' : 'prisma/admin/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: databaseUrl ? { url: databaseUrl } : undefined,
});
