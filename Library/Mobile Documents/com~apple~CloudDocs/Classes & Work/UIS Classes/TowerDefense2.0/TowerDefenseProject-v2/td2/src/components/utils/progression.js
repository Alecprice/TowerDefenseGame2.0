// Global game progression stored in localStorage.
// Tracks: which towers are unlocked, upgrade levels for each tower,
// tutorial completion, and which maps have been beaten.

const PROGRESSION_KEY = 'td_progression';
const TUTORIAL_KEY = 'td_tutorial_shown';

const DEFAULT_PROGRESSION = {
    // Tower unlock states (index = tower type 1-4)
    // true = unlocked, false = locked
    towerUnlocks: [true, false, false, false],
    
    // Upgrade level for each tower (0-5)
    // Applied as global multiplier to all towers of that type
    towerUpgradeLevels: [0, 0, 0, 0],
    
    // Waves completed on each map index
    mapWavesCompleted: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    
    // Highest wave reached on each map (for display)
    mapHighestWaves: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

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
            towerUpgradeLevels: loaded.towerUpgradeLevels || DEFAULT_PROGRESSION.towerUpgradeLevels,
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

export function getTowerUpgradeLevel(towerType) {
    const prog = getProgression();
    return prog.towerUpgradeLevels[towerType - 1] || 0;
}

export function upgradeTowerPermanently(towerType, maxLevel = 5) {
    const prog = getProgression();
    if (prog.towerUpgradeLevels[towerType - 1] < maxLevel) {
        prog.towerUpgradeLevels[towerType - 1]++;
        saveProgression(prog);
        return true;
    }
    return false;
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
