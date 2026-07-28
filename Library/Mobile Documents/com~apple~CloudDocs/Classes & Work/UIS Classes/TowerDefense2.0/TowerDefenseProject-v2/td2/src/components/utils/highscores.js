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

function getLocalHighScores() {
    try {
        const raw = localStorage.getItem(SCORES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveLocalHighScore(name, score, wave, mapName) {
    try {
        const scores = getLocalHighScores();
        scores.push({ name: name || 'Player', score, wave, mapName, date: new Date().toISOString() });
        scores.sort((a, b) => b.score - a.score);
        const trimmed = scores.slice(0, MAX_SCORES);
        localStorage.setItem(SCORES_KEY, JSON.stringify(trimmed));
        return trimmed;
    } catch {
        return getLocalHighScores();
    }
}

// Returns the top MAX_SCORES entries. Shape matches the old local-only
// version: { name, score, wave, mapName, date }.
export async function getHighScores() {
    if (!supabase) {
        return getLocalHighScores();
    }

    const { data, error } = await supabase
        .from('highscores')
        .select('name, score, wave, map_name, created_at')
        .order('score', { ascending: false })
        .limit(MAX_SCORES);

    if (error) {
        console.error('[highscores] failed to load from Supabase, using local scores:', error.message);
        return getLocalHighScores();
    }

    return data.map(row => ({
        name: row.name,
        score: row.score,
        wave: row.wave,
        mapName: row.map_name,
        date: row.created_at,
    }));
}

// Call once when a round starts. Anchors a server-side clock for the
// plausibility check in saveHighScore. Returns a sessionId (or null if
// Supabase isn't configured / the request fails - saveHighScore handles
// that by just keeping the score local-only).
export async function startGameSession(mapName) {
    if (!supabase) return null;

    try {
        const { data, error } = await supabase.functions.invoke('start-session', {
            body: { mapName },
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
export async function saveHighScore(sessionId, name, score, wave, mapName) {
    const playerName = name || 'Player';
    saveLocalHighScore(playerName, score, wave, mapName);

    if (!supabase || !sessionId) {
        return getHighScores();
    }

    const { error } = await supabase.functions.invoke('submit-score', {
        body: { sessionId, name: playerName, score, wave, mapName },
    });

    if (error) {
        console.error('[highscores] score was not accepted onto the shared leaderboard:', error.message);
    }

    return getHighScores();
}
