import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from './achievements';

const mapAchievements = ACHIEVEMENTS.filter(a => a.category === 'map');
const globalAchievements = ACHIEVEMENTS.filter(a => a.category === 'global');

describe('Tower Defense 3.2 achievement catalog', () => {
    it('contains exactly 550 achievements with unique stable ids', () => {
        expect(ACHIEVEMENTS).toHaveLength(550);
        expect(new Set(ACHIEVEMENTS.map(a => a.id)).size).toBe(550);
    });

    it('contains exactly 500 map achievements and 50 global achievements', () => {
        expect(mapAchievements).toHaveLength(500);
        expect(globalAchievements).toHaveLength(50);
    });

    it('contains exactly five achievements for every map', () => {
        for (let mapIndex = 0; mapIndex < 100; mapIndex++) {
            const goals = mapAchievements.filter(a => a.mapIndex === mapIndex);
            expect(goals, `map ${mapIndex + 1}`).toHaveLength(5);
            expect(new Set(goals.map(a => a.tier))).toEqual(new Set([1, 2, 3, 4, 5]));
        }
    });

    it('every achievement has meaningful display text and executable logic', () => {
        ACHIEVEMENTS.forEach(a => {
            expect(a.name?.trim().length).toBeGreaterThan(3);
            expect(a.desc?.trim().length).toBeGreaterThan(8);
            expect(typeof a.check).toBe('function');
        });
    });
});
