-- World Aviation — the cloud copy of the career (core/cloud.js, career.js mergeCloud).
-- Run this once in the Supabase SQL editor of the project the game points at (CLOUD_URL in core/cloud.js).
-- One career per Google account; the table's name starts with the game's prefix, like its localStorage keys
-- (worldaviation.*), since the project is shared with other apps.

create table if not exists public.worldaviation_careers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  career_id text not null,             -- the career's own id (Career.data.id): tells this career from another
  data jsonb not null,                 -- the whole career, as in localStorage under worldaviation.career.v1
  updated_at timestamptz not null default now()
);

alter table public.worldaviation_careers enable row level security;

grant select, insert, update, delete on public.worldaviation_careers to authenticated;

drop policy if exists "worldaviation: read own career" on public.worldaviation_careers;
create policy "worldaviation: read own career" on public.worldaviation_careers
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "worldaviation: insert own career" on public.worldaviation_careers;
create policy "worldaviation: insert own career" on public.worldaviation_careers
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "worldaviation: update own career" on public.worldaviation_careers;
create policy "worldaviation: update own career" on public.worldaviation_careers
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "worldaviation: delete own career" on public.worldaviation_careers;
create policy "worldaviation: delete own career" on public.worldaviation_careers
  for delete to authenticated using (auth.uid() = user_id);
