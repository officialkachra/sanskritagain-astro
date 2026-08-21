begin;

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create table if not exists migration_history (
  id bigserial primary key,
  version text not null unique,
  applied_at timestamptz not null default now(),
  checksum text not null,
  rollback_file text not null
);

do $$ begin
  create type app_role as enum ('admin', 'supervisor', 'worker');
exception when duplicate_object then null; end $$;

do $$ begin
  create type approval_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type attendance_status as enum ('present', 'absent', 'half_day', 'leave');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('draft', 'completed', 'reversed');
exception when duplicate_object then null; end $$;

create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null unique,
  photo_url text,
  role app_role not null default 'worker',
  passcode_hash text,
  department_id uuid references departments(id),
  supervisor_id uuid references workers(id),
  active boolean not null default true,
  notes text,
  aadhaar_url text,
  pan_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text unique,
  category text,
  rate_per_unit numeric(12,2) not null check (rate_per_unit >= 0),
  active boolean not null default true,
  qc_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_rates (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  worker_id uuid references workers(id),
  rate_per_unit numeric(12,2) not null check (rate_per_unit >= 0),
  effective_from date not null default current_date,
  effective_to date,
  created_by uuid references workers(id),
  created_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

create table if not exists production_logs (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id),
  product_id uuid not null references products(id),
  quantity integer not null check (quantity > 0),
  rate_per_unit numeric(12,2) not null check (rate_per_unit >= 0),
  amount numeric(12,2) generated always as (quantity * rate_per_unit) stored,
  status approval_status not null default 'pending',
  work_date date not null default current_date,
  note text,
  proof_url text,
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references workers(id),
  reviewed_at timestamptz,
  rejection_reason text,
  approval_remarks text
);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  production_log_id uuid not null references production_logs(id),
  previous_status approval_status,
  new_status approval_status not null,
  old_quantity integer,
  new_quantity integer,
  remarks text,
  acted_by uuid references workers(id),
  acted_at timestamptz not null default now()
);

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id),
  attendance_date date not null default current_date,
  status attendance_status not null default 'present',
  login_at timestamptz,
  logout_at timestamptz,
  qr_code text,
  gps_lat numeric(10,7),
  gps_lng numeric(10,7),
  selfie_url text,
  notes text,
  unique(worker_id, attendance_date)
);

create table if not exists payrolls (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id),
  period_start date not null,
  period_end date not null,
  gross_earned numeric(12,2) not null default 0,
  advances numeric(12,2) not null default 0,
  bonuses numeric(12,2) not null default 0,
  penalties numeric(12,2) not null default 0,
  total_paid numeric(12,2) not null default 0,
  pending_balance numeric(12,2) not null default 0,
  generated_by uuid references workers(id),
  generated_at timestamptz not null default now(),
  salary_slip_url text,
  unique(worker_id, period_start, period_end)
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id),
  payroll_id uuid references payrolls(id),
  amount numeric(12,2) not null check (amount > 0),
  mode text not null,
  status payment_status not null default 'draft',
  notes text,
  paid_at timestamptz,
  recorded_by uuid references workers(id),
  reversal_of uuid references payments(id),
  reversal_reason text,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid references workers(id),
  title text not null,
  message text not null,
  channel text not null default 'in_app',
  read_at timestamptz,
  sent_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references workers(id),
  action text not null,
  table_name text not null,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists workers_set_updated_at on workers;
create trigger workers_set_updated_at before update on workers
for each row execute function set_updated_at();

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at before update on products
for each row execute function set_updated_at();

create or replace function prevent_completed_payment_delete()
returns trigger language plpgsql as $$
begin
  if old.status = 'completed' then
    raise exception 'Completed payments cannot be deleted. Create a reversal payment instead.';
  end if;
  return old;
end $$;

drop trigger if exists payments_prevent_completed_delete on payments;
create trigger payments_prevent_completed_delete before delete on payments
for each row execute function prevent_completed_payment_delete();

create index if not exists idx_workers_role_active on workers(role, active);
create index if not exists idx_production_worker_date on production_logs(worker_id, work_date);
create index if not exists idx_production_status on production_logs(status);
create index if not exists idx_attendance_worker_date on attendance(worker_id, attendance_date);
create index if not exists idx_payments_worker_status on payments(worker_id, status);
create index if not exists idx_audit_created_at on audit_logs(created_at desc);

alter table workers enable row level security;
alter table products enable row level security;
alter table product_rates enable row level security;
alter table production_logs enable row level security;
alter table approvals enable row level security;
alter table attendance enable row level security;
alter table payrolls enable row level security;
alter table payments enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;

create or replace function current_worker_id()
returns uuid language sql stable as $$
  select nullif(current_setting('app.worker_id', true), '')::uuid
$$;

create or replace function current_worker_role()
returns app_role language sql stable as $$
  select nullif(current_setting('app.role', true), '')::app_role
$$;

create or replace function is_admin_or_supervisor()
returns boolean language sql stable as $$
  select current_worker_role() in ('admin', 'supervisor')
$$;

drop policy if exists workers_self_or_staff on workers;
create policy workers_self_or_staff on workers
  using (id = current_worker_id() or is_admin_or_supervisor())
  with check (current_worker_role() = 'admin');

drop policy if exists products_visible on products;
create policy products_visible on products using (active = true or is_admin_or_supervisor());

drop policy if exists products_admin_write on products;
create policy products_admin_write on products for all using (current_worker_role() = 'admin') with check (current_worker_role() = 'admin');

drop policy if exists production_visibility on production_logs;
create policy production_visibility on production_logs
  using (worker_id = current_worker_id() or is_admin_or_supervisor())
  with check (worker_id = current_worker_id() or is_admin_or_supervisor());

drop policy if exists attendance_visibility on attendance;
create policy attendance_visibility on attendance
  using (worker_id = current_worker_id() or is_admin_or_supervisor())
  with check (worker_id = current_worker_id() or is_admin_or_supervisor());

drop policy if exists payroll_visibility on payrolls;
create policy payroll_visibility on payrolls using (worker_id = current_worker_id() or is_admin_or_supervisor());

drop policy if exists payment_visibility on payments;
create policy payment_visibility on payments using (worker_id = current_worker_id() or is_admin_or_supervisor());

drop policy if exists notifications_visibility on notifications;
create policy notifications_visibility on notifications using (worker_id = current_worker_id() or is_admin_or_supervisor());

drop policy if exists audit_admin_only on audit_logs;
create policy audit_admin_only on audit_logs using (current_worker_role() = 'admin');

commit;
