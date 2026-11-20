-- Lift Logic — the cloud copy of the progress (core/cloud.js, progress.js merge / snapshot).
-- Run this in the Supabase SQL editor of the project the game points at (CLOUD_URL in core/cloud.js);
-- running it again is safe. A row per Google account: the progress and the programs, as in localStorage
-- under liftLogic.progress.v1 / programs.v1 / programTimes.v1. The table's name and its policies start
-- with the game's prefix, since the project is shared with other apps (world-aviation, swedish).

create table if not exists public.liftlogic_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,                 -- { v, progress, programs, programTimes } (Progress.snapshot)
  updated_at timestamptz not null default now()
);

alter table public.liftlogic_progress enable row level security;

grant select, insert, update, delete on public.liftlogic_progress to authenticated;

drop policy if exists "liftlogic: read own progress" on public.liftlogic_progress;
create policy "liftlogic: read own progress" on public.liftlogic_progress
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "liftlogic: insert own progress" on public.liftlogic_progress;
create policy "liftlogic: insert own progress" on public.liftlogic_progress
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "liftlogic: update own progress" on public.liftlogic_progress;
create policy "liftlogic: update own progress" on public.liftlogic_progress
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "liftlogic: delete own progress" on public.liftlogic_progress;
create policy "liftlogic: delete own progress" on public.liftlogic_progress
  for delete to authenticated using (auth.uid() = user_id);
