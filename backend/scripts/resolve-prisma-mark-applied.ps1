<#
Resolve Prisma migration conflict by marking an already-applied migration as applied
and then deploying remaining migrations.

USAGE (PowerShell, run from repository root):
  cd backend
  pwsh ./scripts/resolve-prisma-mark-applied.ps1

This script will:
  - show current migration status
  - mark migration `20260812192041_init` as applied
  - run `prisma migrate deploy`

Make sure your `DATABASE_URL` env var is set in your shell or in .env
#>

Write-Output "Checking Prisma migrate status..."
npx prisma migrate status

$migrationName = '20260812192041_init'
Write-Output "Marking migration '$migrationName' as applied..."
npx prisma migrate resolve --applied $migrationName

Write-Output "Deploying remaining migrations..."
npx prisma migrate deploy

Write-Output "Done. If any errors occur, inspect the output and back up your database before proceeding."
