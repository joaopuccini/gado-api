import { PrismaClient } from '@prisma/client';
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function run() {
  const databaseUrl = process.env.DATABASE_URL || '';
  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });
  const animals = await client.animal.findMany();
  console.log('ANIMALS: ', animals);
  await client.$disconnect();
}
run().catch(console.error);
