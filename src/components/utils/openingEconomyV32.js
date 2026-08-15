import { CATEGORY } from '../objects/towerCategory';
import { TOWER_DEFS_V3, TOWER_TYPES_V3 } from '../objects/towerDefsV3';
import { getGameModeRules } from './gameModes';

// Game 3.2 uses an explicit opening wallet instead of stacking the much
// harsher legacy difficulty start-money multipliers on top of mode pressure.
// The goal is one immediately useful combat tower on every difficulty, with
// room for a second cheap tower on easier / high-pressure rulesets, but not
// enough cash to skip the first few waves of economic decision-making.
export const OPENING_BASE_MONEY = {
    easy: 22,
    basic: 20,
    normal: 18,
    hard: 16,
    challenge: 14,
};

export const STARTER_TOWER_TYPES = [1, 4, 7]; // Vanguard, Rapid Vents, Cryo Spike
const ECONOMY_CATEGORIES = new Set([CATEGORY.BANK, CATEGORY.CRYSTAL, CATEGORY.SUPPORT]);

function hashSeed(text) {
    let h = 2166136261;
    for (const char of String(text || 'draft')) {
        h ^= char.charCodeAt(0);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function scoreType(seedHash, type) {
    return Math.imul((seedHash ^ type) >>> 0, 2654435761) >>> 0;
}

export function buildBalancedDraftRoster(seed = 'draft') {
    const h = hashSeed(seed);
    const starters = STARTER_TOWER_TYPES
        .filter(type => TOWER_DEFS_V3[type])
        .sort((a, b) => scoreType(h, a) - scoreType(h, b));
    const guaranteedStarter = starters[0] || 1;

    const randomPool = TOWER_TYPES_V3
        .filter(type => type !== guaranteedStarter && ![21, 22].includes(type))
        .map(type => ({ type, score: scoreType(h, type) }))
        .sort((a, b) => a.score - b.score)
        .slice(0, 5)
        .map(entry => entry.type);

    const selected = [guaranteedStarter, ...randomPool];
    [21, 22].forEach(type => {
        if (TOWER_DEFS_V3[type] && !selected.includes(type)) selected.push(type);
    });
    return new Set(selected);
}

export function cheapestCombatTowerCost(types = TOWER_TYPES_V3) {
    let cheapest = Infinity;
    for (const type of types) {
        const def = TOWER_DEFS_V3[type];
        if (!def || ECONOMY_CATEGORIES.has(def.category)) continue;
        const price = Number(def.levels?.[0]?.price);
        if (Number.isFinite(price) && price > 0) cheapest = Math.min(cheapest, price);
    }
    return Number.isFinite(cheapest) ? cheapest : 10;
}

export function getOpeningEconomy({
    difficultyKey = 'basic',
    modeKey = 'classic',
    metaStartGoldBonus = 0,
    draftRoster = null,
} = {}) {
    const rules = getGameModeRules(modeKey);
    const base = OPENING_BASE_MONEY[difficultyKey] ?? OPENING_BASE_MONEY.basic;
    const modeMult = rules.openingMoneyMult || 1;
    const availableTypes = draftRoster ? [...draftRoster] : TOWER_TYPES_V3;
    const cheapestCombat = cheapestCombatTowerCost(availableTypes);

    // Fresh competitive starts are capped at $26. That is deliberately below
    // the price of many specialist towers and prevents a starting wallet from
    // buying three Vanguards ($30) before wave one.
    const pressureAdjusted = Math.round(base * modeMult);
    const freshMoney = Math.max(cheapestCombat, Math.min(26, pressureAdjusted));

    // Permanent Prospector progression still matters in unranked play, but its
    // opening contribution is capped so a maxed profile cannot trivialize the
    // first waves. Ranked/Daily already pass zero here.
    const requestedMeta = Math.max(0, Number(metaStartGoldBonus) || 0);
    const metaCap = Math.floor(freshMoney * 0.4);
    const metaApplied = Math.min(requestedMeta, metaCap);

    return {
        base,
        modeMult,
        cheapestCombat,
        freshMoney,
        metaApplied,
        totalMoney: freshMoney + metaApplied,
    };
}
