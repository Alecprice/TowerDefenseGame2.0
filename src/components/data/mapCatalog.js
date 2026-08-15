import { maps as baseMaps } from './maps';
import { expansionMaps } from './expansionMaps';
import { expansionMapsV32 } from './expansionMapsV32';

export const TOTAL_MAP_COUNT = 100;

export function mapRouteSignature(mapValue) {
    const forward = (mapValue?.waypoints || []).map(p => `${p.x},${p.y}`).join('>');
    const reverse = (mapValue?.waypoints || []).slice().reverse().map(p => `${p.x},${p.y}`).join('>');
    return forward < reverse ? forward : reverse;
}

function makeGrid(waypoints) {
    const grid = Array.from({ length: 12 }, () => Array(18).fill(0));
    const mark = (x, y) => {
        const gx = Math.max(0, Math.min(17, Math.round(x / 50)));
        const gy = Math.max(0, Math.min(11, Math.round(y / 50)));
        grid[gy][gx] = 1;
    };
    for (let i = 0; i < waypoints.length - 1; i++) {
        const a = waypoints[i], b = waypoints[i + 1];
        const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 25));
        for (let step = 0; step <= steps; step++) {
            const t = step / steps;
            mark(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
        }
    }
    return grid;
}

function detourPoint(index, attempt, salt) {
    const x = 1 + ((index * (7 + salt) + attempt * (3 + salt) + salt * 11) % 16);
    const y = 1 + ((index * (5 + salt) + attempt * (7 + salt) + salt * 13) % 10);
    return { x: x * 50, y: y * 50 };
}

function createUniqueVariant(mapValue, index, attempt) {
    const source = (mapValue.waypoints || []).map(p => ({ ...p }));
    if (source.length < 2) return { ...mapValue };
    const finish = source[source.length - 1];
    const beforeFinish = source.slice(0, -1);
    const p1 = detourPoint(index, attempt, 1);
    const p2 = detourPoint(index, attempt, 2);
    const waypoints = [...beforeFinish, p1, p2, { ...finish }];
    return {
        ...mapValue,
        waypoints,
        grid: makeGrid(waypoints),
        routeVariant: `legacy-unique-${index + 1}-${attempt}`,
    };
}

export function getAllMapCatalog() {
    const byName = new Map();
    [...baseMaps, ...expansionMaps, ...expansionMapsV32].forEach(map => {
        if (!byName.has(map.name)) byName.set(map.name, map);
    });

    const seenRoutes = new Set();
    return [...byName.values()].slice(0, TOTAL_MAP_COUNT).map((mapValue, index) => {
        let candidate = {
            ...mapValue,
            waypoints: (mapValue.waypoints || []).map(p => ({ ...p })),
            grid: (mapValue.grid || []).map(row => [...row]),
        };
        let signature = mapRouteSignature(candidate);
        if (!seenRoutes.has(signature)) {
            seenRoutes.add(signature);
            return candidate;
        }

        let attempt = 1;
        do {
            candidate = createUniqueVariant(mapValue, index, attempt++);
            signature = mapRouteSignature(candidate);
        } while (seenRoutes.has(signature) && attempt < 250);

        if (seenRoutes.has(signature)) throw new Error(`Could not create a unique route for ${mapValue.name}`);
        seenRoutes.add(signature);
        return candidate;
    });
}

export const ALL_MAPS = getAllMapCatalog();
