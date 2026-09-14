import 'dotenv/config';
import { defineConfig } from '@prisma/config';

const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/admin/schema.prisma',
  migrations: {
    path: 'prisma/admin/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: databaseUrl ? { url: databaseUrl } : undefined,
});
