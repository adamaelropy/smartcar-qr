require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const res = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='Communication';`);
    console.log('columns:', res.rows);
  } catch (err) {
    console.error('error querying columns:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();