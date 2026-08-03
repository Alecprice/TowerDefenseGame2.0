// Meta-progression: a permanent, account-wide currency ("Cores") earned
// at the end of every run and spent on small run-independent bonuses.
//
// This is deliberately a separate concern from progression.js (which
// tracks one-time tower/map unlocks): Cores are numeric and spendable,
// unlocks are binary and free. Keeping them in separate modules and
// separate localStorage keys means resetting one never touches the
// other.
//
// Waves already never hard-cap on any map (see GamePage.jsx - the wave
// counter and difficulty scaling just keep climbing until you run out
// of lives), so every run already *is* an endless run. This module is
// what gives that endlessness a payoff: the further a run goes, the
// more Cores it banks, and those Cores make every future run - on any
// map - start a little stronger.

const META_KEY = 'td_meta';

const DEFAULT_META = {
    cores: 0,
    bestWave: 0,
    upgrades: {
        startGold: 0,
        startLives: 0,
        globalDamage: 0,
        globalFireRate: 0,
        bankBoost: 0,
    },
    unlockedPalettes: ['default'],
    activePalette: 'default',
};

// Cosmetic-only palettes for the towers (see COSMETIC/shiftHue in
// tower.js). Every tower keeps its designed shape/behavior - only the
// hue shifts, uniformly, across the whole roster at once. `default`
// (no shift) is always unlocked and free; the rest are one-time
// purchases with Cores, not per-level like the stat upgrades above.
export const PALETTES = {
    default: { name: 'Standard', hueShift: 0, cost: 0 },
    crimson: { name: 'Crimson Legion', hueShift: -30, cost: 40 },
    toxic: { name: 'Toxic Sprawl', hueShift: 70, cost: 40 },
    arctic: { name: 'Arctic Frost', hueShift: 150, cost: 40 },
    void: { name: 'Void Purple', hueShift: 220, cost: 60 },
    golden: { name: 'Golden Vanguard', hueShift: 40, cost: 60 },
};

// Each upgrade: `perLevel` is the bonus granted per level, `max` is the
// level cap, and cost climbs geometrically (`baseCost * costGrowth^level`)
// so early levels are cheap and late levels are a real investment.
export const META_UPGRADES = {
    startGold: {
        name: 'Prospector',
        desc: '+5 starting gold per level',
        max: 10, baseCost: 8, costGrowth: 1.35, perLevel: 5,
    },
    startLives: {
        name: 'Fortification',
        desc: '+1 starting life per level',
        max: 10, baseCost: 20, costGrowth: 1.45, perLevel: 1,
    },
    globalDamage: {
        name: 'Weapon Forge',
        desc: '+3% tower damage per level, every tower',
        max: 15, baseCost: 15, costGrowth: 1.3, perLevel: 0.03,
    },
    globalFireRate: {
        name: 'Swift Hands',
        desc: '+3% fire rate per level, every tower',
        max: 15, baseCost: 15, costGrowth: 1.3, perLevel: 0.03,
    },
    bankBoost: {
        name: 'Vault Interest',
        desc: '+10% Bank tower income per level',
        max: 10, baseCost: 12, costGrowth: 1.3, perLevel: 0.10,
    },
};

export function getMeta() {
    try {
        const raw = localStorage.getItem(META_KEY);
        if (!raw) return structuredCloneMeta(DEFAULT_META);
        const loaded = JSON.parse(raw);
        return {
            ...structuredCloneMeta(DEFAULT_META),
            ...loaded,
            upgrades: { ...DEFAULT_META.upgrades, ...(loaded.upgrades || {}) },
            unlockedPalettes: loaded.unlockedPalettes || [...DEFAULT_META.unlockedPalettes],
            activePalette: loaded.activePalette || DEFAULT_META.activePalette,
        };
    } catch {
        return structuredCloneMeta(DEFAULT_META);
    }
}

function structuredCloneMeta(meta) {
    return { ...meta, upgrades: { ...meta.upgrades }, unlockedPalettes: [...meta.unlockedPalettes] };
}

export function saveMeta(meta) {
    try {
        localStorage.setItem(META_KEY, JSON.stringify(meta));
    } catch {
        // localStorage unavailable
    }
}

// Cores earned for a completed run. Weighted toward wave reached (the
// thing endless mode is actually testing) with a smaller bonus from
// score, so grinding a slightly-better score on the same wave still
// matters but going another 5 waves matters a lot more.
export function coresForRun(wave, score) {
    return Math.max(1, Math.floor(wave * 2 + score / 100));
}

// Call once when a run ends. Returns the number of Cores earned.
export function awardRunCores(wave, score) {
    const meta = getMeta();
    const earned = coresForRun(wave, score);
    meta.cores += earned;
    meta.bestWave = Math.max(meta.bestWave, wave);
    saveMeta(meta);
    return earned;
}

export function getUpgradeLevel(key) {
    return getMeta().upgrades[key] || 0;
}

export function getUpgradeCost(key) {
    const def = META_UPGRADES[key];
    const level = getUpgradeLevel(key);
    if (level >= def.max) return null; // maxed out
    return Math.round(def.baseCost * Math.pow(def.costGrowth, level));
}

export function purchaseUpgrade(key) {
    const def = META_UPGRADES[key];
    const meta = getMeta();
    const level = meta.upgrades[key] || 0;
    if (level >= def.max) return { success: false, reason: 'maxed' };
    const cost = Math.round(def.baseCost * Math.pow(def.costGrowth, level));
    if (meta.cores < cost) return { success: false, reason: 'cores' };
    meta.cores -= cost;
    meta.upgrades[key] = level + 1;
    saveMeta(meta);
    return { success: true, meta };
}

// Resolved, ready-to-apply bonuses for starting a run.
export function getMetaBonuses() {
    const meta = getMeta();
    const u = meta.upgrades;
    const palette = PALETTES[meta.activePalette] || PALETTES.default;
    return {
        startGoldBonus: u.startGold * META_UPGRADES.startGold.perLevel,
        startLivesBonus: u.startLives * META_UPGRADES.startLives.perLevel,
        dmgMult: 1 + u.globalDamage * META_UPGRADES.globalDamage.perLevel,
        fireRateMult: 1 + u.globalFireRate * META_UPGRADES.globalFireRate.perLevel,
        bankMult: 1 + u.bankBoost * META_UPGRADES.bankBoost.perLevel,
        paletteHueShift: palette.hueShift,
    };
}

export function purchasePalette(id) {
    const def = PALETTES[id];
    if (!def) return { success: false, reason: 'unknown' };
    const meta = getMeta();
    if (meta.unlockedPalettes.includes(id)) return { success: false, reason: 'owned' };
    if (meta.cores < def.cost) return { success: false, reason: 'cores' };
    meta.cores -= def.cost;
    meta.unlockedPalettes.push(id);
    saveMeta(meta);
    return { success: true, meta };
}

export function selectPalette(id) {
    const meta = getMeta();
    if (!meta.unlockedPalettes.includes(id)) return { success: false, reason: 'locked' };
    meta.activePalette = id;
    saveMeta(meta);
    return { success: true, meta };
}

export function resetMetaProgress() {
    try {
        localStorage.removeItem(META_KEY);
    } catch {
        // localStorage unavailable
    }
}
