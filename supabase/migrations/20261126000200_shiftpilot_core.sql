create table public.tenant_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  timezone text not null default 'UTC',
  weekly_holidays smallint[] not null default array[0, 6]::smallint[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_weekdays check (weekly_holidays <@ array[0,1,2,3,4,5,6]::smallint[])
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, name)
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  employee_code text not null check (char_length(employee_code) between 1 and 80),
  full_name text not null check (char_length(full_name) between 1 and 160),
  email text,
  department_id uuid,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, employee_code),
  constraint employee_department_same_tenant foreign key (tenant_id, department_id)
    references public.departments(tenant_id, id)
);

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  start_time time not null,
  end_time time not null,
  grace_period_minutes integer not null default 0 check (grace_period_minutes between 0 and 240),
  late_threshold_minutes integer not null default 0 check (late_threshold_minutes between 0 and 1440),
  early_exit_threshold_minutes integer not null default 0 check (early_exit_threshold_minutes between 0 and 1440),
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, name)
);

create table public.attendance_imports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  source_name text not null check (char_length(source_name) between 1 and 255),
  total_rows integer not null check (total_rows between 1 and 5000),
  created_at timestamptz not null default now(),
  unique (tenant_id, id)
);

create table public.attendance_import_rows (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  import_id uuid not null,
  row_number integer not null check (row_number > 0),
  raw_data jsonb not null,
  employee_code text,
  work_date_text text,
  clock_in_text text,
  clock_out_text text,
  shift_name text,
  status text not null check (status in ('ready', 'unmatched', 'invalid', 'duplicate', 'imported')),
  message text,
  created_at timestamptz not null default now(),
  constraint import_row_same_tenant foreign key (tenant_id, import_id)
    references public.attendance_imports(tenant_id, id) on delete cascade,
  unique (import_id, row_number)
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  employee_id uuid not null,
  work_date date not null,
  clock_in timestamptz,
  clock_out timestamptz,
  shift_id uuid,
  import_id uuid,
  source text not null default 'manual' check (source in ('manual', 'import')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_employee_same_tenant foreign key (tenant_id, employee_id)
    references public.employees(tenant_id, id),
  constraint attendance_shift_same_tenant foreign key (tenant_id, shift_id)
    references public.shifts(tenant_id, id),
  constraint attendance_import_same_tenant foreign key (tenant_id, import_id)
    references public.attendance_imports(tenant_id, id),
  constraint clock_out_after_clock_in check (clock_out is null or clock_in is null or clock_out > clock_in)
);

create index employees_tenant_name_idx on public.employees (tenant_id, full_name);
create index attendance_tenant_date_idx on public.attendance_records (tenant_id, work_date desc);
create index attendance_employee_date_idx on public.attendance_records (tenant_id, employee_id, work_date desc);
create index import_rows_tenant_created_idx on public.attendance_import_rows (tenant_id, created_at desc);

-- Browser signup cannot choose a privileged role. The new authenticated user becomes only this tenant's owner.
create function public.provision_business(p_name text, p_timezone text default 'UTC')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_tenant_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 160 then
    raise exception 'Business name must be 1-160 characters';
  end if;
  if p_timezone is null or not exists (select 1 from pg_timezone_names where name = p_timezone) then
    raise exception 'Choose a valid time zone';
  end if;
  insert into public.tenants(name) values (btrim(p_name)) returning id into new_tenant_id;
  insert into public.tenant_memberships(tenant_id, user_id, role)
    values (new_tenant_id, auth.uid(), 'business_owner');
  insert into public.tenant_settings(tenant_id, timezone)
    values (new_tenant_id, p_timezone);
  return new_tenant_id;
end;
$$;
revoke all on function public.provision_business(text, text) from public, anon;
grant execute on function public.provision_business(text, text) to authenticated;

grant select on public.tenant_settings, public.departments, public.employees, public.shifts,
  public.attendance_imports, public.attendance_import_rows, public.attendance_records to authenticated;
grant insert, update on public.departments, public.employees, public.shifts, public.attendance_records to authenticated;
grant insert on public.attendance_imports, public.attendance_import_rows to authenticated;
grant update on public.attendance_import_rows to authenticated;
grant insert on public.audit_logs to authenticated;

alter table public.tenant_settings enable row level security;
alter table public.departments enable row level security;
alter table public.employees enable row level security;
alter table public.shifts enable row level security;
alter table public.attendance_imports enable row level security;
alter table public.attendance_import_rows enable row level security;
alter table public.attendance_records enable row level security;

create policy "Members read settings" on public.tenant_settings for select to authenticated
  using (app_private.is_tenant_member(tenant_id));
create policy "Owners manage settings" on public.tenant_settings for update to authenticated
  using (app_private.has_tenant_role(tenant_id, array['business_owner']::public.app_role[]))
  with check (app_private.has_tenant_role(tenant_id, array['business_owner']::public.app_role[]));

create policy "Members read departments" on public.departments for select to authenticated using (app_private.is_tenant_member(tenant_id));
create policy "HR manage departments" on public.departments for all to authenticated
  using (app_private.has_tenant_role(tenant_id, array['business_owner','hr_admin']::public.app_role[]))
  with check (app_private.has_tenant_role(tenant_id, array['business_owner','hr_admin']::public.app_role[]));
create policy "Members read employees" on public.employees for select to authenticated using (app_private.is_tenant_member(tenant_id));
create policy "HR manage employees" on public.employees for all to authenticated
  using (app_private.has_tenant_role(tenant_id, array['business_owner','hr_admin']::public.app_role[]))
  with check (app_private.has_tenant_role(tenant_id, array['business_owner','hr_admin']::public.app_role[]));
create policy "Members read shifts" on public.shifts for select to authenticated using (app_private.is_tenant_member(tenant_id));
create policy "HR manage shifts" on public.shifts for all to authenticated
  using (app_private.has_tenant_role(tenant_id, array['business_owner','hr_admin']::public.app_role[]))
  with check (app_private.has_tenant_role(tenant_id, array['business_owner','hr_admin']::public.app_role[]));
create policy "HR read attendance imports" on public.attendance_imports for select to authenticated
  using (app_private.has_tenant_role(tenant_id, array['business_owner','hr_admin']::public.app_role[]));
create policy "HR create attendance imports" on public.attendance_imports for insert to authenticated
  with check (created_by = (select auth.uid()) and app_private.has_tenant_role(tenant_id, array['business_owner','hr_admin']::public.app_role[]));
create policy "HR read import rows" on public.attendance_import_rows for select to authenticated
  using (app_private.has_tenant_role(tenant_id, array['business_owner','hr_admin']::public.app_role[]));
create policy "HR create import rows" on public.attendance_import_rows for insert to authenticated
  with check (app_private.has_tenant_role(tenant_id, array['business_owner','hr_admin']::public.app_role[]));
create policy "HR update import rows" on public.attendance_import_rows for update to authenticated
  using (app_private.has_tenant_role(tenant_id, array['business_owner','hr_admin']::public.app_role[]))
  with check (app_private.has_tenant_role(tenant_id, array['business_owner','hr_admin']::public.app_role[]));
create policy "Members read attendance" on public.attendance_records for select to authenticated
  using (app_private.is_tenant_member(tenant_id));
create policy "HR manage attendance" on public.attendance_records for all to authenticated
  using (app_private.has_tenant_role(tenant_id, array['business_owner','hr_admin']::public.app_role[]))
  with check (app_private.has_tenant_role(tenant_id, array['business_owner','hr_admin']::public.app_role[]));
create policy "HR create audit entries" on public.audit_logs for insert to authenticated
  with check (actor_user_id = (select auth.uid()) and app_private.has_tenant_role(tenant_id, array['business_owner','hr_admin']::public.app_role[]));
