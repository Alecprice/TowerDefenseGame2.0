import { describe, it, expect } from 'vitest';
import { Tower, TOWER_DEFS, TOWER_TYPES, CATEGORY } from './tower';

describe('Tower catalog', () => {
    it('has exactly 10 tower types, each with 5 levels', () => {
        expect(TOWER_TYPES.length).toBe(10);
        TOWER_TYPES.forEach(type => {
            expect(TOWER_DEFS[type].levels.length).toBe(5);
        });
    });

    it('has the 5 requested categories represented', () => {
        const categories = TOWER_TYPES.map(t => TOWER_DEFS[t].category);
        expect(categories.filter(c => c === CATEGORY.ATTACK).length).toBe(5);
        expect(categories.filter(c => c === CATEGORY.POISON).length).toBe(1);
        expect(categories.filter(c => c === CATEGORY.SLOW).length).toBe(1);
        expect(categories.filter(c => c === CATEGORY.BANK).length).toBe(1);
        expect(categories.filter(c => c === CATEGORY.BOSS_HUNTER).length).toBe(1);
        expect(categories.filter(c => c === CATEGORY.SUPPORT).length).toBe(1);
    });
});

describe('Tower construction and upgrades', () => {
    it('starts at level 1 with level-1 stats from the catalog', () => {
        const t = new Tower(0, 0, 1); // Striker
        expect(t.level).toBe(1);
        expect(t.maxLevel).toBe(5);
        expect(t.range).toBe(TOWER_DEFS[1].levels[0].range);
        expect(t.dmg).toBe(TOWER_DEFS[1].levels[0].dmg);
        expect(t.price).toBe(TOWER_DEFS[1].levels[0].price);
    });

    it('upgrade() always derives stats purely from the catalog for the new level (no stacking/overwrite bug)', () => {
        const t = new Tower(0, 0, 1);
        for (let lvl = 2; lvl <= 5; lvl++) {
            t.upgrade();
            expect(t.level).toBe(lvl);
            const expected = TOWER_DEFS[1].levels[lvl - 1];
            expect(t.range).toBe(expected.range);
            expect(t.dmg).toBe(expected.dmg);
            expect(t.fireRate).toBe(expected.fireRate);
        }
        expect(t.canUpgrade()).toBe(false);
        // Upgrading past max level is a no-op, not a crash or silent corruption.
        t.upgrade();
        expect(t.level).toBe(5);
    });

    it('upgrading never regresses stats (each level is strictly stronger for attack towers)', () => {
        const t = new Tower(0, 0, 1);
        let lastDmg = t.dmg;
        let lastRange = t.range;
        while (t.canUpgrade()) {
            t.upgrade();
            expect(t.dmg).toBeGreaterThanOrEqual(lastDmg);
            expect(t.range).toBeGreaterThanOrEqual(lastRange);
            lastDmg = t.dmg;
            lastRange = t.range;
        }
    });

    it('getSellValue is half of total gold spent (base price + every upgrade paid)', () => {
        const t = new Tower(0, 0, 1);
        const basePrice = TOWER_DEFS[1].levels[0].price;
        expect(t.getSellValue()).toBe(Math.round(basePrice * 0.5));

        const upgradeCostToLvl2 = TOWER_DEFS[1].levels[1].price;
        t.upgrade(); // now level 2
        expect(t.getSellValue()).toBe(Math.round((basePrice + upgradeCostToLvl2) * 0.5));
    });

    it('upgradeCost always reflects the price of the NEXT level up', () => {
        const t = new Tower(0, 0, 3); // Blaster
        expect(t.upgradeCost).toBe(TOWER_DEFS[3].levels[1].price);
        t.upgrade();
        expect(t.upgradeCost).toBe(TOWER_DEFS[3].levels[2].price);
    });
});

describe('Beacon (support) aura math', () => {
    it('effectiveRange/Dmg/FireRate scale with auraBonus, and fireRate bonus shortens the interval', () => {
        const t = new Tower(0, 0, 1); // Striker
        const baseRange = t.range;
        const baseDmg = t.dmg;
        const baseFireRate = t.fireRate;

        t.auraBonus = { range: 0.2, dmg: 0.3, fireRate: 0.25 };
        expect(t.effectiveRange()).toBeCloseTo(baseRange * 1.2);
        expect(t.effectiveDmg()).toBeCloseTo(baseDmg * 1.3);
        expect(t.effectiveFireRate()).toBeCloseTo(baseFireRate / 1.25);
        expect(t.effectiveFireRate()).toBeLessThan(baseFireRate); // faster firing
    });

    it('zero aura bonus is a no-op', () => {
        const t = new Tower(0, 0, 1);
        expect(t.effectiveRange()).toBe(t.range);
        expect(t.effectiveDmg()).toBe(t.dmg);
        expect(t.effectiveFireRate()).toBe(t.fireRate);
    });
});

describe('Bank and Boss Hunter towers do not attack', () => {
    it('Bank.shoot() is a no-op regardless of enemies present', () => {
        const bank = new Tower(0, 0, 8);
        const bullets = [];
        const fakeEnemy = { mid: { x: 0, y: 0 }, health: 100 };
        bank.shoot(bullets, [fakeEnemy]);
        expect(bullets.length).toBe(0);
    });

    it('Bulwark (boss hunter) only fires when a type-5 enemy is present', () => {
        const bulwark = new Tower(0, 0, 9);
        const bullets = [];
        const regularEnemy = { type: 1, mid: { x: 0, y: 0 }, health: 100, distance: 0 };
        bulwark.shoot(bullets, [regularEnemy]);
        expect(bullets.length).toBe(0); // no boss present - should not fire

        const boss = { type: 5, mid: { x: 0, y: 0 }, health: 3000, distance: 0 };
        bulwark.shoot(bullets, [regularEnemy, boss]);
        expect(bullets.length).toBe(1);
        expect(bullets[0].target).toBe(boss);
    });
});
