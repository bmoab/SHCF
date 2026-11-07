-- ThrHIVE: where the site's forms land.
-- Visitors can INSERT only. Nobody can read rows with the public key;
-- view and export them from the Supabase dashboard (Table Editor → Export CSV).

create table if not exists public.signups (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name       text not null check (char_length(name) between 1 and 120),
  email      text not null check (char_length(email) between 3 and 200 and email like '%@%'),
  phone      text check (char_length(phone) <= 40),
  home_gym   text check (char_length(home_gym) <= 120),
  roles      text[] not null default '{}' check (cardinality(roles) <= 4),
  days       text not null default 'both' check (days in ('both', 'liftoff', 'throwdown'))
);

create table if not exists public.pledges (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind       text not null check (kind in ('individual', 'partner')),
  name       text not null check (char_length(name) between 1 and 120),
  email      text not null check (char_length(email) between 3 and 200 and email like '%@%'),
  phone      text check (char_length(phone) <= 40),
  company    text check (char_length(company) <= 160),
  frequency  text check (frequency in ('monthly', 'yearly', 'once')),
  amount     numeric(10, 2) check (amount > 0 and amount < 1000000),
  tier       text check (char_length(tier) <= 60),
  message    text check (char_length(message) <= 1000)
);

alter table public.signups enable row level security;
alter table public.pledges enable row level security;

-- Insert-only for the public site. No select/update/delete policies exist,
-- so the publishable key cannot read anything back.
create policy "public can sign up" on public.signups
  for insert to anon with check (true);
create policy "public can pledge" on public.pledges
  for insert to anon with check (true);

revoke select, update, delete on public.signups from anon, authenticated;
revoke select, update, delete on public.pledges from anon, authenticated;
