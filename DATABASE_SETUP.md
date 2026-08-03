# Database Setup — Global Leaderboard (Supabase)

The game's high-score code is already fully built: `supabaseClient.js`,
`highscores.js`, `supabase/schema.sql`, and two Edge Functions
(`start-session`, `submit-score`) that anti-cheat every submission against
a server clock. **Nothing here needs to be written** — it needs to be
*provisioned*, which means creating your own Supabase project and pointing
this app at it. That last step has to happen under your account, so here's
exactly how to do it.

Until you do this, the game already works fine — `supabaseClient.js`
exports `null` when the env vars aren't set, and every score falls back to
a local (per-device) leaderboard automatically. Nothing breaks either way.

## 1. Create a Supabase project

1. Go to **[database.new](https://database.new)** (or supabase.com →
   "New project" if you already have an account).
2. Pick an organization, name the project (e.g. `tower-defense`), set a
   database password (save it somewhere — you likely won't need it again
   day-to-day, but you will if you ever connect a Postgres client
   directly), and pick a region close to your players.
3. Wait ~2 minutes for provisioning.

## 2. Grab your API keys

In the new project: **Project Settings → API**.
- Copy **Project URL** → this is `VITE_SUPABASE_URL`.
- Copy the **anon / public** key → this is `VITE_SUPABASE_ANON_KEY`.

Don't use the `service_role` key here — that one is secret and is only
ever used server-side (the Edge Functions pick it up automatically; see
step 5).

## 3. Configure the app

```bash
cd td2
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

`.env.local` is already gitignored, so this stays out of version control.

## 4. Run the schema

In the Supabase dashboard: **SQL Editor → New query**, paste the entire
contents of `supabase/schema.sql`, and run it. This creates:
- `highscores` — the public leaderboard table (readable by anyone, but
  **not** directly writable — only `submit-score` can insert into it,
  using the service_role key server-side). Each row is tagged
  `game_version` (`'v2'` for the original game, `'v3'` for Tower Defense
  Game 3.0) so the two leaderboards never mix, even though they share
  one table.
- `game_sessions` — anchors a server-side clock per round so a submitted
  score/wave can be checked for plausibility. No client access at all,
  in either direction.

Safe to re-run if you ever need to.

## 5. Deploy the two Edge Functions

Install the Supabase CLI as a dev dependency (no global install needed):
```bash
npm install -D supabase
```

Log in and link this repo to the project you just created:
```bash
npx supabase login
npx supabase link --project-ref your-project-ref
```
(`your-project-ref` is the subdomain in your Project URL, e.g. `abcdxyz`
from `https://abcdxyz.supabase.co`.)

Deploy both functions:
```bash
npx supabase functions deploy start-session
npx supabase functions deploy submit-score
```
(Each function's entrypoint must be named `index.ts` - that's what the
CLI looks for by default. This repo already has them named correctly.)

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected into every
Edge Function automatically — you don't set those yourself. Optionally,
set your own salt for the IP-hashing used in rate-limiting:
```bash
npx supabase secrets set IP_HASH_SALT=$(openssl rand -hex 16)
```
(If you skip this, it falls back to a default string — functionally
fine, just less unique to your deployment.)

## 6. Test it

```bash
npm run dev
```
Play a round, let it end, and check:
- The browser console shouldn't show the `[supabase] ... not set` warning
  anymore.
- `/scores` should say "Top scores from all players" instead of "Best
  scores on this device."
- In the Supabase dashboard, **Table Editor → highscores** should show
  your row, and **game_sessions** should show a `consumed = true` row for
  that round.

## 7. Production (Vercel)

`vercel.json` is already set up (`outputDirectory: build`). In your
Vercel project: **Settings → Environment Variables**, add the same two
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` values from step 3, then
redeploy. Nothing else needs configuring on the Vercel side — the Edge
Functions live on Supabase's infrastructure, not Vercel's.

## Troubleshooting

- **Already provisioned this before seasons existed?** Re-run
  `supabase/schema.sql` (it's additive - `alter table ... add column if
  not exists season ...`) and redeploy `submit-score`:
  `npx supabase functions deploy submit-score`. Existing rows aren't
  lost; they just default to whatever the database considers "now" for
  their season the moment you run the migration, not their original
  submission month.
- **`gen_random_uuid() does not exist`** when running the schema — your
  project's `pgcrypto` extension isn't enabled. In the SQL Editor, run
  `create extension if not exists pgcrypto;` first, then re-run
  `schema.sql`.
- **Scores submit locally but never show up in Supabase** — open the
  Network tab during a game-over and check the `submit-score` request. A
  400 with `"Implausible: ..."` usually means the session/score genuinely
  looked spoofed (e.g. testing by manually editing `localStorage` values
  doesn't fool the server check, by design). A 500 usually means the
  Edge Function isn't deployed yet, or the project isn't linked.
- **CORS errors in the console** — confirm you deployed both functions
  (`supabase functions list` shows what's live) and that `VITE_SUPABASE_URL`
  in `.env.local` matches the project you deployed to.
