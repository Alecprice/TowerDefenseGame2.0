import { isMapUnlockedV3 } from './progressionV3';

const KEY = 'td31_progression';
const MAP_COUNT = 60;
const TOWER_COUNT = 28;

const DIFFICULTY_RANK = { easy: 0, basic: 1, normal: 2, hard: 3, challenge: 4 };

function fresh() {
    return {
        mapStars: new Array(MAP_COUNT).fill(0),
        mapRecords: new Array(MAP_COUNT).fill(null).map(() => ({ bestWave: 0, bestDifficulty: 'easy', modes: [], rankedBest: 0 })),
        favorites: [],
        lifetime: { dailyWins: 0, threeStarMaps: 0, modesPlayed: [], bossArchetypes: [] },
    };
}

function pad(arr, length, factory) {
    const out = Array.isArray(arr) ? arr.slice(0, length) : [];
    while (out.length < length) out.push(typeof factory === 'function' ? factory(out.length) : factory);
    return out;
}

export function getProgressionV31() {
    const base = fresh();
    try {
        const parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (!parsed) return base;
        return {
            ...base,
            ...parsed,
            mapStars: pad(parsed.mapStars, MAP_COUNT, 0),
            mapRecords: pad(parsed.mapRecords, MAP_COUNT, () => ({ bestWave: 0, bestDifficulty: 'easy', modes: [], rankedBest: 0 })),
            favorites: (parsed.favorites || []).filter(type => type >= 1 && type <= TOWER_COUNT),
            lifetime: { ...base.lifetime, ...(parsed.lifetime || {}) },
        };
    } catch {
        return base;
    }
}

export function saveProgressionV31(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage unavailable */ }
}

export function getMapStars(mapIndex) {
    return getProgressionV31().mapStars[mapIndex] || 0;
}

export function getTotalStars() {
    return getProgressionV31().mapStars.reduce((sum, value) => sum + (value || 0), 0);
}

export function getMapRecordV31(mapIndex) {
    return getProgressionV31().mapRecords[mapIndex] || { bestWave: 0, bestDifficulty: 'easy', modes: [], rankedBest: 0 };
}

export function getMapUnlockRequirement(mapIndex) {
    if (mapIndex < 5) return 0;
    return Math.floor(mapIndex / 5) * 10;
}

export function isMapUnlockedV31(mapIndex) {
    if (mapIndex < 5) return true;
    if (isMapUnlockedV3(mapIndex)) return true; // never take away progress from existing players.
    return getTotalStars() >= getMapUnlockRequirement(mapIndex);
}

function calculateStars({ wave, difficultyKey, livesLost }) {
    const rank = DIFFICULTY_RANK[difficultyKey] ?? 0;
    let stars = wave >= 5 ? 1 : 0;
    if (wave >= 10 && rank >= 1) stars = Math.max(stars, 2);
    if (wave >= 15 && rank >= 2 && livesLost === 0) stars = 3;
    return stars;
}

export function recordMapResultV31(mapIndex, result) {
    const data = getProgressionV31();
    const oldStars = data.mapStars[mapIndex] || 0;
    const stars = calculateStars(result);
    data.mapStars[mapIndex] = Math.max(oldStars, stars);
    const record = data.mapRecords[mapIndex] || { bestWave: 0, bestDifficulty: 'easy', modes: [], rankedBest: 0 };
    record.bestWave = Math.max(record.bestWave || 0, result.wave || 0);
    if ((DIFFICULTY_RANK[result.difficultyKey] ?? 0) > (DIFFICULTY_RANK[record.bestDifficulty] ?? 0)) record.bestDifficulty = result.difficultyKey;
    if (result.modeKey && !record.modes.includes(result.modeKey)) record.modes.push(result.modeKey);
    if (result.ranked) record.rankedBest = Math.max(record.rankedBest || 0, result.wave || 0);
    data.mapRecords[mapIndex] = record;
    data.lifetime.modesPlayed = Array.from(new Set([...(data.lifetime.modesPlayed || []), result.modeKey].filter(Boolean)));
    if (result.daily && result.wave >= 15) data.lifetime.dailyWins = (data.lifetime.dailyWins || 0) + 1;
    if (result.bossArchetypes?.length) data.lifetime.bossArchetypes = Array.from(new Set([...(data.lifetime.bossArchetypes || []), ...result.bossArchetypes]));
    data.lifetime.threeStarMaps = data.mapStars.filter(value => value >= 3).length;
    saveProgressionV31(data);
    return { starsEarned: Math.max(0, data.mapStars[mapIndex] - oldStars), totalStars: data.mapStars[mapIndex] };
}

export function getFavoriteTowers() {
    return getProgressionV31().favorites;
}

export function toggleFavoriteTower(type) {
    const data = getProgressionV31();
    const set = new Set(data.favorites || []);
    if (set.has(type)) set.delete(type); else set.add(type);
    data.favorites = [...set].sort((a, b) => a - b);
    saveProgressionV31(data);
    return data.favorites;
}

export function resetProgressionV31() {
    try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}
