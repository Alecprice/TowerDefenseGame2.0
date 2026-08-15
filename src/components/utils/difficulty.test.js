import { describe, it, expect } from 'vitest';
import { DIFFICULTIES, DIFFICULTY_ORDER, getDifficulty } from './difficulty';

describe('difficulty tiers', () => {
    it('has the five public tiers in order', () => {
        expect(DIFFICULTY_ORDER).toEqual(['easy', 'basic', 'normal', 'hard', 'challenge']);
    });

    it('Casual is intentionally easier than the standard baseline', () => {
        expect(DIFFICULTIES.easy.mult).toBeCloseTo(0.9);
        expect(DIFFICULTIES.easy.startMoneyMult).toBeCloseTo(1.15);
        expect(DIFFICULTIES.easy.refundMult).toBeCloseTo(1.0);
    });

    it('uses the current 3.1 enemy-pressure ladder', () => {
        expect(DIFFICULTIES.basic.mult).toBeCloseTo(1.15);
        expect(DIFFICULTIES.normal.mult).toBeCloseTo(1.5);
        expect(DIFFICULTIES.hard.mult).toBeCloseTo(1.9);
        expect(DIFFICULTIES.challenge.mult).toBeCloseTo(2.35);
    });

    it('multipliers strictly increase down the tier order', () => {
        const mults = DIFFICULTY_ORDER.map(k => DIFFICULTIES[k].mult);
        for (let i = 1; i < mults.length; i++) expect(mults[i]).toBeGreaterThan(mults[i - 1]);
    });

    it('elite pressure strictly increases down the tier order', () => {
        const eliteMults = DIFFICULTY_ORDER.map(k => DIFFICULTIES[k].eliteMult);
        for (let i = 1; i < eliteMults.length; i++) expect(eliteMults[i]).toBeGreaterThan(eliteMults[i - 1]);
    });

    it('getDifficulty falls back to the recommended Normal tier', () => {
        expect(getDifficulty('nonsense')).toBe(DIFFICULTIES.basic);
        expect(getDifficulty(undefined)).toBe(DIFFICULTIES.basic);
        expect(getDifficulty(null)).toBe(DIFFICULTIES.basic);
    });

    it('getDifficulty resolves a valid key to the matching tier', () => {
        expect(getDifficulty('challenge')).toBe(DIFFICULTIES.challenge);
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
