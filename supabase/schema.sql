-- La Suma: tables and Row Level Security (PACKET section 10).
-- Paste all of this into the Supabase SQL editor (project "semestre") and click Run.
-- Safe to run more than once.

-- 1. Commitments: the user's own payments.
create table if not exists public.commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lender text not null check (char_length(lender) between 1 and 60),
  label text check (char_length(label) <= 80),
  amount numeric not null check (amount > 0),
  frequency text not null check (frequency in ('semanal', 'quincenal', 'mensual')),
  next_due_date date,                              -- null = "No sé"
  payments_left int check (payments_left >= 0),    -- null = "No sé"
  source text not null check (source in ('photo', 'manual')),
  confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists commitments_user_id_idx on public.commitments (user_id);

-- 2. Limits: one row per user, every field optional and set only by the user.
create table if not exists public.limits (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  ceiling_per_quincena numeric check (ceiling_per_quincena > 0),
  pause_until timestamptz,
  note_to_self text check (char_length(note_to_self) <= 200)
);

-- 3. Row Level Security: a user only touches rows where user_id = auth.uid().
alter table public.commitments enable row level security;
alter table public.limits enable row level security;

drop policy if exists "commitments_select_own" on public.commitments;
drop policy if exists "commitments_insert_own" on public.commitments;
drop policy if exists "commitments_update_own" on public.commitments;
drop policy if exists "commitments_delete_own" on public.commitments;

create policy "commitments_select_own" on public.commitments
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "commitments_insert_own" on public.commitments
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "commitments_update_own" on public.commitments
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "commitments_delete_own" on public.commitments
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "limits_select_own" on public.limits;
drop policy if exists "limits_insert_own" on public.limits;
drop policy if exists "limits_update_own" on public.limits;
drop policy if exists "limits_delete_own" on public.limits;

create policy "limits_select_own" on public.limits
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "limits_insert_own" on public.limits
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "limits_update_own" on public.limits
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "limits_delete_own" on public.limits
  for delete to authenticated using ((select auth.uid()) = user_id);
