// Global game progression stored in localStorage.
// Tracks: which towers are unlocked, upgrade levels for each tower,
// tutorial completion, and which maps have been beaten.

const PROGRESSION_KEY = 'td_progression';
const TUTORIAL_KEY = 'td_tutorial_shown';

const DEFAULT_PROGRESSION = {
    // Tower unlock states (index = tower type 1-10)
    // true = unlocked, false = locked. Only the Striker (type 1) starts
    // available - see TOWER_UNLOCK_WAVE below for when the rest unlock.
    towerUnlocks: [true, false, false, false, false, false, false, false, false, false],

    // Waves completed on each map index
    mapWavesCompleted: new Array(20).fill(0),
    
    // Highest wave reached on each map (for display)
    mapHighestWaves: new Array(20).fill(0),
};

// Which global wave count unlocks each tower type. Spread out so a full
// roster takes real, sustained progress rather than unlocking everything
// on the first map.
export const TOWER_UNLOCK_WAVE = {
    7: 3,   // Frost Tower - early crowd control
    4: 6,   // Burner
    6: 9,   // Toxin Spire
    3: 12,  // Blaster
    8: 15,  // Bank
    2: 18,  // Sniper
    10: 21, // Beacon
    5: 24,  // Cannon
    9: 27,  // Bulwark
};

// NOTE: Tower upgrades are intentionally NOT tracked here. Upgrades are a
// per-tower, in-round, gold-purchased thing (see tower.js / the in-game
// popup) and reset every game. There used to be a second, automatic,
// permanent upgrade system layered on top of that one - it was removed
// because the two systems stomped on each other's math (a manual upgrade
// would silently wipe out an automatic one). Tower *unlocks* below are a
// separate, permanent concept ("is this tower type available at all") and
// are unaffected by this.

export function getProgression() {
    try {
        const raw = localStorage.getItem(PROGRESSION_KEY);
        if (!raw) return { ...DEFAULT_PROGRESSION };
        const loaded = JSON.parse(raw);
        // Merge with defaults to handle new fields
        return {
            ...DEFAULT_PROGRESSION,
            ...loaded,
            towerUnlocks: loaded.towerUnlocks || DEFAULT_PROGRESSION.towerUnlocks,
            mapWavesCompleted: loaded.mapWavesCompleted || DEFAULT_PROGRESSION.mapWavesCompleted,
            mapHighestWaves: loaded.mapHighestWaves || DEFAULT_PROGRESSION.mapHighestWaves,
        };
    } catch {
        return { ...DEFAULT_PROGRESSION };
    }
}

export function saveProgression(progression) {
    try {
        localStorage.setItem(PROGRESSION_KEY, JSON.stringify(progression));
    } catch {
        // localStorage unavailable
    }
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
    if (mapIndex === 0) return true; // First map always unlocked
    const prev = getMapWavesCompleted(mapIndex - 1);
    return prev >= 5; // Need 5 waves on previous map to unlock next
}

export function tutorialHasBeenShown() {
    try {
        return localStorage.getItem(TUTORIAL_KEY) === 'true';
    } catch {
        return false;
    }
}

export function markTutorialAsShown() {
    try {
        localStorage.setItem(TUTORIAL_KEY, 'true');
    } catch {
        // localStorage unavailable
    }
}

export function resetAllProgress() {
    try {
        localStorage.removeItem(PROGRESSION_KEY);
        localStorage.removeItem(TUTORIAL_KEY);
    } catch {
        // localStorage unavailable
    }
}
