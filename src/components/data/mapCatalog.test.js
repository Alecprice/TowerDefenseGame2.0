import { describe, expect, it } from 'vitest';
import { ALL_MAPS } from './mapCatalog';
import { mapRouteSignature } from './expansionMapsV32';

describe('Tower Defense 3.2 map catalog', () => {
    it('contains exactly 100 maps', () => {
        expect(ALL_MAPS).toHaveLength(100);
    });

    it('contains 100 unique map names', () => {
        expect(new Set(ALL_MAPS.map(map => map.name)).size).toBe(100);
    });

    it('contains 100 unique route signatures, ignoring travel direction', () => {
        const signatures = ALL_MAPS.map(mapRouteSignature);
        expect(new Set(signatures).size).toBe(100);
    });

    it('gives every map a valid board, route and enemy profile', () => {
        ALL_MAPS.forEach((map, index) => {
            expect(map.name, `map ${index + 1} name`).toBeTruthy();
            expect(map.grid, `${map.name} grid`).toHaveLength(12);
            map.grid.forEach(row => expect(row).toHaveLength(18));
            expect(map.waypoints.length, `${map.name} waypoints`).toBeGreaterThanOrEqual(2);
            expect(map.enemyProfile?.speedMult, `${map.name} speed`).toBeGreaterThan(0);
            expect(map.enemyProfile?.healthMult, `${map.name} health`).toBeGreaterThan(0);
            expect(map.enemyProfile?.armoredChance, `${map.name} armor chance`).toBeGreaterThanOrEqual(0);
            expect(map.enemyProfile?.tankChance, `${map.name} tank chance`).toBeGreaterThanOrEqual(0);
        });
    });
});
