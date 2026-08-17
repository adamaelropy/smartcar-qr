const prisma = require('../db');

async function main() {
  try {
    console.log('Applying read column to Communication table...');
    const sql = `ALTER TABLE "Communication" ADD COLUMN IF NOT EXISTS "read" boolean DEFAULT false;`;
    await prisma.$executeRawUnsafe(sql);
    console.log('ALTER TABLE executed. Verifying...');
    const cols = await prisma.$queryRawUnsafe(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Communication' ORDER BY ordinal_position;`);
    console.table(cols.map(c => ({ column: c.column_name, type: c.data_type })));
    console.log('Done. Restart your backend to pick up changes.');
  } catch (e) {
    console.error('Failed to apply read column:', e.message || e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
