create table if not exists public.kvr_staff_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique check (email = lower(email)),
  mobile text not null check (mobile ~ '^[6-9][0-9]{9}$'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.kvr_staff_members enable row level security;

revoke all on public.kvr_staff_members from anon;
grant select, insert, update, delete on public.kvr_staff_members to authenticated;

drop policy if exists "Owner manages staff access" on public.kvr_staff_members;
create policy "Owner manages staff access"
  on public.kvr_staff_members
  for all
  to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'maheshch1810@gmail.com')
  with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'maheshch1810@gmail.com');

drop policy if exists "Staff can read their own access record" on public.kvr_staff_members;
create policy "Staff can read their own access record"
  on public.kvr_staff_members
  for select
  to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
