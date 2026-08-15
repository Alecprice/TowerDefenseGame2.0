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

const ECONOMY_CATEGORIES = new Set([CATEGORY.BANK, CATEGORY.CRYSTAL, CATEGORY.SUPPORT]);

function hashSeed(text) {
    let h = 2166136261;
    for (const char of String(text || 'draft')) {
        h ^= char.charCodeAt(0);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

// Mirrors GamePageV31's deterministic draft selection. Keeping the opening
// wallet tied to the actual random roster means an expensive draft receives
// exactly enough to field its cheapest combat option without globally making
// Draft Mode rich.
export function buildDraftRosterForEconomy(seed = 'draft') {
    const h = hashSeed(seed);
    const scored = TOWER_TYPES_V3.map(type => ({
        type,
        score: Math.imul((h ^ type) >>> 0, 2654435761) >>> 0,
    }));
    const selected = scored.sort((a, b) => a.score - b.score).slice(0, 6).map(entry => entry.type);
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

    // Fresh non-draft starts are capped at $26. That is deliberately below
    // three Vanguards ($30) and below most specialist towers. Draft may exceed
    // that ceiling only when its actual cheapest combat tower costs more.
    const pressureAdjusted = Math.round(base * modeMult);
    const cappedFresh = Math.min(26, pressureAdjusted);
    const freshMoney = Math.max(cheapestCombat, cappedFresh);

    // Permanent Prospector progression still matters in unranked play, but its
    // opening contribution is capped so a maxed profile cannot trivialize the
    // first waves. Ranked/Daily pass zero here.
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
