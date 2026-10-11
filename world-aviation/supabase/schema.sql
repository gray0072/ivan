-- World Aviation — the cloud copy of the careers (core/cloud.js, career.js mergeCloud).
-- Run this in the Supabase SQL editor of the project the game points at (CLOUD_URL in core/cloud.js);
-- running it again is safe. A row per career, under the Google account it syncs with: an account may
-- keep several careers. The table's name starts with the game's prefix, like its localStorage keys
-- (worldaviation.*), since the project is shared with other apps.

create table if not exists public.worldaviation_careers (
  user_id uuid not null references auth.users (id) on delete cascade,
  career_id text not null,             -- the career's own id (Career.data.id)
  data jsonb not null,                 -- the whole career, as in localStorage under worldaviation.career.<id>
  updated_at timestamptz not null default now(),
  primary key (user_id, career_id)
);

-- (the first version kept one career per account, keyed by the account alone)
alter table public.worldaviation_careers drop constraint if exists worldaviation_careers_pkey;
alter table public.worldaviation_careers add constraint worldaviation_careers_pkey primary key (user_id, career_id);

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
