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
