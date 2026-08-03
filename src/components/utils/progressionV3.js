// Progression for Game 3.0 - a deliberate near-mirror of progression.js,
// kept as a fully separate file (separate localStorage keys, separate
// unlock table sized for 22 towers instead of 15) rather than adding
// mode-switching branches into the original. See MENTAL_MODEL.md's
// "Four separate localStorage systems" section for why that pattern is
// used throughout this codebase - this is a fifth, following the same
// shape on purpose.
//
// Map unlock progress is intentionally its OWN track here too (not
// shared with the original game's progression.js), even though both
// modes draw from the same 50-map pool in maps.js - reaching wave 5 on
// a map in Game 3.0 doesn't unlock anything in the original game and
// vice versa, since the tower rosters (and therefore what "wave 5" even
// means difficulty-wise) are different.

const PROGRESSION_KEY = 'td3_progression';
const TUTORIAL_KEY = 'td3_tutorial_shown';
const MAP_COUNT = 50;
const TOWER_COUNT = 22;

const DEFAULT_PROGRESSION = {
    towerUnlocks: new Array(TOWER_COUNT).fill(false).map((_, i) => i === 0), // Vanguard (1) starts unlocked
    mapWavesCompleted: new Array(MAP_COUNT).fill(0),
    mapHighestWaves: new Array(MAP_COUNT).fill(0),
};

function padArray(arr, length, fill) {
    if (!Array.isArray(arr)) return new Array(length).fill(fill);
    if (arr.length >= length) return arr.slice(0, length);
    return [...arr, ...new Array(length - arr.length).fill(fill)];
}

// Which global wave count (across any Game 3.0 map) unlocks each tower.
// The 2 resource towers unlock early (the dual-currency economy doesn't
// work at all without both), core attack towers next, specialists and
// Farseer Spire/Blight Totem last.
export const TOWER_UNLOCK_WAVE_V3 = {
    21: 2,  // Gold Mine
    7: 4,   // Cryo Spike
    22: 5,  // Crystal Forge - the moment upgrades start mattering
    4: 6,   // Rapid Vents
    6: 8,   // Venom Lance
    16: 10, // Beacon
    3: 12,  // Cluster Charge
    10: 14, // Armor Breaker
    2: 16,  // Longshot
    17: 18, // Sharpshooter Nest
    5: 20,  // Mortar
    18: 22, // Ammo Depot
    8: 24,  // Executioner
    9: 26,  // Chain Bolt
    19: 28, // Overclock Rig
    12: 30, // Rapid Pierce
    14: 32, // Shield Breaker
    11: 34, // Siege Cannon
    13: 36, // Volatile Core
    20: 38, // Blight Totem
    15: 42, // Farseer Spire - last, and the strongest attacker
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
    try {
        localStorage.setItem(PROGRESSION_KEY, JSON.stringify(progression));
    } catch {
        // localStorage unavailable
    }
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
    try {
        return localStorage.getItem(TUTORIAL_KEY) === 'true';
    } catch {
        return false;
    }
}

export function markTutorialAsShownV3() {
    try {
        localStorage.setItem(TUTORIAL_KEY, 'true');
    } catch {
        // localStorage unavailable
    }
}

export function resetAllProgressV3() {
    try {
        localStorage.removeItem(PROGRESSION_KEY);
        localStorage.removeItem(TUTORIAL_KEY);
    } catch {
        // localStorage unavailable
    }
}
