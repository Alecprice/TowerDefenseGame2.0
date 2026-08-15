const PROGRESSION_KEY = 'td3_progression';
const TUTORIAL_KEY = 'td3_tutorial_shown';
const MAP_COUNT = 60;
const TOWER_COUNT = 28;

const DEFAULT_PROGRESSION = {
    towerUnlocks: new Array(TOWER_COUNT).fill(false).map((_, i) => i === 0),
    mapWavesCompleted: new Array(MAP_COUNT).fill(0),
    mapHighestWaves: new Array(MAP_COUNT).fill(0),
};

function padArray(arr, length, fill) {
    if (!Array.isArray(arr)) return new Array(length).fill(fill);
    if (arr.length >= length) return arr.slice(0, length);
    return [...arr, ...new Array(length - arr.length).fill(fill)];
}

export const TOWER_UNLOCK_WAVE_V3 = {
    21: 2,
    7: 4,
    22: 5,
    4: 6,
    6: 8,
    16: 10,
    3: 12,
    10: 14,
    2: 16,
    17: 18,
    5: 20,
    18: 22,
    8: 24,
    9: 26,
    19: 28,
    12: 30,
    14: 32,
    11: 34,
    13: 36,
    20: 38,
    15: 42,
    23: 44, // Reaper Battery
    24: 47, // Arc Mortar
    25: 50, // Corrosive Rail
    26: 53, // Null Cannon
    27: 56, // Storm Needle
    28: 60, // Railstar
};

export function getProgressionV3() {
    try {
        const raw = localStorage.getItem(PROGRESSION_KEY);
        if (!raw) return { ...DEFAULT_PROGRESSION };
        const loaded = JSON.parse(raw);
        return {
            ...DEFAULT_PROGRESSION,
            ...loaded,
            towerUnlocks: padArray(loaded.towerUnlocks, TOWER_COUNT, false),
            mapWavesCompleted: padArray(loaded.mapWavesCompleted, MAP_COUNT, 0),
            mapHighestWaves: padArray(loaded.mapHighestWaves, MAP_COUNT, 0),
        };
    } catch {
        return { ...DEFAULT_PROGRESSION };
    }
}

export function saveProgressionV3(progression) {
    try { localStorage.setItem(PROGRESSION_KEY, JSON.stringify(progression)); } catch { /* localStorage unavailable */ }
}

export function isTowerUnlockedV3(towerType) {
    const prog = getProgressionV3();
    return prog.towerUnlocks[towerType - 1] || false;
}

export function unlockTowerV3(towerType) {
    const prog = getProgressionV3();
    prog.towerUnlocks[towerType - 1] = true;
    saveProgressionV3(prog);
}

export function recordMapWaveCompletionV3(mapIndex, waveReached) {
    const prog = getProgressionV3();
    prog.mapWavesCompleted[mapIndex] = Math.max(prog.mapWavesCompleted[mapIndex] || 0, waveReached);
    prog.mapHighestWaves[mapIndex] = Math.max(prog.mapHighestWaves[mapIndex] || 0, waveReached);
    saveProgressionV3(prog);
}

export function getMapWavesCompletedV3(mapIndex) {
    const prog = getProgressionV3();
    return prog.mapWavesCompleted[mapIndex] || 0;
}

export function isMapUnlockedV3(mapIndex) {
    if (mapIndex === 0) return true;
    const prev = getMapWavesCompletedV3(mapIndex - 1);
    return prev >= 5;
}

export function tutorialHasBeenShownV3() {
    try { return localStorage.getItem(TUTORIAL_KEY) === 'true'; } catch { return false; }
}

export function markTutorialAsShownV3() {
    try { localStorage.setItem(TUTORIAL_KEY, 'true'); } catch { /* localStorage unavailable */ }
}

export function resetAllProgressV3() {
    try {
        localStorage.removeItem(PROGRESSION_KEY);
        localStorage.removeItem(TUTORIAL_KEY);
    } catch { /* localStorage unavailable */ }
}
