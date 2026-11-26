create table public.recruit_clients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  contact_name text,
  contact_email text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique (tenant_id, id)
);

create table public.recruit_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  client_id uuid,
  title text not null check (char_length(title) between 1 and 160),
  location text not null default '',
  description text not null default '',
  required_skills text[] not null default '{}',
  status text not null default 'open' check (status in ('open', 'paused', 'closed')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  constraint job_client_same_tenant foreign key (tenant_id, client_id)
    references public.recruit_clients(tenant_id, id)
);

create table public.recruit_candidates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 160),
  email text,
  phone text,
  location text not null default '',
  skills text[] not null default '{}',
  experience_summary text not null default '',
  resume_text text not null default '',
  resume_path text,
  consent_recorded_at timestamptz,
  retention_until date,
  deletion_requested_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  constraint candidate_resume_requires_consent check (resume_path is null or consent_recorded_at is not null)
);

create table public.recruit_stages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  sort_order smallint not null check (sort_order between 0 and 100),
  is_terminal boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, name),
  unique (tenant_id, sort_order)
);

create table public.recruit_applications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  candidate_id uuid not null,
  job_id uuid not null,
  stage_id uuid not null,
  recruiter_id uuid not null references auth.users(id),
  human_decision text not null default 'review_pending' check (human_decision in ('review_pending', 'shortlisted', 'rejected', 'withdrawn', 'hired')),
  match_suggestion jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint application_candidate_same_tenant foreign key (tenant_id, candidate_id)
    references public.recruit_candidates(tenant_id, id) on delete cascade,
  constraint application_job_same_tenant foreign key (tenant_id, job_id)
    references public.recruit_jobs(tenant_id, id) on delete cascade,
  constraint application_stage_same_tenant foreign key (tenant_id, stage_id)
    references public.recruit_stages(tenant_id, id),
  unique (tenant_id, candidate_id, job_id)
);

create table public.recruit_interviews (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  application_id uuid not null,
  scheduled_at timestamptz not null,
  duration_minutes smallint not null default 60 check (duration_minutes between 15 and 480),
  location_or_link text not null default '',
  notes text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint interview_application_same_tenant foreign key (tenant_id, application_id)
    references public.recruit_applications(tenant_id, id) on delete cascade
);

create index recruit_jobs_tenant_status_idx on public.recruit_jobs(tenant_id, status, created_at desc);
create index recruit_candidates_tenant_name_idx on public.recruit_candidates(tenant_id, full_name);
create index recruit_applications_tenant_stage_idx on public.recruit_applications(tenant_id, stage_id);
create index recruit_interviews_tenant_schedule_idx on public.recruit_interviews(tenant_id, scheduled_at);

-- Seed default pipeline stages for existing tenants. Tenant provisioning remains the only client-callable
-- SECURITY DEFINER function; callers cannot assign roles or provide another user's identity.
insert into public.recruit_stages (tenant_id, name, sort_order, is_terminal)
select t.id, stage.name, stage.position, stage.terminal
from public.tenants t
cross join (values
  ('Applied', 0, false), ('Screening', 1, false), ('Shortlisted', 2, false),
  ('Interview', 3, false), ('Assessment', 4, false), ('Offer', 5, false),
  ('Hired', 6, true), ('Rejected', 7, true), ('Withdrawn', 8, true)
) as stage(name, position, terminal)
on conflict (tenant_id, name) do nothing;

-- Private resume bucket. Object names must begin with the tenant UUID and access is checked against
-- the authenticated user's tenant membership. Never make this bucket public.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recruit-resumes', 'recruit-resumes', false, 10485760,
  array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/msword','text/plain'])
on conflict (id) do nothing;

create function app_private.can_access_recruiting(target_tenant uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.tenant_memberships m
    where m.tenant_id = target_tenant and m.user_id = (select auth.uid())
      and m.role in ('business_owner', 'hr_admin', 'recruiter', 'hiring_manager')
  );
$$;
revoke all on function app_private.can_access_recruiting(uuid) from public;
grant execute on function app_private.can_access_recruiting(uuid) to authenticated;

grant select, insert, update, delete on public.recruit_clients, public.recruit_jobs,
  public.recruit_candidates, public.recruit_stages, public.recruit_applications,
  public.recruit_interviews to authenticated;

do $$
declare tbl text;
begin
  foreach tbl in array array['recruit_clients','recruit_jobs','recruit_candidates','recruit_stages','recruit_applications','recruit_interviews'] loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format('create policy "Recruiting tenant access" on public.%I for all to authenticated using (app_private.can_access_recruiting(tenant_id)) with check (app_private.can_access_recruiting(tenant_id))', tbl);
  end loop;
end $$;

create policy "Tenant members can read private resumes" on storage.objects
  for select to authenticated using (
    bucket_id = 'recruit-resumes'
    and app_private.can_access_recruiting(((storage.foldername(name))[1])::uuid)
  );
create policy "Recruiters can upload private resumes" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'recruit-resumes'
    and app_private.has_tenant_role(((storage.foldername(name))[1])::uuid,
      array['business_owner','hr_admin','recruiter']::public.app_role[])
  );
create policy "Recruiters can delete private resumes" on storage.objects
  for delete to authenticated using (
    bucket_id = 'recruit-resumes'
    and app_private.has_tenant_role(((storage.foldername(name))[1])::uuid,
      array['business_owner','hr_admin','recruiter']::public.app_role[])
  );
