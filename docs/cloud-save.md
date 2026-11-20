# Cloud save: rules, recipe and typical mistakes

How a game (or any app on `gray0072.github.io`: this repo, `swedish`, `tanks`) keeps its progress in the shared Supabase project and syncs it between a phone and a computer, without ever losing progress and without ever making the player wait for the network. `AGENTS.md` points here; read it in full before adding or changing a cloud save, a sign-in, a sync or anything that talks to Supabase.

Reference implementations, plain scripts, no build step:

- [`lift-logic/core/cloud.js`](../lift-logic/core/cloud.js) — one row per account (one player's progress), with [`lift-logic/progress.js`](../lift-logic/progress.js) (`snapshot`, `merge`). Start from this one.
- [`world-aviation/core/cloud.js`](../world-aviation/core/cloud.js) — one row per career, several accounts on one device, uploads deferred while a flight runs, deletion across devices; merge in [`world-aviation/career.js`](../world-aviation/career.js) (`mergeCloud`).
- Their `SPEC.md` sections "Cloud save" list each game's states, and their `supabase/schema.sql` the table and its row-level security.

## Rules

1. **Optional.** Signed out, offline, from `file://`, with Supabase down, slow or its library missing, the game starts, plays and keeps its progress the same way. Without a sign-in no network call is made.
2. **Local first, merged, never replaced.** The progress lives in `localStorage`. The cloud copy is *merged* into it, never written over it, and a merge of the same copy again changes nothing.
3. **Read, merge, then write.** Every upload is preceded by a read of the cloud copy and a merge, so nothing is ever sent over progress this device has not seen. If the moment is wrong for a merge (in the middle of a level, a flight, an exam), the upload waits for the next moment one is allowed; it never goes up unmerged.
4. **Nothing waits for the network.** No start, screen or button is blocked on a cloud answer. Every request ends by a timeout (10 s a request, 25 s a whole sync), whatever hangs.
5. **A failed load is said, once, with a choice.** Signed in but the cloud copy could not be read in this session (no network, an error, a timeout): a short status on the start screen's account row, **Couldn't load your cloud progress**, with **Try again** and **Play with the progress on this device**. Never a dialog in the middle of a game. A player who chose to play on is not asked again in this session; the next start tries once more.
6. **It heals by itself.** A failed sync is tried again on the return of the network (`online`), on the return to the foreground, after the next change and every 30 s while the page is in view; once it succeeds the progress of both sides is merged.
7. **Sync often enough.** On sign-in, at start, on every return to the foreground, a few seconds (10 s) after the last change, and at once when the page goes to the background.
8. **Never drop what you don't know.** A field, an item or a part of the copy that this version of the game does not know (a newer version added it) is kept as it came and sent back. An installed app runs an old version for a while; it must not delete a newer version's progress from the cloud.
9. **Deleting or resetting is explicit.** A deletion or a reset must not be undone by another device merging its copy back in. Either remember which items were in the cloud and treat one missing as deleted (World Aviation: the career stays on the other device, unlinked), or write the reset as an explicit overwrite of the cloud, not a merge.
10. **Describe the states.** The game's `SPEC.md` lists its cloud states and what each shows; the READMEs tell the player in all three languages; every new text is translated.

## The shared Supabase project

**One Supabase project is shared with the other apps** (the `swedish` and `tanks` repos and any project here with a cloud save, like `world-aviation`). Every table a project adds starts with its own prefix, the `localStorage` one in snake case (`worldaviation_careers`, `swedish_saves`, `tanks_custom_maps`), and so do its policies — never a bare `saves` or `maps` another app may own. Its schema lives in the project's own `supabase/schema.sql`, safe to run again. A Supabase session is kept under the project's own `localStorage` key (`auth.storageKey`, e.g. `worldaviation.auth.<user id>`), never the library's default `sb-<project-ref>-auth-token`, which `/swedish/` uses. The project's URL and publishable key are not secrets (row-level security guards the rows) and are written in the project's code — there is no build step to read them from GitHub secrets.

## Recipe

**Client.** One client per account, created only when there is a session to use or a sign-in coming back from Google:

```js
supabase.createClient(CLOUD_URL, CLOUD_KEY, {
  auth: { flowType: 'pkce', storageKey: 'myGame.auth', detectSessionInUrl: true },
  global: { fetch: cloudFetch }          // every request (data and auth) with a timeout
});
```

`cloudFetch` wraps `fetch` with an `AbortController` that aborts after `CLOUD_REQUEST_MS`, and adds `keepalive: true` while `document.hidden` (bodies under 64 KB), so the last upload outlives the page. A whole sync is raced against `CLOUD_SYNC_MS` (`cloudLimit`). Copy both from `lift-logic/core/cloud.js`.

**Sync** (`round` in Lift Logic):

1. `auth.getSession()` — no session for this account: fail (offline with an expired token lands here).
2. `select` the row(s) with `.retry(false)` (the library's own retries would hide a failure for ~7 s; ours run anyway).
3. Merge into the local progress (`Progress.merge`), mark the account *loaded* for this session.
4. `upsert` the merged result.

Run one sync at a time (`busy` / `again`). The merge must not schedule another upload by itself (World Aviation: `Cloud.quietly`), or the game syncs in a loop.

**Deferred uploads** (when a merge is not allowed now): remember the `updated_at` of the copy this device last read or wrote; before an upload, read it again — the same stamp: upload; another one: merge first if allowed, else wait for the next idle moment (`Cloud.pushCareer`, `Cloud.waiting`).

**Status** (one getter, the UI only reads it): `unavailable` · `off` · `syncing` · `synced` · `loadFailed` (signed in, error, not loaded this session, not played on) · `local` (played on) · `error` (a later sync failed) · `signedOut` (the session is gone for good). Plus a note for a sign-in that could not start (`navigator.onLine === false`: don't open Google's page) or did not finish.

**Merge.** What only grows takes the union or the larger value (stars, medals, unlocked items, counts). What is a current state (money, a board, a position) comes from the copy saved last. Unknown keys are copied from the other side (see rule 8). Never sum counts: merging again would double them.

## Typical mistakes

Found in `swedish`, `world-aviation` and `lift-logic`; check a new cloud save against every one.

- **Uploading after a failed first load.** The first read failed, but the periodic upload still runs and writes this device's stale progress over the cloud. → Upload only after a read and a merge (rule 3).
- **Upload without a read.** Every save uploads the whole local state; a device left open in the background then wipes what another device did meanwhile. Merging only at start and sign-in does not help an installed app that is never restarted. → Read and merge before every upload; sync on every return to the foreground.
- **Losing the last seconds.** Changes are uploaded 10 s after the last one; the player closes the app at once and they stay on the device. → Upload at once on `visibilitychange` to hidden, with `keepalive`.
- **Starting the day before the sync.** Daily income, a streak, "days active" or other once-a-day steps run at start on the stale local state; the merge then keeps the larger balance and the day's income is lost, or the streak counters are computed wrong. → Run them after the first sync, or run them again after a merge.
- **An old version deletes new data.** The merge rebuilds the progress from the fields it knows and uploads it; whatever a newer version added is gone from the cloud. → Keep unknown keys and items (rule 8).
- **Max-merging spendable values.** Coins merged as the larger balance: coins earned on two devices are not added up, and coins spent on one come back from the other. → Prefer the copy saved last for spendable values, or keep a log of earnings and spendings and merge that.
- **Resets and deletions undone.** "Reset progress" uploads an empty save, the other device merges its progress back in; a deleted career returns from the device that still has it. → Rule 9.
- **Treating an offline session as signed out.** Offline with an expired access token the library cannot refresh it and reports no session, while it still keeps the stored one; the game shows "Signed out — sign in again". → While the stored session is kept, the player is still signed in: show the load failure, sync once the token is refreshed (`TOKEN_REFRESHED`).
- **No timeout.** A request that hangs leaves "Syncing…" forever, or worse, a screen waiting for it. → `cloudFetch` and `cloudLimit`.
- **The library's own retries.** postgrest-js retries a failed GET three times with backoff, so offline the status stays "Syncing…" for seconds. → `.retry(false)` on reads.
- **Signing in offline.** `signInWithOAuth` navigates to Google: offline that is a browser error page, in an installed app a dead end. → Check `navigator.onLine` and say so.
- **A sync loop.** The merge saves the progress, the save schedules an upload, the upload syncs and merges again. → Merge without scheduling (`Cloud.quietly`, or write storage directly).
- **Merging under the player.** A merge in the middle of a level, a flight or a dialog changes the state the game is running on. → Merge only at idle moments; defer uploads meanwhile (never send them unmerged).
- **Sharing the session key.** The library's default `sb-<project-ref>-auth-token` is one key for the whole origin, shared with every other app on `gray0072.github.io`. → `auth.storageKey` with the project's prefix.
- **Signing out uploads unmerged.** "Sign out — the last changes first" written as a plain upsert. → The same read-merge-write as any sync.

## Testing

No real account is needed: a stored fake session and a mock of Supabase's REST in the page are enough to drive every state in headless Chrome. [`tools/cloud-mock.js`](../tools/cloud-mock.js) gives a static server for the repo over `http://` (the cloud is off from `file://`), a fake session and the mock, switched by `localStorage.__mock`:

- `offline` — every request fails like a lost network;
- `error` — every request answers 500;
- `hang` — every request hangs until its timeout aborts it;
- `ok` — a tiny PostgREST over `localStorage.__cloud` (rows kept as JSON; `GET` with `eq` filters, `POST` upsert, `DELETE`); `window.__reqs` lists the requests made.

```js
// a steps file for tools/cdp.js (keep it outside the repo)
const { serve, session, MOCK } = require('d:/Projects/my/ivan/tools/cloud-mock.js');
module.exports = async ({ page, ev, log, send }) => {
  const srv = await serve(8765);
  const s = session('11111111-2222-3333-4444-555555555555');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: MOCK });
  await page('http://localhost:8765/ivan/lift-logic/', 1500);
  await ev(`localStorage.setItem('liftLogic.cloud', JSON.stringify({ user: '${s.user}', email: 'test@example.com' }));
    localStorage.setItem('liftLogic.auth', ${JSON.stringify(s.json)}); localStorage.setItem('__mock', 'offline'); 1`);
  await page('http://localhost:8765/ivan/lift-logic/', 3000);
  log(await ev(`Cloud.status`));              // loadFailed
  srv.close();
};
```

Check at least: signed in and offline (the choice shows, the game plays, back online it merges), a Supabase error, a hanging request (the status ends by the timeout, the menu works meanwhile), a sign-in without network, another device's newer copy (merged, not overwritten — also when the save comes in the middle of a level), a field this version does not know (kept and sent back), and a deletion on another device. `Network.emulateNetworkConditions` with `offline: true` sets `navigator.onLine` to false for the sign-in check; `document.hidden` cannot be faked in headless Chrome.
