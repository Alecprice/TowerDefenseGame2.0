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

    constraint name_length check (char_length(name) between 1 and 20),
    constraint map_name_length check (char_length(map_name) <= 60),
    constraint score_range check (score >= 0 and score <= 999999),
    constraint wave_range check (wave >= 0 and wave <= 1000)
);

create index if not exists highscores_score_idx
    on public.highscores (score desc);

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
    consumed    boolean not null default false
);

create index if not exists game_sessions_ip_hash_started_idx
    on public.game_sessions (ip_hash, started_at);

alter table public.game_sessions enable row level security;
-- Deliberately no policies here at all. The anon key gets zero access to
-- this table in any direction; only the Edge Functions (service_role,
-- which bypasses RLS) can read or write it.
