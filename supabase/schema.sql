-- Frodev.app — esquema Supabase
-- Ejecutar en SQL Editor del dashboard de Supabase.
-- Es idempotente: se puede correr completo las veces que haga falta.

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

-- Entradas automáticas (ej: salario quincenal). Se materializan en transactions.
create table if not exists recurring_incomes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric(12, 2) not null check (amount > 0),
  frequency text not null check (frequency in ('quincenal', 'mensual')),
  day1 int not null check (day1 between 1 and 31),
  day2 int check (day2 between 1 and 31),
  created_at timestamptz not null default now()
);

-- Billetera: saldo actual, una sola fila.
create table if not exists wallet (
  id text primary key default 'main',
  balance numeric(12, 2) not null default 0
);

-- Vincula una transacción con la regla automática que la generó (si aplica).
alter table transactions
  add column if not exists recurring_id uuid references recurring_incomes(id) on delete set null;

-- Fecha de pago para deudas de pago único.
alter table debts
  add column if not exists due_date date;

-- Deuda "sin prisa": se queda guardada pero no cuenta en pagos ni alertas.
alter table debts
  add column if not exists low_priority boolean not null default false;

-- Músculos trabajados en cada entrenamiento (ids del muñequito).
alter table workouts
  add column if not exists muscles jsonb not null default '[]';

-- Lista de compras (debo comprar / quiero comprar), estilo cuaderno.
create table if not exists shopping_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('necesito', 'quiero')),
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_date on transactions (date desc);
create index if not exists idx_workouts_date on workouts (date desc);

-- App personal de un solo usuario: RLS activado, acceso solo con anon key.
alter table transactions enable row level security;
alter table workouts enable row level security;
alter table debts enable row level security;
alter table categories enable row level security;
alter table recurring_incomes enable row level security;
alter table wallet enable row level security;
alter table shopping_items enable row level security;

drop policy if exists "anon full access transactions" on transactions;
create policy "anon full access transactions" on transactions
  for all using (true) with check (true);

drop policy if exists "anon full access workouts" on workouts;
create policy "anon full access workouts" on workouts
  for all using (true) with check (true);

drop policy if exists "anon full access debts" on debts;
create policy "anon full access debts" on debts
  for all using (true) with check (true);

drop policy if exists "anon full access categories" on categories;
create policy "anon full access categories" on categories
  for all using (true) with check (true);

drop policy if exists "anon full access recurring_incomes" on recurring_incomes;
create policy "anon full access recurring_incomes" on recurring_incomes
  for all using (true) with check (true);

drop policy if exists "anon full access wallet" on wallet;
create policy "anon full access wallet" on wallet
  for all using (true) with check (true);

drop policy if exists "anon full access shopping_items" on shopping_items;
create policy "anon full access shopping_items" on shopping_items
  for all using (true) with check (true);
