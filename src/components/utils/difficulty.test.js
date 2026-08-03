import { describe, it, expect } from 'vitest';
import { DIFFICULTIES, DIFFICULTY_ORDER, getDifficulty } from './difficulty';

describe('difficulty tiers', () => {
    it('has exactly the 5 requested tiers in order', () => {
        expect(DIFFICULTY_ORDER).toEqual(['easy', 'basic', 'normal', 'hard', 'challenge']);
    });

    it('Easy is the unmodified baseline (1x)', () => {
        expect(DIFFICULTIES.easy.mult).toBe(1.0);
    });

    it('each tier is exactly the requested percentage harder than Easy', () => {
        expect(DIFFICULTIES.basic.mult).toBeCloseTo(1.25);
        expect(DIFFICULTIES.normal.mult).toBeCloseTo(1.5);
        expect(DIFFICULTIES.hard.mult).toBeCloseTo(1.75);
        expect(DIFFICULTIES.challenge.mult).toBeCloseTo(2.0);
    });

    it('multipliers strictly increase down the tier order', () => {
        const mults = DIFFICULTY_ORDER.map(k => DIFFICULTIES[k].mult);
        for (let i = 1; i < mults.length; i++) {
            expect(mults[i]).toBeGreaterThan(mults[i - 1]);
        }
    });

    it('getDifficulty falls back to Easy for an unknown/missing key', () => {
        expect(getDifficulty('nonsense')).toBe(DIFFICULTIES.easy);
        expect(getDifficulty(undefined)).toBe(DIFFICULTIES.easy);
        expect(getDifficulty(null)).toBe(DIFFICULTIES.easy);
    });

    it('getDifficulty resolves a valid key to the matching tier', () => {
        expect(getDifficulty('challenge')).toBe(DIFFICULTIES.challenge);
    });

    it('Easy leaves the economy unmodified (both multipliers at 1x)', () => {
        expect(DIFFICULTIES.easy.startMoneyMult).toBe(1.0);
        expect(DIFFICULTIES.easy.refundMult).toBe(1.0);
    });

    it('starting money and sell refund get strictly tighter at each harder tier', () => {
        const startMults = DIFFICULTY_ORDER.map(k => DIFFICULTIES[k].startMoneyMult);
        const refundMults = DIFFICULTY_ORDER.map(k => DIFFICULTIES[k].refundMult);
        for (let i = 1; i < startMults.length; i++) {
            expect(startMults[i]).toBeLessThan(startMults[i - 1]);
            expect(refundMults[i]).toBeLessThan(refundMults[i - 1]);
        }
    });
});
