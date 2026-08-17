const prisma = require('../db');

async function main() {
  try {
    const sql = `SELECT table_name, column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'Communication'
       ORDER BY table_name, ordinal_position;`;

    const rows = await prisma.$queryRawUnsafe(sql);

    if (!rows || rows.length === 0) {
      console.log("No 'Communication' table columns found in public schema.");
      process.exit(0);
    }

    console.table(rows.map(r => ({ table: r.table_name, column: r.column_name, type: r.data_type })));
  } catch (e) {
    console.error('Error querying information_schema:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
