import { describe, it, expect } from 'vitest';
import { TOWER_DEFS_V3, TOWER_TYPES_V3 } from './towerDefsV3';
import { CATEGORY } from './towerCategory';
import { Tower } from './tower';

describe('Game 3.0 tower catalog', () => {
    it('has exactly 22 tower types, each with 5 levels', () => {
        expect(TOWER_TYPES_V3.length).toBe(22);
        TOWER_TYPES_V3.forEach(type => {
            expect(TOWER_DEFS_V3[type].levels.length).toBe(5);
        });
    });

    it('has 15 attack towers, 5 support towers, and 2 resource towers', () => {
        const categories = TOWER_TYPES_V3.map(t => TOWER_DEFS_V3[t].category);
        expect(categories.filter(c => c === CATEGORY.ATTACK || c === CATEGORY.POISON || c === CATEGORY.SLOW).length).toBe(15);
        expect(categories.filter(c => c === CATEGORY.SUPPORT).length).toBe(5);
        expect(categories.filter(c => c === CATEGORY.BANK || c === CATEGORY.CRYSTAL).length).toBe(2);
    });

    it('no support tower deals any direct damage', () => {
        TOWER_TYPES_V3.forEach(type => {
            const def = TOWER_DEFS_V3[type];
            if (def.category === CATEGORY.SUPPORT) {
                def.levels.forEach(level => {
                    expect(level.dmg || 0).toBe(0);
                });
            }
        });
    });

    it('exactly one support tower is a debuff (Blight Totem - has slowFloor, no buff fields)', () => {
        const debuffTowers = TOWER_TYPES_V3.filter(type => {
            const def = TOWER_DEFS_V3[type];
            return def.category === CATEGORY.SUPPORT && def.levels[0].slowFloor !== undefined;
        });
        expect(debuffTowers.length).toBe(1);
    });

    it('every attack tower except the plain baseline (Vanguard) has a distinguishing field or targeting rule', () => {
        const commonFields = new Set(['price', 'range', 'fireRate', 'dmg']);
        TOWER_TYPES_V3.forEach(type => {
            if (type === 1) return; // Vanguard is deliberately the plain, no-gimmick baseline
            const def = TOWER_DEFS_V3[type];
            if (def.category !== CATEGORY.ATTACK && def.category !== CATEGORY.POISON && def.category !== CATEGORY.SLOW) return;
            const extraFields = Object.keys(def.levels[0]).filter(f => !commonFields.has(f));
            const hasDistinctTargeting = def.targeting !== undefined || def.aoe !== undefined || def.global !== undefined;
            expect(extraFields.length > 0 || hasDistinctTargeting).toBe(true);
        });
    });

    it('the engine (Tower + defsTable) constructs a V3 tower correctly', () => {
        const t = new Tower(0, 0, 22, TOWER_DEFS_V3); // Crystal Forge
        expect(t.def.name).toBe('Crystal Forge');
        expect(t.def.category).toBe(CATEGORY.CRYSTAL);
        expect(t.price).toBe(TOWER_DEFS_V3[22].levels[0].price);
    });
});
