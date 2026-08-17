require('dotenv').config();
const { Client } = require('pg');
(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const res = await client.query('SELECT user_id, username FROM "User" ORDER BY user_id LIMIT 50;');
    console.table(res.rows);
  } catch (err) {
    console.error('error querying users:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();