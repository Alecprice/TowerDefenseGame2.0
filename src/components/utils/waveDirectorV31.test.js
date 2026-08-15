import { describe, expect, it } from 'vitest';
import { buildWavePlan, summarizeWavePlan } from './waveDirectorV31';

const map = {
  enemyProfile: { armoredChance: 0.25, tankChance: 0.12, speedMult: 1, healthMult: 1 },
};
const difficulty = { key: 'basic', mult: 1.15, eliteMult: 1 };

describe('waveDirectorV31', () => {
  it('is deterministic for the same run seed', () => {
    const args = { wave: 12, map, mapIndex: 2, difficulty, modeKey: 'classic', mechanic: { key: 'highground' }, seed: 'abc' };
    expect(buildWavePlan(args)).toEqual(buildWavePlan(args));
  });

  it('adds classic bosses every fifth wave', () => {
    const plan = buildWavePlan({ wave: 5, map, mapIndex: 0, difficulty, modeKey: 'classic', mechanic: { key: 'highground' }, seed: 'boss' });
    expect(plan.entries.some(entry => entry.type === 5 && entry.boss)).toBe(true);
  });

  it('adds boss-rush bosses every third wave', () => {
    const plan = buildWavePlan({ wave: 6, map, mapIndex: 0, difficulty, modeKey: 'bossrush', mechanic: { key: 'highground' }, seed: 'rush' });
    expect(plan.entries.some(entry => entry.type === 5 && entry.boss)).toBe(true);
    expect(plan.entries.some(entry => entry.trait === 'miniboss')).toBe(true);
  });

  it('summarizes the exact generated plan', () => {
    const plan = buildWavePlan({ wave: 20, map, mapIndex: 1, difficulty, modeKey: 'classic', mechanic: { key: 'crystal' }, seed: 'summary' });
    const summaryCount = summarizeWavePlan(plan).reduce((sum, item) => sum + item.count, 0);
    expect(summaryCount).toBe(plan.entries.length);
  });
});
