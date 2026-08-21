# Feature Coverage

## Worker App

- Hindi and English toggle.
- Fast mobile production entry.
- Pending-by-default submissions.
- Attendance login/logout.
- Earnings and pending approval summary.
- Voice and QR controls are present for extension hooks.

## Admin Dashboard

- Analytics cards.
- Product-wise chart.
- Pending approval queue.
- Product creation.
- Payment history.
- CSV export.
- WhatsApp statement API.

## Backend Modules

- Workers
- Products
- Product rates
- Production logs
- Approvals
- Attendance
- Payroll calculation
- Payments
- Notifications
- Audit logs
- Exports
- WhatsApp integration

## Advanced Extension Points

- Voice production entry can attach browser speech recognition to the worker quantity field.
- QR attendance can write QR token data into `attendance.qr_code`.
- Batch tracking and inventory can be added with additive migrations.
- Multi-factory support can extend `departments` into a factory hierarchy.
