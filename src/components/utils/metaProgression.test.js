import { describe, it, expect, beforeEach } from 'vitest';
import {
    getMeta, coresForRun, awardRunCores, getUpgradeCost, purchaseUpgrade,
    getMetaBonuses, resetMetaProgress, META_UPGRADES,
    PALETTES, purchasePalette, selectPalette,
} from './metaProgression';

describe('metaProgression', () => {
    beforeEach(() => {
        resetMetaProgress();
    });

    it('starts with zero cores and no upgrades', () => {
        const meta = getMeta();
        expect(meta.cores).toBe(0);
        expect(meta.upgrades.startGold).toBe(0);
    });

    it('awards more cores for a longer, higher-scoring run', () => {
        expect(coresForRun(20, 1000)).toBeGreaterThan(coresForRun(5, 100));
    });

    it('awardRunCores persists the earned amount', () => {
        const earned = awardRunCores(10, 500);
        expect(earned).toBeGreaterThan(0);
        expect(getMeta().cores).toBe(earned);
        expect(getMeta().bestWave).toBe(10);
    });

    it('purchaseUpgrade fails without enough cores', () => {
        const result = purchaseUpgrade('startGold');
        expect(result.success).toBe(false);
        expect(result.reason).toBe('cores');
    });

    it('purchaseUpgrade succeeds and deducts cores once affordable', () => {
        awardRunCores(1000, 100000); // plenty of cores
        const before = getMeta().cores;
        const cost = getUpgradeCost('startGold');
        const result = purchaseUpgrade('startGold');
        expect(result.success).toBe(true);
        expect(getMeta().cores).toBe(before - cost);
        expect(getMeta().upgrades.startGold).toBe(1);
    });

    it('upgrade cost climbs with level', () => {
        awardRunCores(100000, 0);
        const cost1 = getUpgradeCost('startGold');
        purchaseUpgrade('startGold');
        const cost2 = getUpgradeCost('startGold');
        expect(cost2).toBeGreaterThan(cost1);
    });

    it('caps out at the defined max level', () => {
        awardRunCores(1000000, 0);
        const def = META_UPGRADES.startGold;
        for (let i = 0; i < def.max; i++) purchaseUpgrade('startGold');
        expect(getUpgradeCost('startGold')).toBeNull();
        expect(purchaseUpgrade('startGold').reason).toBe('maxed');
    });

    it('getMetaBonuses reflects purchased levels', () => {
        awardRunCores(1000000, 0);
        purchaseUpgrade('globalDamage');
        purchaseUpgrade('globalDamage');
        const bonuses = getMetaBonuses();
        expect(bonuses.dmgMult).toBeCloseTo(1 + 2 * META_UPGRADES.globalDamage.perLevel);
    });
});

describe('metaProgression - cosmetic palettes', () => {
    beforeEach(() => {
        resetMetaProgress();
    });

    it('starts with only the free default palette unlocked and equipped', () => {
        expect(getMeta().unlockedPalettes).toEqual(['default']);
        expect(getMeta().activePalette).toBe('default');
        expect(getMetaBonuses().paletteHueShift).toBe(0);
    });

    it('cannot purchase a palette without enough cores', () => {
        const result = purchasePalette('crimson');
        expect(result.success).toBe(false);
        expect(result.reason).toBe('cores');
    });

    it('cannot select a palette that has not been unlocked', () => {
        const result = selectPalette('crimson');
        expect(result.success).toBe(false);
        expect(result.reason).toBe('locked');
    });

    it('purchasing then selecting a palette updates the active hue shift', () => {
        awardRunCores(1000000, 0);
        const buy = purchasePalette('crimson');
        expect(buy.success).toBe(true);
        expect(getMeta().unlockedPalettes).toContain('crimson');

        const equip = selectPalette('crimson');
        expect(equip.success).toBe(true);
        expect(getMeta().activePalette).toBe('crimson');
        expect(getMetaBonuses().paletteHueShift).toBe(PALETTES.crimson.hueShift);
    });

    it('cannot re-purchase an already-owned palette', () => {
        awardRunCores(1000000, 0);
        purchasePalette('crimson');
        const second = purchasePalette('crimson');
        expect(second.success).toBe(false);
        expect(second.reason).toBe('owned');
    });
});
