const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });

client.connect().then(() => {
  return client.query(`SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = '_prisma_migrations'`);
}).then(res => {
  console.log(res.rows);
  client.end();
}).catch(console.error);
