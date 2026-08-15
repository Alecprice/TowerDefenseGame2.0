import { isAdminTestMode } from './adminTestMode';

const META_KEY = 'td_meta';

const DEFAULT_META = {
    cores: 0,
    bestWave: 0,
    upgrades: { startGold: 0, startLives: 0, globalDamage: 0, globalFireRate: 0, bankBoost: 0 },
    unlockedPalettes: ['default'],
    activePalette: 'default',
};

export const PALETTES = {
    default: { name: 'Standard', hueShift: 0, cost: 0 },
    crimson: { name: 'Crimson Legion', hueShift: -30, cost: 40 },
    toxic: { name: 'Toxic Sprawl', hueShift: 70, cost: 40 },
    arctic: { name: 'Arctic Frost', hueShift: 150, cost: 40 },
    void: { name: 'Void Purple', hueShift: 220, cost: 60 },
    golden: { name: 'Golden Vanguard', hueShift: 40, cost: 60 },
};

export const META_UPGRADES = {
    startGold: { name: 'Prospector', desc: '+5 starting gold per level', max: 10, baseCost: 8, costGrowth: 1.35, perLevel: 5 },
    startLives: { name: 'Fortification', desc: '+1 starting life per level', max: 10, baseCost: 20, costGrowth: 1.45, perLevel: 1 },
    globalDamage: { name: 'Weapon Forge', desc: '+3% tower damage per level, every tower', max: 15, baseCost: 15, costGrowth: 1.3, perLevel: 0.03 },
    globalFireRate: { name: 'Swift Hands', desc: '+3% fire rate per level, every tower', max: 15, baseCost: 15, costGrowth: 1.3, perLevel: 0.03 },
    bankBoost: { name: 'Vault Interest', desc: '+10% Bank tower income per level', max: 10, baseCost: 12, costGrowth: 1.3, perLevel: 0.10 },
};

function structuredCloneMeta(meta) {
    return { ...meta, upgrades: { ...meta.upgrades }, unlockedPalettes: [...meta.unlockedPalettes] };
}

function readPersistedMeta() {
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

function adminOverlay(meta) {
    if (!isAdminTestMode()) return meta;
    const upgrades = {};
    Object.entries(META_UPGRADES).forEach(([key, def]) => { upgrades[key] = def.max; });
    return {
        ...meta,
        cores: Math.max(meta.cores || 0, 999999),
        bestWave: Math.max(meta.bestWave || 0, 999),
        upgrades,
        unlockedPalettes: Object.keys(PALETTES),
    };
}

export function getMeta() { return adminOverlay(readPersistedMeta()); }
export function saveMeta(meta) { try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch { /* unavailable */ } }
export function coresForRun(wave, score) { return Math.max(1, Math.floor(wave * 2 + score / 100)); }
export function awardRunCores(wave, score) {
    if (isAdminTestMode()) return 0;
    const meta = readPersistedMeta();
    const earned = coresForRun(wave, score);
    meta.cores += earned; meta.bestWave = Math.max(meta.bestWave, wave); saveMeta(meta); return earned;
}
export function getUpgradeLevel(key) { return getMeta().upgrades[key] || 0; }
export function getUpgradeCost(key) {
    const def = META_UPGRADES[key];
    const level = getUpgradeLevel(key);
    if (level >= def.max) return null;
    return Math.round(def.baseCost * Math.pow(def.costGrowth, level));
}
export function purchaseUpgrade(key) {
    if (isAdminTestMode()) return { success: false, reason: 'admin-maxed' };
    const def = META_UPGRADES[key]; const meta = readPersistedMeta(); const level = meta.upgrades[key] || 0;
    if (level >= def.max) return { success: false, reason: 'maxed' };
    const cost = Math.round(def.baseCost * Math.pow(def.costGrowth, level));
    if (meta.cores < cost) return { success: false, reason: 'cores' };
    meta.cores -= cost; meta.upgrades[key] = level + 1; saveMeta(meta); return { success: true, meta };
}
export function getMetaBonuses() {
    const meta = getMeta(); const u = meta.upgrades; const palette = PALETTES[meta.activePalette] || PALETTES.default;
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
    if (isAdminTestMode()) return { success: false, reason: 'admin-owned' };
    const def = PALETTES[id]; if (!def) return { success: false, reason: 'unknown' };
    const meta = readPersistedMeta(); if (meta.unlockedPalettes.includes(id)) return { success: false, reason: 'owned' };
    if (meta.cores < def.cost) return { success: false, reason: 'cores' };
    meta.cores -= def.cost; meta.unlockedPalettes.push(id); saveMeta(meta); return { success: true, meta };
}
export function selectPalette(id) {
    if (!PALETTES[id]) return { success: false, reason: 'unknown' };
    const displayed = getMeta(); if (!displayed.unlockedPalettes.includes(id)) return { success: false, reason: 'locked' };
    const meta = readPersistedMeta(); meta.activePalette = id; saveMeta(meta); return { success: true, meta: getMeta() };
}
export function resetMetaProgress() { try { localStorage.removeItem(META_KEY); } catch { /* unavailable */ } }
