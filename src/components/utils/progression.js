import { isAdminTestMode } from './adminTestMode';

const PROGRESSION_KEY = 'td_progression';
const TUTORIAL_KEY = 'td_tutorial_shown';
const MAP_COUNT = 100;
const TOWER_COUNT = 15;

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

function adminOverlay(progression) {
    if (!isAdminTestMode()) return progression;
    return {
        ...progression,
        towerUnlocks: new Array(TOWER_COUNT).fill(true),
        mapWavesCompleted: new Array(MAP_COUNT).fill(99),
        mapHighestWaves: new Array(MAP_COUNT).fill(99),
    };
}

export const TOWER_UNLOCK_WAVE = {
    7: 3, 4: 6, 6: 9, 3: 12, 8: 15, 2: 18, 10: 21,
    5: 24, 9: 27, 11: 30, 12: 33, 13: 36, 15: 39, 14: 42,
};

export function getProgression() {
    try {
        const raw = localStorage.getItem(PROGRESSION_KEY);
        const loaded = raw ? JSON.parse(raw) : {};
        return adminOverlay({
            ...DEFAULT_PROGRESSION,
            ...loaded,
            towerUnlocks: padArray(loaded.towerUnlocks, TOWER_COUNT, false),
            mapWavesCompleted: padArray(loaded.mapWavesCompleted, MAP_COUNT, 0),
            mapHighestWaves: padArray(loaded.mapHighestWaves, MAP_COUNT, 0),
        });
    } catch {
        return adminOverlay({ ...DEFAULT_PROGRESSION });
    }
}

export function saveProgression(progression) {
    if (isAdminTestMode()) return;
    try { localStorage.setItem(PROGRESSION_KEY, JSON.stringify(progression)); } catch { /* localStorage unavailable */ }
}

export function isTowerUnlocked(towerType) { return Boolean(getProgression().towerUnlocks[towerType - 1]); }
export function unlockTower(towerType) {
    if (isAdminTestMode()) return;
    const prog = getProgression(); prog.towerUnlocks[towerType - 1] = true; saveProgression(prog);
}
export function recordMapWaveCompletion(mapIndex, waveReached) {
    if (isAdminTestMode()) return;
    const prog = getProgression();
    prog.mapWavesCompleted[mapIndex] = Math.max(prog.mapWavesCompleted[mapIndex] || 0, waveReached);
    prog.mapHighestWaves[mapIndex] = Math.max(prog.mapHighestWaves[mapIndex] || 0, waveReached);
    saveProgression(prog);
}
export function getMapWavesCompleted(mapIndex) { return getProgression().mapWavesCompleted[mapIndex] || 0; }
export function isMapUnlocked(mapIndex) { return mapIndex === 0 || getMapWavesCompleted(mapIndex - 1) >= 5; }
export function tutorialHasBeenShown() { try { return localStorage.getItem(TUTORIAL_KEY) === 'true'; } catch { return false; } }
export function markTutorialAsShown() { try { localStorage.setItem(TUTORIAL_KEY, 'true'); } catch { /* unavailable */ } }
export function resetAllProgress() {
    try { localStorage.removeItem(PROGRESSION_KEY); localStorage.removeItem(TUTORIAL_KEY); } catch { /* unavailable */ }
}
