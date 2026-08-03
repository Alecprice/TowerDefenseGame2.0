import { describe, it, expect, vi } from 'vitest';
import { Projectile } from './projectile';
import { Enemy } from './enemy';

function makeEnemy(type = 1, overrides = {}) {
    const e = new Enemy(0, 0, type);
    Object.assign(e, overrides);
    e.mid = { x: e.x + e.width / 2, y: e.y + e.height / 2 };
    return e;
}

describe('Projectile Game 3.0 mechanics', () => {
    it('execute: deals exactly lethal damage (not overkill) when target is under the threshold', () => {
        const target = makeEnemy(1, { health: 10, maxHealth: 150 });
        const p = new Projectile(0, 0, 'attack', target, 999, { executeThreshold: 0.15 });
        p.impact([target]);
        expect(target.health).toBe(0);
        expect(target.dead).toBe(true);
    });

    it('execute does not trigger above the threshold - normal damage applies', () => {
        const target = makeEnemy(1, { health: 140, maxHealth: 150 });
        const p = new Projectile(0, 0, 'attack', target, 50, { executeThreshold: 0.15 });
        p.impact([target]);
        expect(target.health).toBe(90);
    });

    it('shieldBonusMult multiplies damage only while the target still has an active shield', () => {
        const target = makeEnemy(1, { shieldHP: 1000, health: 150, maxHealth: 150 });
        const p = new Projectile(0, 0, 'attack', target, 50, { shieldBonusMult: 2.0 });
        p.impact([target]);
        expect(target.shieldHP).toBe(900); // 1000 - (50*2)
    });

    it('heavyBonusMult only applies to enemies at/above the heavy threshold', () => {
        const lightTarget = makeEnemy(1, { health: 150, maxHealth: 150 });
        const heavyTarget = makeEnemy(3, { health: 500, maxHealth: 500 });
        const p1 = new Projectile(0, 0, 'attack', lightTarget, 50, { heavyBonusMult: 2.0, heavyThreshold: 300 });
        p1.impact([lightTarget]);
        expect(lightTarget.health).toBe(100); // no bonus, -50

        const p2 = new Projectile(0, 0, 'attack', heavyTarget, 50, { heavyBonusMult: 2.0, heavyThreshold: 300 });
        p2.impact([heavyTarget]);
        expect(heavyTarget.health).toBe(400); // bonus applies, -100
    });

    it('critChance=1 guarantees a critMult-scaled hit', () => {
        const target = makeEnemy(1, { health: 150, maxHealth: 150 });
        const p = new Projectile(0, 0, 'attack', target, 50, { critChance: 1, critMult: 3 });
        p.impact([target]);
        expect(target.health).toBe(0); // 150 - 150
    });

    it('critChance=0 never crits', () => {
        const target = makeEnemy(1, { health: 150, maxHealth: 150 });
        const p = new Projectile(0, 0, 'attack', target, 50, { critChance: 0, critMult: 5 });
        p.impact([target]);
        expect(target.health).toBe(100); // plain -50
    });

    it('armorShred permanently reduces the target armor stat, floored at 0', () => {
        const target = makeEnemy(4); // Armored, has base armor
        const startArmor = target.armor;
        const p = new Projectile(0, 0, 'attack', target, 50, { armorShred: startArmor + 10 });
        p.impact([target]);
        expect(target.armor).toBe(0);
    });

    it('chain arcs to the single nearest other enemy within chainRange, at reduced damage', () => {
        const primary = makeEnemy(1, { health: 150, maxHealth: 150 });
        primary.mid = { x: 0, y: 0 };
        const near = makeEnemy(1, { health: 150, maxHealth: 150 });
        near.mid = { x: 30, y: 0 }; // inside chainRange
        const far = makeEnemy(1, { health: 150, maxHealth: 150 });
        far.mid = { x: 500, y: 0 }; // outside chainRange

        const p = new Projectile(0, 0, 'attack', primary, 100, { chainRange: 90, chainFalloff: 0.5 });
        p.impact([primary, near, far]);

        expect(primary.health).toBe(50); // full damage
        expect(near.health).toBe(100);   // 150 - 50 (50% falloff)
        expect(far.health).toBe(150);    // untouched, out of range
    });

    it('splashResistance reduces (not eliminates) splash damage taken', () => {
        const primary = makeEnemy(1, { health: 150, maxHealth: 150 });
        primary.mid = { x: 0, y: 0 };
        const resistant = makeEnemy(9, { health: 420, maxHealth: 420 }); // Juggernaut
        resistant.mid = { x: 20, y: 0 };

        const p = new Projectile(0, 0, 'attack', primary, 100, { splashRadius: 60, splashPct: 0.5 });
        p.impact([primary, resistant]);

        // splashDmg = round(100*0.5) = 50; Juggernaut resists 65% of it
        expect(resistant.health).toBe(420 - Math.round(50 * (1 - resistant.splashResistance)));
    });

    it('a tower with none of the Game 3.0 fields behaves exactly as before (no crash, no side effects)', () => {
        const target = makeEnemy(1, { health: 150, maxHealth: 150 });
        const p = new Projectile(0, 0, 'attack', target, 50, { towerType: 1 });
        expect(() => p.impact([target])).not.toThrow();
        expect(target.health).toBe(100);
        expect(target.armor).toBeUndefined();
    });
});
