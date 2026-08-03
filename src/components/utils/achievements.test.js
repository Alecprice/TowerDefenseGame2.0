import { describe, it, expect, beforeEach } from 'vitest';
import { recordStat, getStats, isUnlocked, getUnlockedIds, resetAchievements, ACHIEVEMENTS } from './achievements';

describe('achievements', () => {
    beforeEach(() => {
        resetAchievements();
    });

    it('starts with no achievements unlocked', () => {
        expect(getUnlockedIds()).toEqual([]);
        ACHIEVEMENTS.forEach(a => expect(isUnlocked(a.id)).toBe(false));
    });

    it('"max" mode keeps the higher of the current and new value', () => {
        recordStat('bestWaveAnyMap', 10, 'max');
        recordStat('bestWaveAnyMap', 3, 'max'); // should NOT regress
        expect(getStats().bestWaveAnyMap).toBe(10);
        recordStat('bestWaveAnyMap', 15, 'max');
        expect(getStats().bestWaveAnyMap).toBe(15);
    });

    it('"add" mode accumulates a running total', () => {
        recordStat('bossKills', 3, 'add');
        recordStat('bossKills', 4, 'add');
        expect(getStats().bossKills).toBe(7);
    });

    it('unlocks an achievement the moment its threshold is crossed, and returns it', () => {
        const unlocked = recordStat('bestWaveAnyMap', 5, 'max');
        expect(unlocked.map(a => a.id)).toContain('first_wave');
        expect(isUnlocked('first_wave')).toBe(true);
    });

    it('does not re-report an already-unlocked achievement on subsequent calls', () => {
        recordStat('bestWaveAnyMap', 5, 'max');
        const secondCall = recordStat('bestWaveAnyMap', 6, 'max');
        expect(secondCall.map(a => a.id)).not.toContain('first_wave');
    });

    it('a single stat update can unlock multiple thresholds at once', () => {
        const unlocked = recordStat('bestWaveAnyMap', 35, 'max');
        const ids = unlocked.map(a => a.id);
        expect(ids).toContain('first_wave');
        expect(ids).toContain('endless_20');
        expect(ids).toContain('endless_35');
    });
});
