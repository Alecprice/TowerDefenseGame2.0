import { getTeleporterBias } from './mapMechanicsV31';
import { getGameModeRules } from './gameModes';

const ENEMY_COST = { 1: 1, 2: 1.35, 3: 4.6, 4: 2.7, 6: 2.2, 7: 3.3, 8: 3.1, 9: 4.2 };
const ENEMY_NAMES = { 1: 'Grunt', 2: 'Runner', 3: 'Tank', 4: 'Armored', 5: 'Boss', 6: 'Flyer', 7: 'Teleporter', 8: 'Regenerator', 9: 'Juggernaut' };

function hashSeed(text) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return hash >>> 0;
}
function makeRng(seedText) {
    let state = hashSeed(seedText) || 1;
    return () => {
        state += 0x6D2B79F5;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function availableTypes(wave) {
    const types = [1];
    if (wave >= 4) types.push(2);
    if (wave >= 6) types.push(4);
    if (wave >= 9) types.push(3);
    if (wave >= 14) types.push(8);
    if (wave >= 18) types.push(6);
    if (wave >= 20) types.push(9);
    if (wave >= 22) types.push(7);
    return types;
}
function weightForType(type, wave, map, mechanic) {
    const profile = map?.enemyProfile || {};
    if (type === 1) return 1.8;
    if (type === 2) return wave < 10 ? 1.5 : 1.1;
    if (type === 4) return 0.8 + (profile.armoredChance || 0.2) * 3;
    if (type === 3) return 0.55 + (profile.tankChance || 0.1) * 3;
    if (type === 6) return 0.55;
    if (type === 7) return 0.45 * getTeleporterBias(mechanic);
    if (type === 8) return 0.65;
    if (type === 9) return 0.5;
    return 1;
}
function weightedChoice(types, wave, map, mechanic, rng) {
    const weights = types.map(type => weightForType(type, wave, map, mechanic));
    const total = weights.reduce((sum, value) => sum + value, 0);
    let roll = rng() * total;
    for (let i = 0; i < types.length; i++) { roll -= weights[i]; if (roll <= 0) return types[i]; }
    return types[types.length - 1];
}
function traitFor(wave, difficulty, modeKey, rng) {
    if (wave < 8) return null;
    const rules = getGameModeRules(modeKey);
    const baseChance = Math.min(0.42, 0.035 + wave * 0.0065) * (difficulty.eliteMult || 1);
    const modeMult = rules.traitMult || (modeKey === 'titan' ? 1.35 : modeKey === 'bossrush' ? 1.2 : 1);
    if (rng() > Math.min(0.82, baseChance * modeMult)) return null;
    const pool = ['shielded', 'splitter', 'hasted', 'fortified', 'regenerating'];
    return pool[Math.floor(rng() * pool.length)];
}
function themedWave(wave) {
    if (wave > 0 && wave % 15 === 0) return { key: 'fortress', name: 'FORTRESS WAVE', preferred: [3, 4, 9] };
    if (wave > 0 && wave % 11 === 0) return { key: 'blink', name: 'BLINK WAVE', preferred: [2, 6, 7] };
    if (wave > 0 && wave % 7 === 0) return { key: 'mutation', name: 'MUTATION WAVE', preferred: [8, 9, 4] };
    return null;
}

export function buildWavePlan({ wave, map, mapIndex = 0, difficulty, modeKey = 'classic', mechanic, seed = 'standard' }) {
    const rules = getGameModeRules(modeKey);
    const rng = makeRng(`${seed}:${mapIndex}:${wave}:${difficulty.key}:${modeKey}`);
    const theme = themedWave(wave);
    const types = availableTypes(wave);
    const pressure = difficulty.mult || 1;
    let threatBudget = (5 + wave * 2.8 + Math.pow(wave, 1.18) * 0.45) * Math.max(0.72, Math.min(1.7, pressure));
    threatBudget *= rules.threatMult || 1;
    const baseMaxUnits = Math.min(70, 5 + Math.ceil(wave * 1.65));
    const maxUnits = Math.min(120, Math.max(5, Math.ceil(baseMaxUnits * (rules.maxUnitsMult || 1))));
    const entries = [];

    while (threatBudget >= 0.8 && entries.length < maxUnits) {
        let type;
        if (theme && rng() < 0.62) {
            const viable = theme.preferred.filter(candidate => types.includes(candidate));
            type = viable.length ? viable[Math.floor(rng() * viable.length)] : weightedChoice(types, wave, map, mechanic, rng);
        } else type = weightedChoice(types, wave, map, mechanic, rng);
        const cost = ENEMY_COST[type] || 1;
        if (cost > threatBudget + 1.3 && entries.length > 3) type = 1;
        let trait = traitFor(wave, difficulty, modeKey, rng);
        if (rules.alternatingTraits && wave >= 2) trait = wave % 2 === 0 ? 'hasted' : 'fortified';
        entries.push({ type, trait, elite: Boolean(trait) });
        threatBudget -= ENEMY_COST[type] || 1;
    }

    if (rules.minibossStride && wave > 2) {
        for (let i = Math.max(1, rules.minibossStride - 1); i < entries.length; i += rules.minibossStride) {
            entries[i] = { ...entries[i], elite: true, trait: 'miniboss' };
        }
    }

    const bossInterval = rules.bossInterval || 5;
    if (wave > 0 && wave % bossInterval === 0) entries.push({ type: 5, boss: true, trait: null, elite: true });

    return {
        wave, theme, entries,
        spawnInterval: rules.spawnInterval ?? .72,
        seed: `${seed}:${mapIndex}:${wave}:${difficulty.key}:${modeKey}`,
    };
}

export function applyPlannedTrait(enemy, spec) {
    if (!enemy || !spec?.trait) return;
    enemy.waveTrait = spec.trait;
    enemy.isElite = Boolean(spec.elite);
    switch (spec.trait) {
        case 'shielded': enemy.shieldHP = Math.max(enemy.shieldHP || 0, Math.round(enemy.maxHealth * 0.34)); break;
        case 'splitter': enemy.splitter = true; break;
        case 'hasted': enemy.speed *= 1.28; enemy.baseSpeed = enemy.speed; break;
        case 'fortified': enemy.armor = (enemy.armor || 0) + 7; break;
        case 'regenerating': enemy.regenPerSecond = Math.max(enemy.regenPerSecond || 0, enemy.maxHealth * 0.055); break;
        case 'miniboss':
            enemy.maxHealth = Math.round(enemy.maxHealth * 2.8); enemy.health = enemy.maxHealth;
            enemy.atk = Math.max(2, Math.round(enemy.atk * 1.7)); enemy.value = Math.round(enemy.value * 2.2);
            enemy.score = Math.round(enemy.score * 2.2); enemy.armor = (enemy.armor || 0) + 4;
            enemy.shieldHP = Math.round(enemy.maxHealth * 0.16); enemy.isModeElite = true; break;
        default: break;
    }
}

export function enemyDisplayName(spec) {
    const base = ENEMY_NAMES[spec?.type] || 'Enemy';
    if (spec?.boss) return 'BOSS';
    if (spec?.trait === 'miniboss') return `Elite ${base}`;
    const trait = spec?.trait ? spec.trait[0].toUpperCase() + spec.trait.slice(1) : '';
    return trait ? `${trait} ${base}` : base;
}
export function summarizeWavePlan(plan) {
    const counts = new Map();
    for (const spec of plan?.entries || []) {
        const label = enemyDisplayName(spec); counts.set(label, (counts.get(label) || 0) + 1);
    }
    return [...counts.entries()].map(([label, count]) => ({ label, count }));
}
