# Deployment And Migration Runbook

This app is designed for Netlify + PostgreSQL/Supabase and uses additive versioned migrations.

## Safe Production Upgrade

1. Set environment variables from `.env.example` in Netlify.
2. Run a production backup before any schema change:

```bash
npm run db:backup
```

3. Apply migrations:

```bash
npm run db:migrate
```

4. Deploy to Netlify.

5. If a migration must be reversed, restore the backup for full recovery or run the matching rollback:

```bash
npm run db:rollback -- 001_worker_platform
```

## Data Safety Rules

- Migrations create new tables, indexes, policies, functions, and triggers.
- Existing records are not deleted or overwritten by migrations.
- Completed payments cannot be deleted; create a reversal payment with an admin note.
- Worker, payroll, attendance, and payment queries enforce RBAC in the API and RLS in PostgreSQL.
- Uploads and salary slips should use a private storage bucket with signed URLs.

## Required Environment

- `DATABASE_URL`
- `JWT_SECRET`, minimum 24 characters
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- WhatsApp provider variables for Twilio or Interakt

## First Admin

Create the first admin after running migrations:

```bash
npm run admin:create -- "Admin" "+910000000000" "replace-with-strong-passcode"
```

For production, replace the phone and passcode immediately.
