import { beforeEach, describe, expect, it } from 'vitest';
import { getMapMechanic, isBlockedCell, applyMapBonusToTower, getCrystalKillBonus } from './mapMechanicsV31';

const map = { grid: Array.from({ length: 12 }, () => Array(18).fill(0)) };

describe('mapMechanicsV31', () => {
  beforeEach(() => localStorage.clear());

  it('creates deterministic special tiles', () => {
    expect(getMapMechanic(0, map)).toEqual(getMapMechanic(0, map));
  });

  it('marks fortified cells as unbuildable', () => {
    const mechanic = getMapMechanic(4, map);
    expect(mechanic.key).toBe('fortified');
    expect(mechanic.specialCells.length).toBeGreaterThan(0);
    expect(isBlockedCell(mechanic, mechanic.specialCells[0].x, mechanic.specialCells[0].y)).toBe(true);
  });

  it('applies high-ground range and damage multipliers', () => {
    const mechanic = getMapMechanic(0, map);
    const tower = {};
    applyMapBonusToTower(tower, mechanic, mechanic.specialCells[0]);
    expect(tower.mapDmgMult).toBe(1.15);
    expect(tower.mapRangeMult).toBe(1.2);
  });

  it('awards crystal vein bonuses every fifth kill', () => {
    const mechanic = getMapMechanic(3, map);
    expect(getCrystalKillBonus(mechanic, 4)).toBe(0);
    expect(getCrystalKillBonus(mechanic, 5)).toBe(1);
  });
});
