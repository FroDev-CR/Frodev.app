-- Frodev.app — esquema Supabase
-- Ejecutar en SQL Editor del dashboard de Supabase.

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('gasto', 'entrada')),
  amount numeric(12, 2) not null check (amount > 0),
  category text not null,
  note text not null default '',
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  focus text not null,
  exercises jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists debts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric(12, 2) not null check (amount > 0),
  frequency text not null check (frequency in ('quincenal', 'mensual', 'unico')),
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('gasto', 'entrada')),
  created_at timestamptz not null default now(),
  unique (name, type)
);

create index if not exists idx_transactions_date on transactions (date desc);
create index if not exists idx_workouts_date on workouts (date desc);

-- App personal de un solo usuario: RLS activado, acceso solo con anon key.
alter table transactions enable row level security;
alter table workouts enable row level security;
alter table debts enable row level security;
alter table categories enable row level security;

create policy "anon full access transactions" on transactions
  for all using (true) with check (true);

create policy "anon full access workouts" on workouts
  for all using (true) with check (true);

create policy "anon full access debts" on debts
  for all using (true) with check (true);

create policy "anon full access categories" on categories
  for all using (true) with check (true);
