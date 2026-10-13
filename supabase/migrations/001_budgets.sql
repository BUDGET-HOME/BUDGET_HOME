-- Migration 001 : table budgets + RLS
create extension if not exists "pgcrypto";

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Budget principal',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.budgets enable row level security;

drop policy if exists "users_select_own_budgets" on public.budgets;
create policy "users_select_own_budgets" on public.budgets
  for select using (auth.uid() = user_id);

drop policy if exists "users_insert_own_budgets" on public.budgets;
create policy "users_insert_own_budgets" on public.budgets
  for insert with check (auth.uid() = user_id);

drop policy if exists "users_update_own_budgets" on public.budgets;
create policy "users_update_own_budgets" on public.budgets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users_delete_own_budgets" on public.budgets;
create policy "users_delete_own_budgets" on public.budgets
  for delete using (auth.uid() = user_id);

create index if not exists budgets_user_id_idx on public.budgets(user_id);
