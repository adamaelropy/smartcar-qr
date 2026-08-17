<#
Marks a set of known migrations as applied and deploys remaining migrations.

Run from the `backend` folder in PowerShell:
  powershell -ExecutionPolicy Bypass -File .\scripts\resolve-remaining-migrations.ps1

Edit the `$migrationsToMark` array if you need to add/remove migration names.
Make sure `DATABASE_URL` is set in the environment or in .env before running.
#>

param()

Write-Output "Running resolve for remaining migrations..."

$migrationsToMark = @(
    '20260812194500_add_emergency_contact_relationship',
    '20260814220000_add_service_types',
    '20260817210000_add_communication_source',
    '20260817221500_add_communication_read'
)

foreach ($m in $migrationsToMark) {
    Write-Output "Marking migration '$m' as applied..."
    npx prisma migrate resolve --applied $m
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to mark migration $m as applied. Stopping."
        exit $LASTEXITCODE
    }
}

Write-Output "Deploying remaining migrations..."
npx prisma migrate deploy

if ($LASTEXITCODE -ne 0) {
    Write-Error "prisma migrate deploy failed. Inspect output above."
    exit $LASTEXITCODE
}

Write-Output "Done. Remaining migrations deployed (or already applied)."
