import { describe, it, expect } from 'vitest';
import './contentExpansionRuntime';
import { GAME_MODE_ORDER } from './gameModes';
import {
    OPENING_BASE_MONEY,
    buildDraftRosterForEconomy,
    cheapestCombatTowerCost,
    getOpeningEconomy,
} from './openingEconomyV32';

const DIFFICULTIES = ['easy', 'basic', 'normal', 'hard', 'challenge'];

function opening(modeKey, difficultyKey = 'basic', seed = 'standard', metaStartGoldBonus = 0) {
    const draftRoster = modeKey === 'draft' ? buildDraftRosterForEconomy(seed) : null;
    return getOpeningEconomy({ difficultyKey, modeKey, draftRoster, metaStartGoldBonus });
}

describe('Tower Defense 3.2 opening economy', () => {
    it('uses a deliberately narrow difficulty wallet ladder', () => {
        expect(OPENING_BASE_MONEY).toEqual({ easy: 22, basic: 20, normal: 18, hard: 16, challenge: 14 });
    });

    it('always lets every mode and difficulty buy at least one combat tower immediately', () => {
        for (const modeKey of GAME_MODE_ORDER) {
            for (const difficultyKey of DIFFICULTIES) {
                const result = opening(modeKey, difficultyKey);
                expect(result.freshMoney, `${modeKey}/${difficultyKey}`).toBeGreaterThanOrEqual(result.cheapestCombat);
            }
        }
    });

    it('keeps every non-draft fresh opening below three Vanguards worth of money', () => {
        for (const modeKey of GAME_MODE_ORDER.filter(key => key !== 'draft')) {
            for (const difficultyKey of DIFFICULTIES) {
                expect(opening(modeKey, difficultyKey).freshMoney, `${modeKey}/${difficultyKey}`).toBeLessThan(30);
            }
        }
    });

    it('gives high-pressure modes a cushion but trims modes with large tower/reward advantages', () => {
        const classic = opening('classic').freshMoney;
        expect(classic).toBe(20);
        expect(opening('swarm').freshMoney).toBeGreaterThan(classic);
        expect(opening('blackout').freshMoney).toBeGreaterThan(classic);
        expect(opening('apocalypse').freshMoney).toBeGreaterThan(classic);
        expect(opening('glasscannon').freshMoney).toBeLessThan(classic);
        expect(opening('bounty').freshMoney).toBeLessThan(classic);
        expect(opening('precision').freshMoney).toBeLessThan(classic);
    });

    it('funds the actual deterministic Draft roster without gifting a blanket oversized wallet', () => {
        for (const seed of ['standard', 'alpha', 'daily-2026-08-15', 'hard-draft', 'omega']) {
            const roster = buildDraftRosterForEconomy(seed);
            const cheapest = cheapestCombatTowerCost([...roster]);
            const result = getOpeningEconomy({ difficultyKey: 'basic', modeKey: 'draft', draftRoster: roster });
            expect(result.freshMoney).toBeGreaterThanOrEqual(cheapest);
            expect(result.freshMoney).toBeLessThan(Math.max(30, cheapest + 10));
        }
    });

    it('caps permanent starting-gold progression so it cannot explode the opening curve', () => {
        for (const modeKey of GAME_MODE_ORDER) {
            const fresh = opening(modeKey, 'basic', 'standard', 0);
            const maxedProfile = opening(modeKey, 'basic', 'standard', 999);
            expect(maxedProfile.metaApplied).toBeLessThanOrEqual(Math.floor(fresh.freshMoney * 0.4));
            expect(maxedProfile.totalMoney).toBeLessThanOrEqual(Math.floor(fresh.freshMoney * 1.4));
        }
    });
});
