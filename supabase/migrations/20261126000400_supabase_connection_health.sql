-- Safe connectivity probe: returns no project or tenant data and is callable by publishable-key clients.
create or replace function public.connection_health()
returns boolean
language sql
immutable
security invoker
set search_path = ''
as $$
  select true;
$$;

revoke all on function public.connection_health() from public;
grant execute on function public.connection_health() to anon, authenticated;
