-- Run with: npx supabase test db
-- Tests database RLS with two authenticated users belonging to different tenants.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
 ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'rls-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
 ('20000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'rls-b@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.tenants (id, name) values
 ('a0000000-0000-4000-8000-000000000001', 'RLS test tenant A'),
 ('b0000000-0000-4000-8000-000000000002', 'RLS test tenant B');
insert into public.tenant_memberships (tenant_id, user_id, role) values
 ('a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'business_owner'),
 ('b0000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'hr_admin');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select is((select count(*) from public.tenants), 1::bigint, 'Tenant A sees only its tenant');
select is((select count(*) from public.tenant_memberships), 1::bigint, 'Tenant A sees only its membership');
select is((select count(*) from public.profiles), 1::bigint, 'User sees only own profile');
select ok(not has_table_privilege('authenticated', 'public.tenant_memberships', 'INSERT'), 'Authenticated users cannot grant memberships');

select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', true);
select is((select count(*) from public.tenants), 1::bigint, 'Tenant B sees only its tenant');
select is((select count(*) from public.tenant_memberships), 1::bigint, 'Tenant B sees only its membership');
select is((select count(*) from public.profiles), 1::bigint, 'Tenant B user sees only own profile');
select ok(not has_table_privilege('authenticated', 'public.tenants', 'INSERT'), 'Authenticated users cannot create arbitrary tenants');

select * from finish();
rollback;
