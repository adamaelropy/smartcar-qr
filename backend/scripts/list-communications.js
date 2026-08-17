require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const res = await client.query(`SELECT communication_id, vehicle_id, source, message, direction, created_at FROM "Communication" ORDER BY created_at DESC LIMIT 50;`);
    console.table(res.rows);
  } catch (err) {
    console.error('error querying communications:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();