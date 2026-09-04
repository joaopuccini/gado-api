require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const client = new PrismaClient();

async function run() {
  const animals = await client.animal.findMany();
  console.log("Animals in DB:", animals.length);
  console.log("Animals detail:", animals);
  client.$disconnect();
}
run();
