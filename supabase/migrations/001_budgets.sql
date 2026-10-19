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

-- Une seule ligne par compte : on garde la plus récente.
delete from public.budgets
where id in (
  select id from (
    select id,
           row_number() over (partition by user_id order by updated_at desc, id desc) as rn
    from public.budgets
  ) ranked
  where rn > 1
);

drop index if exists budgets_user_id_idx;
create unique index if not exists budgets_user_id_key on public.budgets (user_id);

-- Document entreprise : freelance, planning et trésorerie.
create table if not exists public.entreprise (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.entreprise enable row level security;

drop policy if exists "users_select_own_entreprise" on public.entreprise;
create policy "users_select_own_entreprise" on public.entreprise
  for select using (auth.uid() = user_id);

drop policy if exists "users_insert_own_entreprise" on public.entreprise;
create policy "users_insert_own_entreprise" on public.entreprise
  for insert with check (auth.uid() = user_id);

drop policy if exists "users_update_own_entreprise" on public.entreprise;
create policy "users_update_own_entreprise" on public.entreprise
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users_delete_own_entreprise" on public.entreprise;
create policy "users_delete_own_entreprise" on public.entreprise
  for delete using (auth.uid() = user_id);

create unique index if not exists entreprise_user_id_key on public.entreprise (user_id);

-- Reprend les anciennes tables si elles existent, sans écraser un document déjà présent.
do $$
begin
  if to_regclass('public.freelance_simulator') is not null then
    insert into public.entreprise (user_id, data)
    select distinct on (user_id)
      user_id,
      jsonb_build_object(
        'freelance', jsonb_build_object(
          'status', status,
          'tjm', tjm,
          'days', days,
          'costRetirement', cost_retirement,
          'costLld', cost_lld,
          'costFuel', cost_fuel,
          'costMutuelle', cost_mutuelle,
          'costBankIns', cost_bank_ins,
          'costAccountant', cost_accountant,
          'pctPortage', pct_portage,
          'costMeals', cost_meals,
          'costTelecom', cost_telecom,
          'costTech', cost_tech,
          'acre', acre,
          'fiscalParts', fiscal_parts,
          'areToggle', are_toggle,
          'salaryGross', salary_gross,
          'salaryBonus', salary_bonus,
          'salaryMonths', salary_months,
          'userAge', user_age,
          'useSpouseMutuelle', use_spouse_mutuelle
        )
      )
    from public.freelance_simulator
    where user_id is not null
    order by user_id, updated_at desc nulls last
    on conflict (user_id) do nothing;
  end if;
exception when others then
  raise notice 'copie freelance_simulator ignorée: %', sqlerrm;
end $$;

do $$
begin
  if to_regclass('public.gantt_simulator') is not null then
    insert into public.entreprise (user_id, data)
    select distinct on (user_id)
      user_id,
      jsonb_build_object('gantt', jsonb_build_object('tasks', coalesce(tasks, '[]'::jsonb)))
    from public.gantt_simulator
    where user_id is not null
    order by user_id, updated_at desc nulls last
    on conflict (user_id) do nothing;

    update public.entreprise e
    set data = jsonb_set(
      e.data,
      '{gantt}',
      jsonb_build_object('tasks', coalesce(g.tasks, '[]'::jsonb)),
      true
    )
    from (
      select distinct on (user_id) user_id, tasks
      from public.gantt_simulator
      where user_id is not null
      order by user_id, updated_at desc nulls last
    ) g
    where e.user_id = g.user_id
      and not (e.data ? 'gantt');
  end if;
exception when others then
  raise notice 'copie gantt_simulator ignorée: %', sqlerrm;
end $$;
