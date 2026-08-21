# Security Model

- Authentication uses an HTTP-only JWT cookie with an 8-hour expiry.
- Roles are `admin`, `supervisor`, and `worker`.
- Workers can only read their own production, attendance, payroll, payment, and notification rows.
- Admins can manage workers, products, rates, approvals, payments, exports, WhatsApp statements, and analytics.
- Supervisors can approve and report, but payment writes are admin-only.
- PostgreSQL RLS policies use per-request `app.worker_id` and `app.role` settings.
- Audit logs are written for worker creation, products, production submissions, approvals, attendance, and payments.
- Netlify headers enforce HTTPS, HSTS, frame denial, MIME sniffing protection, and referrer policy.

Recommended production additions:

- Use real OTP through Twilio, Interakt, or another provider.
- Store Aadhaar/PAN/proof images in private buckets only.
- Enable daily managed Postgres backups.
- Restrict database network access to trusted platforms.
- Add a WAF/rate limit in front of auth endpoints.
