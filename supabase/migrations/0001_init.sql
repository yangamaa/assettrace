-- AssetTrace schema, indexes and Row Level Security
-- Run in the Supabase SQL editor or via `supabase db push`.

create extension if not exists "pgcrypto";

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  full_name text not null,
  role text not null default 'Colaborador',
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  model text not null,
  serial_number text not null,
  category text not null,
  assigned_to uuid references public.profiles(id) on delete set null,
  purchase_value numeric(12, 2) not null check (purchase_value > 0),
  purchase_date date not null,
  status text not null check (status in ('em_uso', 'disponivel', 'em_manutencao', 'baixado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, serial_number)
);

create table if not exists public.asset_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  type text not null check (type in ('entrada', 'atribuicao', 'devolucao', 'manutencao', 'baixa', 'atualizacao')),
  description text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  related_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  triggered_by uuid references public.profiles(id) on delete set null,
  status text not null check (status in ('running', 'completed', 'failed')),
  assets_analyzed integer not null default 0,
  alerts_generated integer not null default 0,
  summary text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.maintenance_alerts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  audit_run_id uuid not null references public.audit_runs(id) on delete cascade,
  recommendation text not null,
  priority text not null check (priority in ('baixa', 'media', 'alta', 'critica')),
  usage_months integer not null check (usage_months >= 0),
  created_at timestamptz not null default now()
);

create index if not exists assets_company_id_idx on public.assets (company_id);
create index if not exists assets_serial_number_idx on public.assets (serial_number);
create index if not exists assets_status_idx on public.assets (status);
create index if not exists assets_category_idx on public.assets (category);
create index if not exists assets_assigned_to_idx on public.assets (assigned_to);
create index if not exists profiles_company_id_idx on public.profiles (company_id);
create index if not exists movements_company_id_idx on public.asset_movements (company_id);
create index if not exists movements_asset_id_idx on public.asset_movements (asset_id);
create index if not exists alerts_company_id_idx on public.maintenance_alerts (company_id);
create index if not exists audit_runs_company_id_idx on public.audit_runs (company_id);

create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid()
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists assets_set_updated_at on public.assets;
create trigger assets_set_updated_at
before update on public.assets
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_company_id uuid;
  company_name text;
  company_slug text;
begin
  company_name := coalesce(new.raw_user_meta_data->>'company_name', 'Empresa AssetTrace');
  company_slug := lower(regexp_replace(company_name, '[^a-zA-Z0-9]+', '-', 'g'))
    || '-' || substr(new.id::text, 1, 6);

  insert into public.companies (name, slug)
  values (company_name, company_slug)
  returning id into new_company_id;

  insert into public.profiles (id, company_id, full_name, role, email)
  values (
    new.id,
    new_company_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'Administradora',
    new.email
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.assets enable row level security;
alter table public.asset_movements enable row level security;
alter table public.maintenance_alerts enable row level security;
alter table public.audit_runs enable row level security;

drop policy if exists companies_select on public.companies;
create policy companies_select on public.companies
  for select using (id = public.current_company_id());

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (company_id = public.current_company_id());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid())
  with check (company_id = public.current_company_id());

drop policy if exists assets_select on public.assets;
create policy assets_select on public.assets
  for select using (company_id = public.current_company_id());

drop policy if exists assets_insert on public.assets;
create policy assets_insert on public.assets
  for insert with check (company_id = public.current_company_id());

drop policy if exists assets_update on public.assets;
create policy assets_update on public.assets
  for update using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

drop policy if exists assets_delete on public.assets;
create policy assets_delete on public.assets
  for delete using (company_id = public.current_company_id());

drop policy if exists movements_select on public.asset_movements;
create policy movements_select on public.asset_movements
  for select using (company_id = public.current_company_id());

drop policy if exists movements_insert on public.asset_movements;
create policy movements_insert on public.asset_movements
  for insert with check (company_id = public.current_company_id());

drop policy if exists alerts_select on public.maintenance_alerts;
create policy alerts_select on public.maintenance_alerts
  for select using (company_id = public.current_company_id());

drop policy if exists alerts_insert on public.maintenance_alerts;
create policy alerts_insert on public.maintenance_alerts
  for insert with check (company_id = public.current_company_id());

drop policy if exists alerts_delete on public.maintenance_alerts;
create policy alerts_delete on public.maintenance_alerts
  for delete using (company_id = public.current_company_id());

drop policy if exists audit_select on public.audit_runs;
create policy audit_select on public.audit_runs
  for select using (company_id = public.current_company_id());

drop policy if exists audit_insert on public.audit_runs;
create policy audit_insert on public.audit_runs
  for insert with check (company_id = public.current_company_id());

drop policy if exists audit_update on public.audit_runs;
create policy audit_update on public.audit_runs
  for update using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());
