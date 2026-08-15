import { beforeEach, describe, expect, it } from 'vitest';
import { getProgressionV3, isTowerUnlockedV3 } from './progressionV3';

describe('Game 3 starter tower regression guard', () => {
    beforeEach(() => localStorage.clear());

    it('always unlocks the starter tower on a fresh browser', () => {
        expect(isTowerUnlockedV3(1)).toBe(true);
        expect(getProgressionV3().towerUnlocks[0]).toBe(true);
    });

    it('repairs a save where towerUnlocks is missing', () => {
        localStorage.setItem('td3_progression', JSON.stringify({ mapWavesCompleted: [0], mapHighestWaves: [0] }));
        expect(isTowerUnlockedV3(1)).toBe(true);
    });

    it('repairs an all-false legacy tower array so the game remains playable', () => {
        localStorage.setItem('td3_progression', JSON.stringify({ towerUnlocks: new Array(28).fill(false) }));
        expect(isTowerUnlockedV3(1)).toBe(true);
    });
});
