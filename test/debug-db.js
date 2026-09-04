require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const client = new PrismaClient();

async function run() {
  const animals = await client.animal.findMany();
  console.log("All animals in default DB:", JSON.stringify(animals, null, 2));
  
  const fazendas = await client.fazenda.findMany();
  console.log("All fazendas in default DB:", JSON.stringify(fazendas, null, 2));
  await client.$disconnect();
}

run().catch(console.error);
