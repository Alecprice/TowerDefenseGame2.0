import { beforeEach, describe, expect, it } from 'vitest';
import { getMapStars, getTotalStars, isMapUnlockedV31, recordMapResultV31 } from './progressionV31';

beforeEach(() => localStorage.clear());

describe('progressionV31', () => {
  it('awards stars from wave, difficulty, and flawless play', () => {
    recordMapResultV31(0, { wave: 15, difficultyKey: 'normal', modeKey: 'classic', livesLost: 0, ranked: false });
    expect(getMapStars(0)).toBe(3);
    expect(getTotalStars()).toBe(3);
  });

  it('never reduces an existing star result', () => {
    recordMapResultV31(0, { wave: 15, difficultyKey: 'normal', modeKey: 'classic', livesLost: 0, ranked: false });
    recordMapResultV31(0, { wave: 5, difficultyKey: 'easy', modeKey: 'classic', livesLost: 4, ranked: false });
    expect(getMapStars(0)).toBe(3);
  });

  it('starts with the first five maps available', () => {
    for (let index = 0; index < 5; index++) expect(isMapUnlockedV31(index)).toBe(true);
  });
});
