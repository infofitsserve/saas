create schema if not exists app_private;

create type public.app_role as enum (
  'platform_super_admin',
  'business_owner',
  'hr_admin',
  'recruiter',
  'hiring_manager',
  'employee'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tenant_memberships (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id),
  constraint tenant_membership_role_not_super_admin check (role <> 'platform_super_admin')
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 1 and 120),
  resource_type text not null check (char_length(resource_type) between 1 and 120),
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index tenant_memberships_user_idx on public.tenant_memberships (user_id, tenant_id);
create index audit_logs_tenant_created_idx on public.audit_logs (tenant_id, created_at desc);

-- Security-definer membership check avoids recursive RLS evaluation on tenant_memberships.
create function app_private.is_tenant_member(target_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tenant_memberships m
    where m.tenant_id = target_tenant and m.user_id = (select auth.uid())
  );
$$;

create function app_private.has_tenant_role(target_tenant uuid, allowed_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tenant_memberships m
    where m.tenant_id = target_tenant
      and m.user_id = (select auth.uid())
      and m.role = any(allowed_roles)
  );
$$;

revoke all on schema app_private from public, anon, authenticated;
revoke all on function app_private.is_tenant_member(uuid) from public;
revoke all on function app_private.has_tenant_role(uuid, public.app_role[]) from public;
grant usage on schema app_private to authenticated;
grant execute on function app_private.is_tenant_member(uuid) to authenticated;
grant execute on function app_private.has_tenant_role(uuid, public.app_role[]) to authenticated;

grant usage on type public.app_role to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.tenants, public.tenant_memberships to authenticated;
grant select on public.audit_logs to authenticated;

alter table public.profiles enable row level security;
alter table public.tenants enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.audit_logs enable row level security;

create policy "Users can read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "Users can update own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Members can read their tenants" on public.tenants
  for select to authenticated using (app_private.is_tenant_member(id));
create policy "Members can read tenant memberships" on public.tenant_memberships
  for select to authenticated using (app_private.is_tenant_member(tenant_id));
create policy "Owners and HR admins can read audit logs" on public.audit_logs
  for select to authenticated using (
    app_private.has_tenant_role(tenant_id, array['business_owner', 'hr_admin']::public.app_role[])
  );

-- The signup trigger only creates the user's own profile. It does not accept tenant or role input.
create function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function app_private.handle_new_user() from public;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure app_private.handle_new_user();
