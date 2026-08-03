-- Tower Defense 2.0 — Supabase schema (tamper-resistant version)
-- Run this in your Supabase project's SQL Editor.
-- Safe to re-run even if you already ran the earlier version of this file.

create table if not exists public.highscores (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    score       integer not null,
    wave        integer not null,
    map_name    text not null,
    created_at  timestamptz not null default now(),
    -- 'YYYY-MM' in UTC, stamped server-side by the submit-score Edge
    -- Function at insert time (not computed by a DB default, so it's
    -- consistent with whatever the function considers "now"). Lets the
    -- leaderboard offer a "this month" view that resets on its own
    -- every month, alongside the permanent all-time board.
    season      text not null default to_char(now() at time zone 'utc', 'YYYY-MM'),
    -- Which game this score is from: 'v2' is the original game, 'v3' is
    -- Tower Defense Game 3.0. Keeps the two leaderboards cleanly
    -- separate without resorting to string-matching on map_name.
    game_version text not null default 'v2',

    constraint name_length check (char_length(name) between 1 and 20),
    constraint map_name_length check (char_length(map_name) <= 60),
    constraint score_range check (score >= 0 and score <= 999999),
    constraint wave_range check (wave >= 0 and wave <= 1000),
    constraint game_version_valid check (game_version in ('v2', 'v3'))
);

-- Safe to re-run on a database that already has the table from before
-- seasons/game_version existed - adds the columns without touching
-- existing rows (they default to the original game, 'v2', which is
-- correct for every row that predates Game 3.0 existing at all).
alter table public.highscores add column if not exists season text not null default to_char(now() at time zone 'utc', 'YYYY-MM');
alter table public.highscores add column if not exists game_version text not null default 'v2';
alter table public.highscores drop constraint if exists game_version_valid;
alter table public.highscores add constraint game_version_valid check (game_version in ('v2', 'v3'));

create index if not exists highscores_score_idx
    on public.highscores (score desc);

create index if not exists highscores_season_score_idx
    on public.highscores (season, score desc);

create index if not exists highscores_version_season_score_idx
    on public.highscores (game_version, season, score desc);

alter table public.highscores enable row level security;

-- Reading the leaderboard is still public.
drop policy if exists "Anyone can read highscores" on public.highscores;
create policy "Anyone can read highscores"
    on public.highscores
    for select
    using (true);

-- IMPORTANT: no insert/update/delete policy exists for anon/authenticated
-- anymore. That means the browser's anon key can no longer write to this
-- table at all — only the submit-score Edge Function can, using the
-- service_role key server-side (which bypasses RLS). If you previously ran
-- the earlier schema.sql, this line removes that direct-insert policy:
drop policy if exists "Anyone can submit a highscore" on public.highscores;


-- Game sessions: created when a round starts, consumed when a score is
-- submitted. started_at is set by the database server's clock, not the
-- player's browser, so it can't be spoofed by changing the system clock —
-- it anchors "how much real wall-clock time actually passed" for the
-- plausibility check in submit-score.
create table if not exists public.game_sessions (
    id          uuid primary key default gen_random_uuid(),
    started_at  timestamptz not null default now(),
    map_name    text not null,
    ip_hash     text,
    consumed    boolean not null default false,
    game_version text not null default 'v2'
);

alter table public.game_sessions add column if not exists game_version text not null default 'v2';
alter table public.game_sessions drop constraint if exists game_sessions_version_valid;
alter table public.game_sessions add constraint game_sessions_version_valid check (game_version in ('v2', 'v3'));

create index if not exists game_sessions_ip_hash_started_idx
    on public.game_sessions (ip_hash, started_at);

alter table public.game_sessions enable row level security;
-- Deliberately no policies here at all. The anon key gets zero access to
-- this table in any direction; only the Edge Functions (service_role,
-- which bypasses RLS) can read or write it.
