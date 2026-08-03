import { describe, it, expect, vi } from 'vitest';
import { Enemy } from './enemy';

describe('Enemy.hit()', () => {
    it('reduces health by the raw damage amount', () => {
        const e = new Enemy(0, 0, 1); // Grunt, 150 HP
        e.hit(50);
        expect(e.health).toBe(100);
        expect(e.dead).toBe(false);
    });

    it('marks dead once health drops to or below zero', () => {
        const e = new Enemy(0, 0, 1);
        e.hit(1000);
        expect(e.dead).toBe(true);
    });

    it('armored enemies reduce incoming damage by their flat armor value, floored at 1', () => {
        const e = new Enemy(0, 0, 4); // Armored, armor = 8
        e.hit(10);
        expect(e.health).toBe(350 - 2); // 10 - 8 = 2 damage gets through
        e.hit(3); // 3 - 8 would be negative, floors at 1
        expect(e.health).toBe(350 - 2 - 1);
    });
});

describe('New enemy types: Flyer (6) and Teleporter (7)', () => {
    it('Flyer is completely immune to slow effects', () => {
        const e = new Enemy(0, 0, 6);
        const baseSpeed = e.speed;
        e.applySlow(0.3);
        expect(e.speed).toBe(baseSpeed);
        expect(e.slowUntil).toBeUndefined();
    });

    it('a normal enemy (not a Flyer) is still slowed as before', () => {
        const e = new Enemy(0, 0, 1);
        const baseSpeed = e.speed;
        e.applySlow(0.3);
        expect(e.speed).toBeCloseTo(baseSpeed * 0.3);
    });

    it('Teleporter takes one large forward jump toward its waypoint once its cooldown elapses', () => {
        const path = [{ x: 500, y: 0 }];
        const e = new Enemy(0, 0, 7);
        e.nextTeleportAt = 0; // force it to be ready immediately
        const distBefore = e.x;
        e.move(path);
        expect(e.x).toBeGreaterThan(distBefore + 50); // jumped well past a normal step
        expect(e.nextTeleportAt).toBeGreaterThan(Date.now());
    });

    it('Teleporter does not jump again before its cooldown elapses', () => {
        const path = [{ x: 5000, y: 0 }];
        const e = new Enemy(0, 0, 7);
        e.nextTeleportAt = Date.now() + 10000; // not ready
        const distBefore = e.x;
        e.move(path);
        // Only a normal-speed step should have happened, not a 70px jump.
        expect(e.x - distBefore).toBeLessThan(10);
    });
});

describe('Enemy shields (shieldHP absorbs damage before health)', () => {
    it('a hit smaller than the shield is fully absorbed - health untouched, hit() returns 0', () => {
        const e = new Enemy(0, 0, 1); // 150 HP
        e.shieldHP = 50;
        const dealt = e.hit(30);
        expect(dealt).toBe(0);
        expect(e.health).toBe(150);
        expect(e.shieldHP).toBe(20);
    });

    it('a hit larger than the remaining shield breaks it and the excess carries into health', () => {
        const e = new Enemy(0, 0, 1); // 150 HP
        e.shieldHP = 20;
        const dealt = e.hit(50);
        expect(dealt).toBe(30); // 50 - 20 shield = 30 real damage
        expect(e.shieldHP).toBe(0);
        expect(e.health).toBe(120);
    });

    it('with no shield, hit() behaves exactly as before and returns the full (armor-adjusted) damage', () => {
        const e = new Enemy(0, 0, 1);
        const dealt = e.hit(40);
        expect(dealt).toBe(40);
        expect(e.health).toBe(110);
    });
});

describe('Enemy() difficultyMult (harder difficulty tiers hit for more)', () => {
    it('defaults to unmodified attack when no difficultyMult is passed', () => {
        const e = new Enemy(0, 0, 1);
        expect(e.atk).toBe(1);
    });

    it('scales attack damage up with a higher difficultyMult, never below the base value', () => {
        const easy = new Enemy(0, 0, 4, 1, 1.0); // Armored, atk 5 baseline
        const challenge = new Enemy(0, 0, 4, 1, 2.0);
        expect(challenge.atk).toBeGreaterThan(easy.atk);
        expect(challenge.atk).toBe(Math.round(easy.atk * 2.0));
    });
});

describe('Enemy.drawHealth() - bar shrinks and colors with remaining health', () => {
    function fakeCtx() {
        const fillRects = [];
        return {
            save() {}, restore() {},
            set fillStyle(v) { this._fillStyle = v; },
            get fillStyle() { return this._fillStyle; },
            fillRect(x, y, w, h) { fillRects.push({ x, y, w, h, color: this._fillStyle }); },
            strokeRect() {},
            set strokeStyle(v) {}, set lineWidth(v) {},
            fillRects,
        };
    }

    it('at full health, the fill bar is the full width and green', () => {
        const e = new Enemy(0, 0, 1); // 150 HP
        const ctx = fakeCtx();
        e.drawHealth(ctx);
        const fill = ctx.fillRects[1]; // [0] = background track, [1] = health fill
        expect(fill.w).toBeCloseTo(e.width * 0.8);
        expect(fill.color).toBe('#4ade80');
    });

    it('the fill bar shrinks proportionally as health drops, and empties at 0', () => {
        const e = new Enemy(0, 0, 1); // 150 HP
        e.hit(75); // 50% remaining
        const ctx = fakeCtx();
        e.drawHealth(ctx);
        expect(ctx.fillRects[1].w).toBeCloseTo(e.width * 0.8 * 0.5, 1);

        e.hit(1000); // dead, health goes negative internally
        const ctx2 = fakeCtx();
        e.drawHealth(ctx2);
        expect(ctx2.fillRects[1].w).toBe(0); // clamped, never a negative-width bar
    });

    it('color shifts from green to yellow to red as health drops', () => {
        const e = new Enemy(0, 0, 1); // 150 HP
        const ctx = fakeCtx();

        e.drawHealth(ctx);
        expect(ctx.fillRects[1].color).toBe('#4ade80'); // 100% - green

        e.hit(75); // 50% - yellow
        e.drawHealth(ctx);
        expect(ctx.fillRects[3].color).toBe('#facc15');

        e.hit(60); // 10% - red
        e.drawHealth(ctx);
        expect(ctx.fillRects[5].color).toBe('#ef4444');
    });
});

