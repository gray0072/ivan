-- Arlanda Rising — the cloud copy of the save (core/cloud.js, core/save.js snapshot / merge).
-- Run this in the Supabase SQL editor of the project the game points at (CLOUD_URL in core/cloud.js);
-- running it again is safe. A row per Google account: the progress, the campaign, the running mission, Free Play
-- (data) and the mission snapshots for replays (snaps, sent only at idle moments). The table's name and its
-- policies start with the game's prefix, since the project is shared with other apps (world-aviation, lift-logic,
-- swedish, tanks).

create table if not exists public.arlandarising_saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,                 -- { v, progress, campaign, mission, freeplay, challenges } (Save.snapshot)
  snaps jsonb,                         -- { mission id: the world it started from } (Save.snaps)
  updated_at timestamptz not null default now()
);

alter table public.arlandarising_saves add column if not exists snaps jsonb;
alter table public.arlandarising_saves enable row level security;

grant select, insert, update, delete on public.arlandarising_saves to authenticated;

drop policy if exists "arlandarising: read own save" on public.arlandarising_saves;
create policy "arlandarising: read own save" on public.arlandarising_saves
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "arlandarising: insert own save" on public.arlandarising_saves;
create policy "arlandarising: insert own save" on public.arlandarising_saves
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "arlandarising: update own save" on public.arlandarising_saves;
create policy "arlandarising: update own save" on public.arlandarising_saves
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "arlandarising: delete own save" on public.arlandarising_saves;
create policy "arlandarising: delete own save" on public.arlandarising_saves
  for delete to authenticated using (auth.uid() = user_id);
