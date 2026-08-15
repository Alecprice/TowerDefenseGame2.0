import { isAdminTestMode } from './adminTestMode';

const PROGRESSION_KEY = 'td3_progression';
const TUTORIAL_KEY = 'td3_tutorial_shown';
const MAP_COUNT = 100;
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

function normalizeTowerUnlocks(unlocks) {
    // Fresh installs and older/migrated saves may not contain towerUnlocks at
    // all. In that case use the real defaults instead of padding an undefined
    // value with `false`, which previously locked every tower including the
    // starter tower and made the entire shop non-interactive.
    const normalized = Array.isArray(unlocks)
        ? padArray(unlocks, TOWER_COUNT, false)
        : [...DEFAULT_PROGRESSION.towerUnlocks];

    // Tower type 1 is the guaranteed starter tower. Also repair any save that
    // was already affected by the bad normalization and contains all-false
    // unlocks, while preserving every other earned unlock.
    normalized[0] = true;
    return normalized;
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

export const TOWER_UNLOCK_WAVE_V3 = {
    21: 2, 7: 4, 22: 5, 4: 6, 6: 8, 16: 10, 3: 12, 10: 14,
    2: 16, 17: 18, 5: 20, 18: 22, 8: 24, 9: 26, 19: 28, 12: 30,
    14: 32, 11: 34, 13: 36, 20: 38, 15: 42, 23: 44, 24: 47,
    25: 50, 26: 53, 27: 56, 28: 60,
};

export function getProgressionV3() {
    try {
        const raw = localStorage.getItem(PROGRESSION_KEY);
        const loaded = raw ? JSON.parse(raw) : {};
        return adminOverlay({
            ...DEFAULT_PROGRESSION,
            ...loaded,
            towerUnlocks: normalizeTowerUnlocks(loaded.towerUnlocks),
            mapWavesCompleted: Array.isArray(loaded.mapWavesCompleted)
                ? padArray(loaded.mapWavesCompleted, MAP_COUNT, 0)
                : [...DEFAULT_PROGRESSION.mapWavesCompleted],
            mapHighestWaves: Array.isArray(loaded.mapHighestWaves)
                ? padArray(loaded.mapHighestWaves, MAP_COUNT, 0)
                : [...DEFAULT_PROGRESSION.mapHighestWaves],
        });
    } catch {
        return adminOverlay({
            ...DEFAULT_PROGRESSION,
            towerUnlocks: [...DEFAULT_PROGRESSION.towerUnlocks],
            mapWavesCompleted: [...DEFAULT_PROGRESSION.mapWavesCompleted],
            mapHighestWaves: [...DEFAULT_PROGRESSION.mapHighestWaves],
        });
    }
}

export function saveProgressionV3(progression) {
    if (isAdminTestMode()) return;
    try { localStorage.setItem(PROGRESSION_KEY, JSON.stringify(progression)); } catch { /* unavailable */ }
}
export function isTowerUnlockedV3(towerType) { return Boolean(getProgressionV3().towerUnlocks[towerType - 1]); }
export function unlockTowerV3(towerType) {
    if (isAdminTestMode()) return;
    const prog = getProgressionV3(); prog.towerUnlocks[towerType - 1] = true; saveProgressionV3(prog);
}
export function recordMapWaveCompletionV3(mapIndex, waveReached) {
    if (isAdminTestMode()) return;
    const prog = getProgressionV3();
    prog.mapWavesCompleted[mapIndex] = Math.max(prog.mapWavesCompleted[mapIndex] || 0, waveReached);
    prog.mapHighestWaves[mapIndex] = Math.max(prog.mapHighestWaves[mapIndex] || 0, waveReached);
    saveProgressionV3(prog);
}
export function getMapWavesCompletedV3(mapIndex) { return getProgressionV3().mapWavesCompleted[mapIndex] || 0; }
export function isMapUnlockedV3(mapIndex) { return mapIndex === 0 || getMapWavesCompletedV3(mapIndex - 1) >= 5; }
export function tutorialHasBeenShownV3() { try { return localStorage.getItem(TUTORIAL_KEY) === 'true'; } catch { return false; } }
export function markTutorialAsShownV3() { try { localStorage.setItem(TUTORIAL_KEY, 'true'); } catch { /* unavailable */ } }
export function resetAllProgressV3() {
    try { localStorage.removeItem(PROGRESSION_KEY); localStorage.removeItem(TUTORIAL_KEY); } catch { /* unavailable */ }
}