describe('Enemy.applyPoison() - must not stack', () => {
    it('a single application sets dps and an expiry in the future', () => {
        const e = new Enemy(0, 0, 1);
        e.applyPoison(10, 3000);
        expect(e.poison.dps).toBe(10);
        expect(e.poison.expiresAt).toBeGreaterThan(Date.now());
    });

    it('re-applying a WEAKER poison while one is active keeps the stronger dps (does not stack, does not weaken)', () => {
        const e = new Enemy(0, 0, 1);
        e.applyPoison(20, 3000);
        e.applyPoison(5, 3000);
        expect(e.poison.dps).toBe(20); // stays at the stronger value, not 25 (stacked) or 5 (overwritten)
    });

    it('re-applying a STRONGER poison replaces the weaker dps', () => {
        const e = new Enemy(0, 0, 1);
        e.applyPoison(10, 3000);
        e.applyPoison(30, 3000);
        expect(e.poison.dps).toBe(30);
    });

    it('multiple hits never produce a combined dps greater than the single strongest hit', () => {
        const e = new Enemy(0, 0, 1);
        [12, 8, 25, 19, 30, 3].forEach(dps => e.applyPoison(dps, 3000));
        expect(e.poison.dps).toBe(30);
    });

    it('tick() applies poison damage proportional to dt and expires cleanly', () => {
        vi.useFakeTimers();
        const e = new Enemy(0, 0, 1); // 150 HP
        e.applyPoison(10, 1000); // 10 dps for 1 second
        e.tick(0.5); // half a second of poison
        expect(e.health).toBeCloseTo(145); // 150 - 10*0.5
        vi.advanceTimersByTime(1100); // let the poison expire
        const healthAfterExpiry = e.health;
        e.tick(1); // should do nothing now - poison expired
        expect(e.health).toBe(healthAfterExpiry);
        expect(e.poison).toBeNull();
        vi.useRealTimers();
    });
});

describe('Enemy.drawStatusEffects()', () => {
    function makeMockCtx() {
        return {
            save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), stroke: vi.fn(),
            arc: vi.fn(), setLineDash: vi.fn(),
        };
    }

    it('draws nothing when no debuff is active', () => {
        const e = new Enemy(0, 0, 1);
        const ctx = makeMockCtx();
        e.drawStatusEffects(ctx);
        expect(ctx.beginPath).not.toHaveBeenCalled();
    });

    it('draws a ring when poisoned', () => {
        const e = new Enemy(0, 0, 1);
        e.applyPoison(10, 3000);
        const ctx = makeMockCtx();
        e.drawStatusEffects(ctx);
        expect(ctx.beginPath).toHaveBeenCalledTimes(1);
        expect(ctx.arc).toHaveBeenCalledTimes(1);
    });

    it('draws two rings when both poisoned and slowed', () => {
        const e = new Enemy(0, 0, 1);
        e.applyPoison(10, 3000);
        e.applySlow(0.5);
        const ctx = makeMockCtx();
        e.drawStatusEffects(ctx);
        expect(ctx.beginPath).toHaveBeenCalledTimes(2);
    });

    it('stops drawing once the debuff has expired', () => {
        vi.useFakeTimers();
        const e = new Enemy(0, 0, 1);
        e.applyPoison(10, 1000);
        vi.advanceTimersByTime(1100);
        const ctx = makeMockCtx();
        e.drawStatusEffects(ctx);
        expect(ctx.beginPath).not.toHaveBeenCalled();
        vi.useRealTimers();
    });
});

describe('Enemy.applySlow() - bounded, does not compound to a standstill', () => {
    it('floors speed at the given fraction of baseSpeed', () => {
        const e = new Enemy(0, 0, 1);
        const base = e.baseSpeed;
        e.applySlow(0.5);
        expect(e.speed).toBeCloseTo(base * 0.5);
    });

    it('repeated slow hits cannot push speed below the floor, even from many towers', () => {
        const e = new Enemy(0, 0, 1);
        const base = e.baseSpeed;
        for (let i = 0; i < 20; i++) {
            e.applySlow(0.4); // same floor applied 20 times in a row
        }
        expect(e.speed).toBeCloseTo(base * 0.4);
        expect(e.speed).toBeGreaterThan(0);
    });

    it('a stronger (lower) floor from a better tower overrides a weaker one', () => {
        const e = new Enemy(0, 0, 1);
        const base = e.baseSpeed;
        e.applySlow(0.75);
        e.applySlow(0.4);
        expect(e.speed).toBeCloseTo(base * 0.4);
    });

    it('speed recovers to baseSpeed once the slow expires via tick()', () => {
        vi.useFakeTimers();
        const e = new Enemy(0, 0, 1);
        const base = e.baseSpeed;
        e.applySlow(0.5);
        expect(e.speed).toBeCloseTo(base * 0.5);
        vi.advanceTimersByTime(2000);
        e.tick(0.016);
        expect(e.speed).toBeCloseTo(base);
        vi.useRealTimers();
    });
});
