const { spawnSync } = require('child_process');
const path = require('path');

function run(cmd, args, opts = {}) {
  const allowFail = opts.allowFail || false;
  console.log(`\n> ${cmd} ${args.join(' ')}`);
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: true, ...opts });
  if (res.status !== 0) {
    console.error(`Command failed: ${cmd} ${args.join(' ')} (exit ${res.status})`);
    if (!allowFail) process.exit(res.status || 1);
  }
  return res.status;
}

(async function main() {
  try {
    // Ensure we're running from backend directory (script should be launched from backend)
    const cwd = process.cwd();
    console.log('cwd:', cwd);

    // Show migrate status (allow non-zero in case migrations are in a failed state)
    run('npx', ['prisma', 'migrate', 'status'], { allowFail: true });

    // Migrations to mark as applied (in case DB already has these changes)
    const toMark = [
      '20260812194500_add_emergency_contact_relationship',
      '20260814220000_add_service_types',
      '20260817210000_add_communication_source',
      '20260817221500_add_communication_read',
    ];

    for (const m of toMark) {
      run('npx', ['prisma', 'migrate', 'resolve', '--applied', m]);
    }

    // Deploy remaining migrations
    run('npx', ['prisma', 'migrate', 'deploy']);

    console.log('\nAll done. If any command failed, review the output above.');
  } catch (e) {
    console.error('Error running resolve script:', e);
    process.exit(1);
  }
})();
