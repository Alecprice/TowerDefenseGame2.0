import { isMapUnlockedV3 } from './progressionV3';
import { isAdminTestMode } from './adminTestMode';

const KEY = 'td31_progression';
const MAP_COUNT = 100;
const TOWER_COUNT = 28;

export const DIFFICULTY_RANK_V31 = { easy: 0, basic: 1, normal: 2, hard: 3, challenge: 4 };

function emptyRecord() {
    return {
        bestWave: 0,
        bestDifficulty: 'easy',
        difficultyBest: {},
        modes: [],
        modeBest: {},
        rankedBest: 0,
        flawlessBest: 0,
        runs: 0,
    };
}

function fresh() {
    return {
        mapStars: new Array(MAP_COUNT).fill(0),
        mapRecords: new Array(MAP_COUNT).fill(null).map(emptyRecord),
        favorites: [],
        lifetime: { dailyWins: 0, threeStarMaps: 0, modesPlayed: [], bossArchetypes: [] },
    };
}

function pad(arr, length, factory) {
    const out = Array.isArray(arr) ? arr.slice(0, length) : [];
    while (out.length < length) out.push(typeof factory === 'function' ? factory(out.length) : factory);
    return out;
}

function normalizeRecord(record) {
    return {
        ...emptyRecord(),
        ...(record || {}),
        modes: [...(record?.modes || [])],
        difficultyBest: { ...(record?.difficultyBest || {}) },
        modeBest: { ...(record?.modeBest || {}) },
    };
}

function adminOverlay(data) {
    if (!isAdminTestMode()) return data;
    return {
        ...data,
        mapStars: new Array(MAP_COUNT).fill(3),
        mapRecords: new Array(MAP_COUNT).fill(null).map(() => ({
            bestWave: 99,
            bestDifficulty: 'challenge',
            difficultyBest: { easy: 99, basic: 99, normal: 99, hard: 99, challenge: 99 },
            modes: [], modeBest: {}, rankedBest: 99, flawlessBest: 99, runs: 99,
        })),
    };
}

export function getProgressionV31() {
    const base = fresh();
    try {
        const parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (!parsed) return adminOverlay(base);
        const records = pad(parsed.mapRecords, MAP_COUNT, emptyRecord).map(normalizeRecord);
        return adminOverlay({
            ...base,
            ...parsed,
            mapStars: pad(parsed.mapStars, MAP_COUNT, 0),
            mapRecords: records,
            favorites: (parsed.favorites || []).filter(type => type >= 1 && type <= TOWER_COUNT),
            lifetime: { ...base.lifetime, ...(parsed.lifetime || {}) },
        });
    } catch {
        return adminOverlay(base);
    }
}

export function saveProgressionV31(data) {
    if (isAdminTestMode()) return;
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage unavailable */ }
}
export function getMapStars(mapIndex) { return getProgressionV31().mapStars[mapIndex] || 0; }
export function getTotalStars() { return getProgressionV31().mapStars.reduce((sum, value) => sum + (value || 0), 0); }
export function getMapRecordV31(mapIndex) { return normalizeRecord(getProgressionV31().mapRecords[mapIndex]); }
export function getMapUnlockRequirement(mapIndex) { return mapIndex < 5 ? 0 : Math.floor(mapIndex / 5) * 10; }
export function isMapUnlockedV31(mapIndex) {
    if (isAdminTestMode() || mapIndex < 5) return true;
    if (isMapUnlockedV3(mapIndex)) return true;
    return getTotalStars() >= getMapUnlockRequirement(mapIndex);
}

function calculateStars({ wave, difficultyKey, livesLost }) {
    const rank = DIFFICULTY_RANK_V31[difficultyKey] ?? 0;
    let stars = wave >= 5 ? 1 : 0;
    if (wave >= 10 && rank >= 1) stars = Math.max(stars, 2);
    if (wave >= 15 && rank >= 2 && livesLost === 0) stars = 3;
    return stars;
}

export function recordMapResultV31(mapIndex, result) {
    if (isAdminTestMode()) return { starsEarned: 0, totalStars: 3, admin: true };
    const data = getProgressionV31();
    const oldStars = data.mapStars[mapIndex] || 0;
    const stars = calculateStars(result);
    data.mapStars[mapIndex] = Math.max(oldStars, stars);
    const record = normalizeRecord(data.mapRecords[mapIndex]);
    const wave = result.wave || 0;
    record.bestWave = Math.max(record.bestWave, wave);
    if ((DIFFICULTY_RANK_V31[result.difficultyKey] ?? 0) > (DIFFICULTY_RANK_V31[record.bestDifficulty] ?? 0)) record.bestDifficulty = result.difficultyKey;
    if (result.difficultyKey) record.difficultyBest[result.difficultyKey] = Math.max(record.difficultyBest[result.difficultyKey] || 0, wave);
    if (result.modeKey) {
        if (!record.modes.includes(result.modeKey)) record.modes.push(result.modeKey);
        record.modeBest[result.modeKey] = Math.max(record.modeBest[result.modeKey] || 0, wave);
    }
    if (result.ranked) record.rankedBest = Math.max(record.rankedBest, wave);
    if ((result.livesLost || 0) === 0) record.flawlessBest = Math.max(record.flawlessBest, wave);
    record.runs += 1;
    data.mapRecords[mapIndex] = record;
    data.lifetime.modesPlayed = Array.from(new Set([...(data.lifetime.modesPlayed || []), result.modeKey].filter(Boolean)));
    if (result.daily && wave >= 15) data.lifetime.dailyWins = (data.lifetime.dailyWins || 0) + 1;
    if (result.bossArchetypes?.length) data.lifetime.bossArchetypes = Array.from(new Set([...(data.lifetime.bossArchetypes || []), ...result.bossArchetypes]));
    data.lifetime.threeStarMaps = data.mapStars.filter(value => value >= 3).length;
    saveProgressionV31(data);
    return { starsEarned: Math.max(0, data.mapStars[mapIndex] - oldStars), totalStars: data.mapStars[mapIndex] };
}

export function getFavoriteTowers() { return getProgressionV31().favorites; }
export function toggleFavoriteTower(type) {
    const data = getProgressionV31();
    const set = new Set(data.favorites || []);
    if (set.has(type)) set.delete(type); else set.add(type);
    data.favorites = [...set].sort((a, b) => a - b);
    saveProgressionV31(data);
    return data.favorites;
}
export function resetProgressionV31() { try { localStorage.removeItem(KEY); } catch { /* unavailable */ } }
