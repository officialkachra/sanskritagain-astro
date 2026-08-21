begin;

drop policy if exists audit_admin_only on audit_logs;
drop policy if exists notifications_visibility on notifications;
drop policy if exists payment_visibility on payments;
drop policy if exists payroll_visibility on payrolls;
drop policy if exists attendance_visibility on attendance;
drop policy if exists production_visibility on production_logs;
drop policy if exists products_admin_write on products;
drop policy if exists products_visible on products;
drop policy if exists workers_self_or_staff on workers;

drop trigger if exists payments_prevent_completed_delete on payments;
drop trigger if exists products_set_updated_at on products;
drop trigger if exists workers_set_updated_at on workers;

drop function if exists prevent_completed_payment_delete();
drop function if exists set_updated_at();
drop function if exists is_admin_or_supervisor();
drop function if exists current_worker_role();
drop function if exists current_worker_id();

drop table if exists audit_logs;
drop table if exists notifications;
drop table if exists payments;
drop table if exists payrolls;
drop table if exists attendance;
drop table if exists approvals;
drop table if exists production_logs;
drop table if exists product_rates;
drop table if exists products;
drop table if exists workers;
drop table if exists departments;

drop type if exists payment_status;
drop type if exists attendance_status;
drop type if exists approval_status;
drop type if exists app_role;

delete from migration_history where version = '001_worker_platform';

commit;
