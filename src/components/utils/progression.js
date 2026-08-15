// Global game progression stored in localStorage.
const PROGRESSION_KEY = 'td_progression';
const TUTORIAL_KEY = 'td_tutorial_shown';
const MAP_COUNT = 60;

const DEFAULT_PROGRESSION = {
    towerUnlocks: new Array(15).fill(false).map((_, i) => i === 0),
    mapWavesCompleted: new Array(MAP_COUNT).fill(0),
    mapHighestWaves: new Array(MAP_COUNT).fill(0),
};

function padArray(arr, length, fill) {
    if (!Array.isArray(arr)) return new Array(length).fill(fill);
    if (arr.length >= length) return arr.slice(0, length);
    return [...arr, ...new Array(length - arr.length).fill(fill)];
}

export const TOWER_UNLOCK_WAVE = {
    7: 3,
    4: 6,
    6: 9,
    3: 12,
    8: 15,
    2: 18,
    10: 21,
    5: 24,
    9: 27,
    11: 30,
    12: 33,
    13: 36,
    15: 39,
    14: 42,
};

export function getProgression() {
    try {
        const raw = localStorage.getItem(PROGRESSION_KEY);
        if (!raw) return { ...DEFAULT_PROGRESSION };
        const loaded = JSON.parse(raw);
        return {
            ...DEFAULT_PROGRESSION,
            ...loaded,
            towerUnlocks: padArray(loaded.towerUnlocks, 15, false),
            mapWavesCompleted: padArray(loaded.mapWavesCompleted, MAP_COUNT, 0),
            mapHighestWaves: padArray(loaded.mapHighestWaves, MAP_COUNT, 0),
        };
    } catch {
        return { ...DEFAULT_PROGRESSION };
    }
}

export function saveProgression(progression) {
    try { localStorage.setItem(PROGRESSION_KEY, JSON.stringify(progression)); } catch { /* localStorage unavailable */ }
}

export function isTowerUnlocked(towerType) {
    const prog = getProgression();
    return prog.towerUnlocks[towerType - 1] || false;
}

export function unlockTower(towerType) {
    const prog = getProgression();
    prog.towerUnlocks[towerType - 1] = true;
    saveProgression(prog);
}

export function recordMapWaveCompletion(mapIndex, waveReached) {
    const prog = getProgression();
    prog.mapWavesCompleted[mapIndex] = Math.max(prog.mapWavesCompleted[mapIndex] || 0, waveReached);
    prog.mapHighestWaves[mapIndex] = Math.max(prog.mapHighestWaves[mapIndex] || 0, waveReached);
    saveProgression(prog);
}

export function getMapWavesCompleted(mapIndex) {
    const prog = getProgression();
    return prog.mapWavesCompleted[mapIndex] || 0;
}

export function isMapUnlocked(mapIndex) {
    if (mapIndex === 0) return true;
    const prev = getMapWavesCompleted(mapIndex - 1);
    return prev >= 5;
}

export function tutorialHasBeenShown() {
    try { return localStorage.getItem(TUTORIAL_KEY) === 'true'; } catch { return false; }
}

export function markTutorialAsShown() {
    try { localStorage.setItem(TUTORIAL_KEY, 'true'); } catch { /* localStorage unavailable */ }
}

export function resetAllProgress() {
    try {
        localStorage.removeItem(PROGRESSION_KEY);
        localStorage.removeItem(TUTORIAL_KEY);
    } catch { /* localStorage unavailable */ }
}
