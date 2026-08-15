import { CATEGORY } from './towerCategory';

// Expansion tower pack. These intentionally reuse mechanics already supported
// by Projectile/Tower so the new roster stays compatible with the existing
// engine, tests, save format, and procedural renderer.
export const EXPANSION_TOWER_DEFS_V3 = {
    23: {
        name: 'Reaper Battery', category: CATEGORY.ATTACK, shape: 'executioner', color: '#b5179e',
        levels: [
            { price: 46, range: 135, fireRate: 1.0, dmg: 48, executeThreshold: 0.16 },
            { price: 28, range: 142, fireRate: 0.92, dmg: 62, executeThreshold: 0.18 },
            { price: 38, range: 149, fireRate: 0.84, dmg: 80, executeThreshold: 0.20 },
            { price: 50, range: 156, fireRate: 0.76, dmg: 104, executeThreshold: 0.23 },
            { price: 68, range: 165, fireRate: 0.68, dmg: 136, executeThreshold: 0.27 },
        ],
    },
    24: {
        name: 'Arc Mortar', category: CATEGORY.ATTACK, shape: 'hexagon', color: '#00b4d8',
        levels: [
            { price: 58, range: 155, fireRate: 1.7, dmg: 88, splashRadius: 48, splashPct: 0.45, chainRange: 75, chainFalloff: 0.4 },
            { price: 34, range: 162, fireRate: 1.58, dmg: 112, splashRadius: 51, splashPct: 0.48, chainRange: 80, chainFalloff: 0.42 },
            { price: 46, range: 169, fireRate: 1.46, dmg: 145, splashRadius: 54, splashPct: 0.5, chainRange: 85, chainFalloff: 0.45 },
            { price: 62, range: 176, fireRate: 1.34, dmg: 188, splashRadius: 58, splashPct: 0.53, chainRange: 90, chainFalloff: 0.48 },
            { price: 82, range: 185, fireRate: 1.22, dmg: 244, splashRadius: 62, splashPct: 0.56, chainRange: 100, chainFalloff: 0.52 },
        ],
    },
    25: {
        name: 'Corrosive Rail', category: CATEGORY.POISON, shape: 'cross', color: '#80b918',
        levels: [
            { price: 42, range: 145, fireRate: 1.35, dmg: 18, poisonDps: 15, poisonDuration: 3500, armorShred: 2 },
            { price: 26, range: 152, fireRate: 1.25, dmg: 23, poisonDps: 20, poisonDuration: 3700, armorShred: 3 },
            { price: 34, range: 159, fireRate: 1.15, dmg: 30, poisonDps: 27, poisonDuration: 3900, armorShred: 4 },
            { price: 46, range: 166, fireRate: 1.05, dmg: 39, poisonDps: 35, poisonDuration: 4200, armorShred: 5 },
            { price: 62, range: 175, fireRate: 0.95, dmg: 51, poisonDps: 46, poisonDuration: 4500, armorShred: 7 },
        ],
    },
    26: {
        name: 'Null Cannon', category: CATEGORY.ATTACK, shape: 'shieldbreaker', color: '#ff006e',
        levels: [
            { price: 48, range: 125, fireRate: 1.25, dmg: 45, shieldBonusMult: 2.4, heavyBonusMult: 1.25, heavyThreshold: 300 },
            { price: 28, range: 132, fireRate: 1.15, dmg: 58, shieldBonusMult: 2.5, heavyBonusMult: 1.3, heavyThreshold: 300 },
            { price: 38, range: 139, fireRate: 1.05, dmg: 75, shieldBonusMult: 2.6, heavyBonusMult: 1.35, heavyThreshold: 300 },
            { price: 50, range: 146, fireRate: 0.95, dmg: 97, shieldBonusMult: 2.75, heavyBonusMult: 1.4, heavyThreshold: 300 },
            { price: 68, range: 155, fireRate: 0.85, dmg: 126, shieldBonusMult: 3.0, heavyBonusMult: 1.5, heavyThreshold: 300 },
        ],
    },
    27: {
        name: 'Storm Needle', category: CATEGORY.ATTACK, shape: 'chainbolt', color: '#8338ec',
        levels: [
            { price: 44, range: 150, fireRate: 0.82, dmg: 34, chainRange: 100, chainFalloff: 0.62, critChance: 0.12, critMult: 2.0, critRadius: 34 },
            { price: 26, range: 157, fireRate: 0.76, dmg: 44, chainRange: 105, chainFalloff: 0.64, critChance: 0.14, critMult: 2.0, critRadius: 36 },
            { price: 35, range: 164, fireRate: 0.70, dmg: 57, chainRange: 110, chainFalloff: 0.66, critChance: 0.16, critMult: 2.1, critRadius: 38 },
            { price: 47, range: 171, fireRate: 0.64, dmg: 74, chainRange: 116, chainFalloff: 0.68, critChance: 0.18, critMult: 2.2, critRadius: 41 },
            { price: 64, range: 180, fireRate: 0.58, dmg: 96, chainRange: 124, chainFalloff: 0.72, critChance: 0.22, critMult: 2.3, critRadius: 45 },
        ],
    },
    28: {
        name: 'Railstar', category: CATEGORY.ATTACK, shape: 'piercer', color: '#fb8500',
        levels: [
            { price: 70, range: 230, fireRate: 1.65, dmg: 118, pierceRange: 150, pierceFalloff: 0.78, heavyBonusMult: 1.3, heavyThreshold: 300 },
            { price: 40, range: 242, fireRate: 1.52, dmg: 152, pierceRange: 160, pierceFalloff: 0.8, heavyBonusMult: 1.35, heavyThreshold: 300 },
            { price: 54, range: 254, fireRate: 1.39, dmg: 197, pierceRange: 170, pierceFalloff: 0.82, heavyBonusMult: 1.4, heavyThreshold: 300 },
            { price: 72, range: 266, fireRate: 1.26, dmg: 256, pierceRange: 182, pierceFalloff: 0.84, heavyBonusMult: 1.45, heavyThreshold: 300 },
            { price: 96, range: 280, fireRate: 1.12, dmg: 332, pierceRange: 195, pierceFalloff: 0.87, heavyBonusMult: 1.55, heavyThreshold: 300 },
        ],
        targeting: 'strongest',
    },
};

export const EXPANSION_TOWER_TYPES_V3 = Object.keys(EXPANSION_TOWER_DEFS_V3).map(Number);
