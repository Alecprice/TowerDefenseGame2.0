import { supabase } from './supabaseClient';
import { shouldBlockCompetitiveProgress } from './adminTestMode';

const SCORES_KEY = 'td_highscores';
const NAME_KEY = 'td_playerName';
const MAX_SCORES = 10;

export function getPlayerName() { try { return localStorage.getItem(NAME_KEY) || ''; } catch { return ''; } }
export function setPlayerName(name) { try { localStorage.setItem(NAME_KEY, name); } catch { /* unavailable */ } }

export function parseRunLabel(mapName = '') {
    const parts = String(mapName).split('|').map(part => part.trim());
    const parsed = { displayMap: parts[0] || mapName, difficulty: null, mode: null, ranked: false, daily: false };
    parts.slice(1).forEach(part => {
        if (part.startsWith('d:')) parsed.difficulty = part.slice(2);
        else if (part.startsWith('m:')) parsed.mode = part.slice(2);
        else if (part === 'ranked') parsed.ranked = true;
        else if (part === 'daily') parsed.daily = true;
    });
    return parsed;
}

function matchesScope(entry, scope = {}) {
    if (!scope || Object.keys(scope).length === 0) return true;
    const parsed = parseRunLabel(entry.mapName);
    if (scope.difficulty && scope.difficulty !== 'all' && parsed.difficulty !== scope.difficulty) return false;
    if (scope.mode && scope.mode !== 'all' && parsed.mode !== scope.mode) return false;
    if (scope.ranked === 'ranked' && !parsed.ranked) return false;
    if (scope.ranked === 'unranked' && parsed.ranked) return false;
    if (scope.daily === true && !parsed.daily) return false;
    return true;
}

function getLocalHighScores(season = 'all', gameVersion = 'v2', scope = {}) {
    try {
        const all = JSON.parse(localStorage.getItem(SCORES_KEY) || '[]');
        return all.filter(score => (score.gameVersion || 'v2') === gameVersion)
            .filter(score => season === 'all' || (score.date || '').slice(0, 7) === season)
            .filter(score => matchesScope(score, scope)).sort((a, b) => b.score - a.score);
    } catch { return []; }
}

function saveLocalHighScore(name, score, wave, mapName, gameVersion = 'v2') {
    try {
        const scores = JSON.parse(localStorage.getItem(SCORES_KEY) || '[]');
        scores.push({ name: name || 'Player', score, wave, mapName, gameVersion, date: new Date().toISOString() });
        scores.sort((a, b) => b.score - a.score);
        const trimmed = scores.slice(0, MAX_SCORES * 40);
        localStorage.setItem(SCORES_KEY, JSON.stringify(trimmed));
        return trimmed;
    } catch { return getLocalHighScores(); }
}

export async function getHighScores(season = 'all', gameVersion = 'v2', scope = {}) {
    if (!supabase) return getLocalHighScores(season, gameVersion, scope).slice(0, MAX_SCORES);
    const hasScope = gameVersion === 'v3' && scope && Object.values(scope).some(value => value && value !== 'all');
    let query = supabase.from('highscores')
        .select('name, score, wave, map_name, created_at, season, game_version')
        .eq('game_version', gameVersion).order('score', { ascending: false }).limit(hasScope ? 100 : MAX_SCORES);
    if (season !== 'all') query = query.eq('season', season);
    const { data, error } = await query;
    if (error) {
        console.error('[highscores] failed to load from Supabase, using local scores:', error.message);
        return getLocalHighScores(season, gameVersion, scope).slice(0, MAX_SCORES);
    }
    return data.map(row => ({ name: row.name, score: row.score, wave: row.wave, mapName: row.map_name, date: row.created_at }))
        .filter(entry => matchesScope(entry, scope)).slice(0, MAX_SCORES);
}

export function getCurrentSeasonLabel() {
    const now = new Date();
    return now.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export async function startGameSession(mapName, gameVersion = 'v2') {
    if (shouldBlockCompetitiveProgress() || !supabase) return null;
    try {
        const { data, error } = await supabase.functions.invoke('start-session', { body: { mapName, gameVersion } });
        if (error) { console.error('[highscores] could not start a session:', error.message); return null; }
        return data?.sessionId ?? null;
    } catch (error) {
        console.error('[highscores] could not start a session:', error); return null;
    }
}

export async function saveHighScore(sessionId, name, score, wave, mapName, gameVersion = 'v2') {
    if (shouldBlockCompetitiveProgress()) return getHighScores('all', gameVersion);
    const playerName = name || 'Player';
    saveLocalHighScore(playerName, score, wave, mapName, gameVersion);
    if (!supabase || !sessionId) return getHighScores('all', gameVersion);
    const { error } = await supabase.functions.invoke('submit-score', {
        body: { sessionId, name: playerName, score, wave, mapName, gameVersion },
    });
    if (error) console.error('[highscores] score was not accepted onto the shared leaderboard:', error.message);
    return getHighScores('all', gameVersion);
}
