import { maps as baseMaps } from './maps';
import { expansionMaps } from './expansionMaps';
import { expansionMapsV32 } from './expansionMapsV32';

export function getAllMapCatalog() {
    const byName = new Map();
    [...baseMaps, ...expansionMaps, ...expansionMapsV32].forEach(map => {
        if (!byName.has(map.name)) byName.set(map.name, map);
    });
    return [...byName.values()];
}

export const ALL_MAPS = getAllMapCatalog();
export const TOTAL_MAP_COUNT = 100;
