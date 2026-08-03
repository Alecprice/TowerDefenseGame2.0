import { CATEGORY } from './towerCategory';

// ---------------------------------------------------------------------
// Game 3.0's tower roster - a separate, parallel TOWER_DEFS table from
// the original game's (see tower.js). Deliberately NOT merged into that
// file's TOWER_DEFS: the two rulesets have different economies (this one
// splits Money/purchase from Crystals/upgrades) and different unlock
// progress (see progressionV3.js), and keeping them as fully separate
// data tables means nothing here can ever accidentally perturb the
// original game's balance.
//
// The *engine* is still fully shared - Tower(), drawShape(), shoot(),
// the effective*() stat layering, all of it. Tower() takes this table as
// its optional 4th argument (see tower.js), and GamePageV3 is the only
// place that ever passes it.
//
// Field convention carried over from the original game: `levels[0].price`
// is the Money cost to place the tower; `levels[1..4].price` are the
// Crystal costs to upgrade it (GamePageV3 is what decides which currency
// a given price draws from - the data here doesn't know or care).
// ---------------------------------------------------------------------

export const TOWER_DEFS_V3 = {
    // ---- Attack towers (15) - every one has a genuinely different verb,
    // not just different numbers. See MENTAL_MODEL.md's "TOWER_DEFS is
    // the single source of truth" section for how effective* layering
    // still applies on top of every field here. ----
    1: {
        name: 'Vanguard', category: CATEGORY.ATTACK, shape: 'circle', color: '#e63946',
        levels: [
            { price: 10, range: 150, fireRate: 1.0, dmg: 45 },
            { price: 12, range: 160, fireRate: 0.92, dmg: 58 },
            { price: 16, range: 170, fireRate: 0.84, dmg: 76 },
            { price: 22, range: 180, fireRate: 0.76, dmg: 98 },
            { price: 30, range: 190, fireRate: 0.68, dmg: 126 },
        ],
    },
    2: {
        name: 'Longshot', category: CATEGORY.ATTACK, shape: 'triangle', color: '#f1c40f',
        levels: [
            { price: 25, range: 260, fireRate: 2.2, dmg: 165 },
            { price: 20, range: 280, fireRate: 2.0, dmg: 210 },
            { price: 28, range: 300, fireRate: 1.8, dmg: 275 },
            { price: 38, range: 320, fireRate: 1.6, dmg: 355 },
            { price: 52, range: 340, fireRate: 1.4, dmg: 455 },
        ],
        targeting: 'strongest',
    },
    3: {
        name: 'Cluster Charge', category: CATEGORY.ATTACK, shape: 'diamond', color: '#f4a300',
        levels: [
            { price: 35, range: 120, fireRate: 1.3, dmg: 11 },
            { price: 18, range: 128, fireRate: 1.22, dmg: 15 },
            { price: 24, range: 136, fireRate: 1.14, dmg: 19 },
            { price: 32, range: 144, fireRate: 1.06, dmg: 25 },
            { price: 42, range: 152, fireRate: 0.98, dmg: 31 },
        ],
        aoe: true,
    },
    4: {
        name: 'Rapid Vents', category: CATEGORY.ATTACK, shape: 'square', color: '#2ecc71',
        levels: [
            { price: 18, range: 95, fireRate: 0.35, dmg: 13 },
            { price: 14, range: 100, fireRate: 0.30, dmg: 16 },
            { price: 18, range: 105, fireRate: 0.26, dmg: 21 },
            { price: 24, range: 110, fireRate: 0.22, dmg: 27 },
            { price: 32, range: 115, fireRate: 0.18, dmg: 33 },
        ],
        targeting: 'fastest',
    },
    5: {
        name: 'Mortar', category: CATEGORY.ATTACK, shape: 'hexagon', color: '#8e44ad',
        levels: [
            { price: 45, range: 140, fireRate: 1.6, dmg: 85, splashRadius: 45, splashPct: 0.5 },
            { price: 25, range: 145, fireRate: 1.5, dmg: 108, splashRadius: 48, splashPct: 0.5 },
            { price: 34, range: 150, fireRate: 1.4, dmg: 140, splashRadius: 51, splashPct: 0.55 },
            { price: 46, range: 155, fireRate: 1.3, dmg: 182, splashRadius: 54, splashPct: 0.55 },
            { price: 62, range: 160, fireRate: 1.2, dmg: 235, splashRadius: 58, splashPct: 0.6 },
        ],
    },
    6: {
        name: 'Venom Lance', category: CATEGORY.POISON, shape: 'cross', color: '#7cb518',
        levels: [
            { price: 28, range: 110, fireRate: 1.4, dmg: 9, poisonDps: 12, poisonDuration: 3000 },
            { price: 16, range: 115, fireRate: 1.3, dmg: 12, poisonDps: 16, poisonDuration: 3000 },
            { price: 22, range: 120, fireRate: 1.2, dmg: 15, poisonDps: 21, poisonDuration: 3200 },
            { price: 30, range: 125, fireRate: 1.1, dmg: 18, poisonDps: 27, poisonDuration: 3200 },
            { price: 40, range: 130, fireRate: 1.0, dmg: 23, poisonDps: 35, poisonDuration: 3500 },
        ],
    },
    7: {
        name: 'Cryo Spike', category: CATEGORY.SLOW, shape: 'star', color: '#48cae4',
        levels: [
            { price: 20, range: 110, fireRate: 1.0, dmg: 9, slowFloor: 0.75 },
            { price: 14, range: 115, fireRate: 0.95, dmg: 11, slowFloor: 0.68 },
            { price: 18, range: 120, fireRate: 0.9, dmg: 14, slowFloor: 0.60 },
            { price: 24, range: 125, fireRate: 0.85, dmg: 17, slowFloor: 0.52 },
            { price: 32, range: 130, fireRate: 0.8, dmg: 21, slowFloor: 0.40 },
        ],
    },
    8: {
        // Execute: if the target's health is already below the threshold
        // (a fraction of its max HP), this shot deals exactly enough
        // damage to finish it - see Projectile.impact()'s executeThreshold
        // handling. Weak against full-health enemies on its own; strong
        // as a cleanup tower behind DOT/splash towers.
        name: 'Executioner', category: CATEGORY.ATTACK, shape: 'executioner', color: '#6b2737',
        levels: [
            { price: 32, range: 100, fireRate: 1.1, dmg: 30, executeThreshold: 0.12 },
            { price: 18, range: 105, fireRate: 1.0, dmg: 38, executeThreshold: 0.14 },
            { price: 24, range: 110, fireRate: 0.9, dmg: 49, executeThreshold: 0.16 },
            { price: 32, range: 115, fireRate: 0.8, dmg: 63, executeThreshold: 0.18 },
            { price: 44, range: 120, fireRate: 0.7, dmg: 81, executeThreshold: 0.20 },
        ],
    },
    9: {
        // Chain: on impact, arcs to the nearest other enemy within
        // chainRange and deals chainFalloff% of the hit's damage to it.
        name: 'Chain Bolt', category: CATEGORY.ATTACK, shape: 'chainbolt', color: '#4361ee',
        levels: [
            { price: 34, range: 130, fireRate: 1.0, dmg: 32, chainRange: 90, chainFalloff: 0.55 },
            { price: 20, range: 135, fireRate: 0.94, dmg: 41, chainRange: 95, chainFalloff: 0.55 },
            { price: 27, range: 140, fireRate: 0.88, dmg: 53, chainRange: 100, chainFalloff: 0.6 },
            { price: 36, range: 145, fireRate: 0.82, dmg: 68, chainRange: 105, chainFalloff: 0.6 },
            { price: 48, range: 150, fireRate: 0.76, dmg: 87, chainRange: 110, chainFalloff: 0.65 },
        ],
    },
    10: {
        // Armor Breaker: every hit permanently strips a flat amount of
        // the target's armor stat (floored at 0) - modest damage on its
        // own, but every other tower's shots hit harder on that target
        // afterward. Armor loss persists on the enemy for its lifetime.
        name: 'Armor Breaker', category: CATEGORY.ATTACK, shape: 'armorbreaker', color: '#9d4edd',
        levels: [
            { price: 30, range: 105, fireRate: 1.2, dmg: 22, armorShred: 2 },
            { price: 17, range: 110, fireRate: 1.1, dmg: 28, armorShred: 3 },
            { price: 23, range: 115, fireRate: 1.0, dmg: 36, armorShred: 3 },
            { price: 31, range: 120, fireRate: 0.9, dmg: 46, armorShred: 4 },
            { price: 42, range: 125, fireRate: 0.8, dmg: 59, armorShred: 5 },
        ],
    },
    11: {
        // Heavy bonus: deals extra damage against any enemy with a large
        // max-HP pool (Tanks, Juggernauts, Bosses) - see heavyBonusMult
        // handling in Projectile.impact(). Underwhelming against Grunts.
        name: 'Siege Cannon', category: CATEGORY.ATTACK, shape: 'siegecannon', color: '#5c4d3c',
        levels: [
            { price: 50, range: 145, fireRate: 2.0, dmg: 110, heavyBonusMult: 1.6, heavyThreshold: 300 },
            { price: 30, range: 150, fireRate: 1.85, dmg: 140, heavyBonusMult: 1.65, heavyThreshold: 300 },
            { price: 40, range: 155, fireRate: 1.7, dmg: 182, heavyBonusMult: 1.7, heavyThreshold: 300 },
            { price: 54, range: 160, fireRate: 1.55, dmg: 235, heavyBonusMult: 1.75, heavyThreshold: 300 },
            { price: 72, range: 165, fireRate: 1.4, dmg: 302, heavyBonusMult: 1.8, heavyThreshold: 300 },
        ],
    },
    12: {
        // Pierce: the shot continues past its target, also hitting
        // enemies further along the same firing line - see pierceRange
        // handling in Projectile.impact(). Strongest against enemies
        // bunched up on a straight stretch of path.
        name: 'Rapid Pierce', category: CATEGORY.ATTACK, shape: 'piercer', color: '#adb5bd',
        levels: [
            { price: 36, range: 170, fireRate: 0.9, dmg: 40, pierceRange: 90, pierceFalloff: 0.7 },
            { price: 21, range: 175, fireRate: 0.84, dmg: 51, pierceRange: 95, pierceFalloff: 0.7 },
            { price: 28, range: 180, fireRate: 0.78, dmg: 66, pierceRange: 100, pierceFalloff: 0.75 },
            { price: 38, range: 185, fireRate: 0.72, dmg: 85, pierceRange: 105, pierceFalloff: 0.75 },
            { price: 51, range: 190, fireRate: 0.66, dmg: 109, pierceRange: 110, pierceFalloff: 0.8 },
        ],
    },
    13: {
        // Crit: every hit has a chance to trigger a bonus-damage mini
        // explosion around the target - see critChance/critMult/critRadius
        // handling in Projectile.impact(). Swingy by design.
        name: 'Volatile Core', category: CATEGORY.ATTACK, shape: 'volatilecore', color: '#ff6d00',
        levels: [
            { price: 33, range: 115, fireRate: 1.0, dmg: 26, critChance: 0.18, critMult: 2.2, critRadius: 40 },
            { price: 19, range: 120, fireRate: 0.94, dmg: 33, critChance: 0.20, critMult: 2.2, critRadius: 42 },
            { price: 26, range: 125, fireRate: 0.88, dmg: 43, critChance: 0.22, critMult: 2.3, critRadius: 44 },
            { price: 35, range: 130, fireRate: 0.82, dmg: 55, critChance: 0.24, critMult: 2.3, critRadius: 46 },
            { price: 47, range: 135, fireRate: 0.76, dmg: 71, critChance: 0.26, critMult: 2.4, critRadius: 48 },
        ],
    },
    14: {
        // Anti-shield: deals bonus damage specifically while the target
        // still has an active shield (shieldHP > 0) - see
        // shieldBonusMult handling in Projectile.impact(). A dedicated
        // counter to the Shielded enemy mechanic.
        name: 'Shield Breaker', category: CATEGORY.ATTACK, shape: 'shieldbreaker', color: '#3a5a40',
        levels: [
            { price: 29, range: 100, fireRate: 1.3, dmg: 28, shieldBonusMult: 2.0 },
            { price: 16, range: 105, fireRate: 1.2, dmg: 36, shieldBonusMult: 2.0 },
            { price: 22, range: 110, fireRate: 1.1, dmg: 46, shieldBonusMult: 2.1 },
            { price: 30, range: 115, fireRate: 1.0, dmg: 59, shieldBonusMult: 2.1 },
            { price: 41, range: 120, fireRate: 0.9, dmg: 76, shieldBonusMult: 2.2 },
        ],
    },
    15: {
        name: 'Farseer Spire', category: CATEGORY.ATTACK, shape: 'eye', color: '#3a86ff',
        levels: [
            { price: 55, range: 9999, fireRate: 2.4, dmg: 125 },
            { price: 32, range: 9999, fireRate: 2.2, dmg: 165 },
            { price: 42, range: 9999, fireRate: 2.0, dmg: 218 },
            { price: 56, range: 9999, fireRate: 1.8, dmg: 285 },
            { price: 75, range: 9999, fireRate: 1.6, dmg: 372 },
        ],
        targeting: 'strongest',
        global: true,
    },

    // ---- Support towers (5) - zero direct damage. shoot() bails out for
    // CATEGORY.SUPPORT before a projectile is ever created (same as the
    // original game). Four buff nearby/all towers; one (Blight Totem)
    // debuffs nearby enemies instead - see GamePageV3's aura loop, which
    // treats it as a continuous applySlow() aura rather than a buff. ----
    16: {
        name: 'Beacon', category: CATEGORY.SUPPORT, shape: 'plus', color: '#4cc9f0',
        levels: [
            { price: 35, auraRange: 130, rangeBonus: 0.10, dmgBonus: 0.12, fireRateBonus: 0.10 },
            { price: 20, auraRange: 140, rangeBonus: 0.14, dmgBonus: 0.17, fireRateBonus: 0.14 },
            { price: 28, auraRange: 150, rangeBonus: 0.18, dmgBonus: 0.22, fireRateBonus: 0.18 },
            { price: 38, auraRange: 160, rangeBonus: 0.23, dmgBonus: 0.28, fireRateBonus: 0.23 },
            { price: 52, auraRange: 170, rangeBonus: 0.30, dmgBonus: 0.36, fireRateBonus: 0.30 },
        ],
    },
    17: {
        name: 'Sharpshooter Nest', category: CATEGORY.SUPPORT, shape: 'watchtower', color: '#588157',
        levels: [
            { price: 25, auraRange: 140, rangeBonus: 0.22, dmgBonus: 0, fireRateBonus: 0 },
            { price: 15, auraRange: 152, rangeBonus: 0.30, dmgBonus: 0, fireRateBonus: 0 },
            { price: 20, auraRange: 164, rangeBonus: 0.38, dmgBonus: 0, fireRateBonus: 0 },
            { price: 28, auraRange: 176, rangeBonus: 0.46, dmgBonus: 0, fireRateBonus: 0 },
            { price: 38, auraRange: 190, rangeBonus: 0.55, dmgBonus: 0, fireRateBonus: 0 },
        ],
    },
    18: {
        name: 'Ammo Depot', category: CATEGORY.SUPPORT, shape: 'silo', color: '#bc6c25',
        levels: [
            { price: 30, auraRange: 120, rangeBonus: 0, dmgBonus: 0.25, fireRateBonus: 0 },
            { price: 18, auraRange: 130, rangeBonus: 0, dmgBonus: 0.34, fireRateBonus: 0 },
            { price: 24, auraRange: 140, rangeBonus: 0, dmgBonus: 0.44, fireRateBonus: 0 },
            { price: 32, auraRange: 150, rangeBonus: 0, dmgBonus: 0.55, fireRateBonus: 0 },
            { price: 44, auraRange: 160, rangeBonus: 0, dmgBonus: 0.68, fireRateBonus: 0 },
        ],
    },
    19: {
        name: 'Overclock Rig', category: CATEGORY.SUPPORT, shape: 'turbine', color: '#e0aaff',
        levels: [
            { price: 30, auraRange: 120, rangeBonus: 0, dmgBonus: 0, fireRateBonus: 0.25 },
            { price: 18, auraRange: 130, rangeBonus: 0, dmgBonus: 0, fireRateBonus: 0.33 },
            { price: 24, auraRange: 140, rangeBonus: 0, dmgBonus: 0, fireRateBonus: 0.42 },
            { price: 32, auraRange: 150, rangeBonus: 0, dmgBonus: 0, fireRateBonus: 0.52 },
            { price: 44, auraRange: 160, rangeBonus: 0, dmgBonus: 0, fireRateBonus: 0.62 },
        ],
    },
    20: {
        // Debuff, not buff: enemies inside auraRange get applySlow()'d
        // continuously (recomputed every frame, same "decays if you
        // leave the aura" behavior a Cryo Spike hit has) - see
        // GamePageV3's aura loop. Deals zero damage itself. Flyers are
        // still immune (applySlow() already respects immuneToSlow).
        name: 'Blight Totem', category: CATEGORY.SUPPORT, shape: 'blighttotem', color: '#7b2cbf',
        levels: [
            { price: 26, auraRange: 100, slowFloor: 0.72 },
            { price: 16, auraRange: 108, slowFloor: 0.64 },
            { price: 21, auraRange: 116, slowFloor: 0.56 },
            { price: 29, auraRange: 124, slowFloor: 0.48 },
            { price: 39, auraRange: 132, slowFloor: 0.38 },
        ],
    },

    // ---- Resource towers (2) - neither attacks. Gold Mine funds Money
    // (spent on placing towers); Crystal Forge funds Crystals (spent on
    // upgrading them). See GamePageV3 for exactly which currency each
    // action draws from. ----
    21: {
        name: 'Gold Mine', category: CATEGORY.BANK, shape: 'pentagon', color: '#ffd60a',
        levels: [
            { price: 30, incomePerSecond: 1.0 },
            { price: 20, incomePerSecond: 1.6 },
            { price: 28, incomePerSecond: 2.4 },
            { price: 38, incomePerSecond: 3.4 },
            { price: 52, incomePerSecond: 4.8 },
        ],
    },
    22: {
        name: 'Crystal Forge', category: CATEGORY.CRYSTAL, shape: 'crystalforge', color: '#00b4d8',
        levels: [
            { price: 40, incomePerSecond: 0.4 },
            { price: 26, incomePerSecond: 0.65 },
            { price: 36, incomePerSecond: 0.95 },
            { price: 48, incomePerSecond: 1.35 },
            { price: 64, incomePerSecond: 1.9 },
        ],
    },
};

export const TOWER_TYPES_V3 = Object.keys(TOWER_DEFS_V3).map(Number);
