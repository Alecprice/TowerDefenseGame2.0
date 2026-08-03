// Global high score leaderboard, backed by Supabase.
//
// Writes go through the submit-score Edge Function (see
// supabase/functions/), not a direct table insert — the anon key has no
// insert permission on `highscores` at all anymore. That function checks
// the score/wave against a server-clock-anchored session before writing.
//
// Falls back to a local (per-device) list in localStorage if Supabase
// isn't configured, or if a request fails (offline, etc.), so the game
// never breaks over a network hiccup.

import { supabase } from './supabaseClient';

const SCORES_KEY = 'td_highscores';
const NAME_KEY = 'td_playerName';
const MAX_SCORES = 10;

export function getPlayerName() {
    try {
        return localStorage.getItem(NAME_KEY) || '';
    } catch {
        return '';
    }
}

export function setPlayerName(name) {
    try {
        localStorage.setItem(NAME_KEY, name);
    } catch {
        // localStorage unavailable (private browsing, etc.) - just skip persisting.
    }
}

// 'YYYY-MM' in UTC - must match the format the submit-score Edge
// Function stamps onto each row (see supabase/functions/submit-score).
function currentSeason() {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

function getLocalHighScores(season = 'all', gameVersion = 'v2') {
    try {
        const raw = localStorage.getItem(SCORES_KEY);
        const all = raw ? JSON.parse(raw) : [];
        const filtered = all.filter(s => (s.gameVersion || 'v2') === gameVersion);
        if (season === 'all') return filtered;
        return filtered.filter(s => (s.date || '').slice(0, 7) === season);
    } catch {
        return [];
    }
}

function saveLocalHighScore(name, score, wave, mapName, gameVersion = 'v2') {
    try {
        const scores = JSON.parse(localStorage.getItem(SCORES_KEY) || '[]');
        scores.push({ name: name || 'Player', score, wave, mapName, gameVersion, date: new Date().toISOString() });
        scores.sort((a, b) => b.score - a.score);
        const trimmed = scores.slice(0, MAX_SCORES * 20); // keep enough history to filter by season locally
        localStorage.setItem(SCORES_KEY, JSON.stringify(trimmed));
        return trimmed;
    } catch {
        return getLocalHighScores();
    }
}

// Returns the top MAX_SCORES entries for one game's leaderboard.
// `season` is either 'all' (the permanent all-time board) or a 'YYYY-MM'
// string (defaults to the current month) for a resetting monthly
// leaderboard. `gameVersion` is 'v2' (the original game) or 'v3' (Game
// 3.0) - the two are always separate leaderboards, never merged. Shape
// matches the old local-only version: { name, score, wave, mapName, date }.
export async function getHighScores(season = 'all', gameVersion = 'v2') {
    if (!supabase) {
        return getLocalHighScores(season, gameVersion).slice(0, MAX_SCORES);
    }

    let query = supabase
        .from('highscores')
        .select('name, score, wave, map_name, created_at, season, game_version')
        .eq('game_version', gameVersion)
        .order('score', { ascending: false })
        .limit(MAX_SCORES);

    if (season !== 'all') {
        query = query.eq('season', season);
    }

    const { data, error } = await query;

    if (error) {
        console.error('[highscores] failed to load from Supabase, using local scores:', error.message);
        return getLocalHighScores(season, gameVersion).slice(0, MAX_SCORES);
    }

    return data.map(row => ({
        name: row.name,
        score: row.score,
        wave: row.wave,
        mapName: row.map_name,
        date: row.created_at,
    }));
}

export function getCurrentSeasonLabel() {
    const now = new Date();
    return now.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// Call once when a round starts. Anchors a server-side clock for the
// plausibility check in saveHighScore. Returns a sessionId (or null if
// Supabase isn't configured / the request fails - saveHighScore handles
// that by just keeping the score local-only).
export async function startGameSession(mapName, gameVersion = 'v2') {
    if (!supabase) return null;

    try {
        const { data, error } = await supabase.functions.invoke('start-session', {
            body: { mapName, gameVersion },
        });
        if (error) {
            console.error('[highscores] could not start a session:', error.message);
            return null;
        }
        return data?.sessionId ?? null;
    } catch (err) {
        console.error('[highscores] could not start a session:', err);
        return null;
    }
}

// Saves a score. Always mirrors to localStorage as the player's own local
// record. Only reaches the shared leaderboard if the server accepts it as
// plausible for the given session.
export async function saveHighScore(sessionId, name, score, wave, mapName, gameVersion = 'v2') {
    const playerName = name || 'Player';
    saveLocalHighScore(playerName, score, wave, mapName, gameVersion);

    if (!supabase || !sessionId) {
        return getHighScores('all', gameVersion);
    }

    const { error } = await supabase.functions.invoke('submit-score', {
        body: { sessionId, name: playerName, score, wave, mapName, gameVersion },
    });

    if (error) {
        console.error('[highscores] score was not accepted onto the shared leaderboard:', error.message);
    }

    return getHighScores('all', gameVersion);
}
