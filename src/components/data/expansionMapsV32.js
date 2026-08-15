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
        for (let s = 0; s <= steps; s++) {
            const t = s / steps;
            mark(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
        }
    }
    return grid;
}

const pts = cells => cells.map(([x, y]) => ({ x: x * 50, y: y * 50 }));
const profile = (speedMult, healthMult, armoredChance, tankChance) => ({ speedMult, healthMult, armoredChance, tankChance });
const map = (name, theme, cells, enemyProfile) => {
    const waypoints = pts(cells);
    return { name, theme, waypoints, grid: makeGrid(waypoints), enemyProfile, expansion: '3.2' };
};

// Maps 61-100. Every route has a distinct ordered waypoint signature. The
// uniqueness test canonicalizes forward/reverse signatures so mirrored route
// reuse cannot accidentally slip into the catalog later.
export const expansionMapsV32 = [
    map('Copper Canyon', 'desert', [[0,1],[16,1],[16,4],[3,4],[3,8],[14,8],[14,11],[18,11]], profile(1.16,1.24,.30,.16)),
    map('Frostbite Loop', 'snow', [[5,0],[5,10],[1,10],[1,2],[14,2],[14,8],[8,8],[8,5],[18,5]], profile(.96,1.48,.38,.22)),
    map('Verdant Switchyard', 'grass', [[0,2],[7,2],[7,9],[2,9],[2,5],[12,5],[12,10],[17,10],[17,0]], profile(1.06,1.31,.27,.18)),
    map('Ember Crown', 'volcanic', [[0,10],[4,10],[4,2],[15,2],[15,6],[8,6],[8,11],[18,11]], profile(1.18,1.40,.43,.23)),
    map('Sandglass Run', 'desert', [[0,0],[9,5],[0,10],[5,10],[9,6],[13,10],[18,10],[9,5],[18,0]], profile(1.28,1.16,.25,.13)),
    map('Glacier Spine', 'snow', [[9,0],[9,3],[2,3],[2,7],[15,7],[15,10],[6,10],[6,5],[18,5]], profile(.90,1.58,.41,.26)),
    map('Mossback Trail', 'grass', [[0,6],[3,6],[3,1],[11,1],[11,4],[6,4],[6,9],[16,9],[16,3],[18,3]], profile(1.02,1.36,.31,.19)),
    map('Magma Stair', 'volcanic', [[0,11],[3,11],[3,8],[6,8],[6,5],[9,5],[9,2],[12,2],[12,0],[18,0]], profile(1.20,1.34,.45,.20)),
    map('Dune Serpent', 'desert', [[0,3],[15,3],[15,5],[2,5],[2,7],[13,7],[13,9],[4,9],[4,11],[18,11]], profile(1.32,1.10,.24,.12)),
    map('Polar Relay', 'snow', [[0,1],[6,1],[6,5],[12,5],[12,1],[17,1],[17,9],[10,9],[10,6],[3,6],[3,11]], profile(1.00,1.47,.36,.24)),
    map('Ivy Crossroads', 'grass', [[0,5],[5,5],[5,0],[9,0],[9,8],[14,8],[14,3],[18,3],[18,10]], profile(1.08,1.28,.29,.17)),
    map('Obsidian Hook', 'volcanic', [[2,0],[2,9],[8,9],[8,4],[15,4],[15,1],[18,1],[18,11]], profile(1.14,1.46,.47,.25)),
    map('Sunscar Bend', 'desert', [[0,9],[7,9],[7,2],[17,2],[17,6],[11,6],[11,11],[3,11],[3,5],[0,5]], profile(1.24,1.22,.33,.16)),
    map('Winter Coil', 'snow', [[0,0],[17,0],[17,11],[1,11],[1,2],[15,2],[15,9],[3,9],[3,4],[13,4],[13,7],[6,7]], profile(.94,1.62,.42,.29)),
    map('Greenway Nine', 'grass', [[0,10],[5,10],[5,7],[1,7],[1,3],[8,3],[8,1],[13,1],[13,6],[17,6],[17,11]], profile(1.04,1.38,.30,.20)),
    map('Furnace Maze', 'volcanic', [[0,2],[4,2],[4,9],[1,9],[1,11],[10,11],[10,5],[7,5],[7,0],[15,0],[15,8],[18,8]], profile(1.13,1.54,.49,.28)),
    map('Dustline Echo', 'desert', [[0,6],[14,6],[14,1],[5,1],[5,4],[10,4],[10,9],[17,9],[17,11],[2,11],[2,8]], profile(1.30,1.14,.26,.14)),
    map('Icebreaker Pass', 'snow', [[0,4],[3,4],[3,10],[8,10],[8,2],[13,2],[13,7],[18,7],[18,0]], profile(1.02,1.50,.39,.24)),
    map('Canopy Zigzag', 'grass', [[0,1],[4,1],[4,4],[8,4],[8,8],[12,8],[12,3],[16,3],[16,10],[18,10]], profile(1.10,1.30,.28,.18)),
    map('Lava Helix', 'volcanic', [[0,0],[18,0],[18,11],[0,11],[0,2],[16,2],[16,9],[2,9],[2,4],[14,4],[14,7],[5,7],[5,5],[10,5]], profile(1.17,1.56,.50,.30)),
    map('Red Mesa Circuit', 'desert', [[0,2],[10,2],[10,0],[16,0],[16,5],[5,5],[5,9],[12,9],[12,11],[18,11]], profile(1.22,1.27,.34,.17)),
    map('Snowbound Ladder', 'snow', [[1,0],[1,2],[7,2],[7,4],[2,4],[2,6],[11,6],[11,8],[5,8],[5,10],[17,10],[17,12]], profile(.98,1.53,.40,.26)),
    map('Orchard Trap', 'grass', [[0,8],[6,8],[6,2],[14,2],[14,10],[2,10],[2,5],[10,5],[10,0],[18,0]], profile(1.07,1.42,.32,.21)),
    map('Blackstone Crescent', 'volcanic', [[0,11],[0,4],[3,1],[9,0],[15,1],[18,4],[18,8],[14,10],[8,11],[4,9],[4,5],[9,3],[14,5],[14,7],[9,8]], profile(1.12,1.60,.52,.31)),
    map('Mirage Crown', 'desert', [[0,5],[3,2],[8,1],[13,2],[17,5],[13,8],[8,9],[3,8],[0,5],[8,5],[18,5]], profile(1.29,1.18,.29,.15)),
    map('Permafrost Run', 'snow', [[0,11],[6,11],[6,6],[1,6],[1,1],[11,1],[11,4],[8,4],[8,9],[16,9],[16,3],[18,3]], profile(.92,1.66,.46,.30)),
    map('Timber Switch', 'grass', [[0,3],[9,3],[9,7],[4,7],[4,11],[15,11],[15,6],[12,6],[12,1],[18,1]], profile(1.05,1.44,.34,.22)),
    map('Cinder Spiral', 'volcanic', [[18,1],[2,1],[2,10],[16,10],[16,3],[4,3],[4,8],[14,8],[14,5],[7,5],[7,6],[11,6]], profile(1.19,1.59,.51,.29)),
    map('Dry Riverbed', 'desert', [[0,0],[3,2],[6,2],[8,5],[11,5],[13,8],[16,8],[18,11]], profile(1.34,1.08,.22,.11)),
    map('Whiteout Gate', 'snow', [[0,7],[5,7],[5,0],[12,0],[12,4],[17,4],[17,10],[9,10],[9,6],[2,6],[2,11]], profile(1.01,1.57,.44,.27)),
    map('Briar Route', 'grass', [[0,11],[2,8],[2,3],[6,3],[6,9],[10,9],[10,1],[14,1],[14,6],[18,6]], profile(1.09,1.40,.33,.20)),
    map('Molten Divide', 'volcanic', [[0,5],[5,5],[5,0],[8,0],[8,10],[11,10],[11,2],[15,2],[15,8],[18,8]], profile(1.16,1.63,.53,.32)),
    map('Sandstone Pulse', 'desert', [[0,6],[4,6],[4,1],[8,1],[8,10],[12,10],[12,4],[16,4],[16,11],[18,11]], profile(1.26,1.25,.35,.18)),
    map('Frozen Switchback', 'snow', [[0,2],[16,2],[16,4],[2,4],[2,6],[14,6],[14,8],[4,8],[4,10],[18,10]], profile(.97,1.64,.45,.29)),
    map('Emerald Relay', 'grass', [[0,4],[7,4],[7,0],[15,0],[15,3],[11,3],[11,9],[4,9],[4,6],[17,6],[17,11]], profile(1.03,1.48,.36,.23)),
    map('Ashfall Corridor', 'volcanic', [[0,1],[18,1],[18,3],[6,3],[6,5],[15,5],[15,7],[3,7],[3,9],[12,9],[12,11],[0,11]], profile(1.21,1.58,.54,.31)),
    map('Desert Crown', 'desert', [[0,10],[4,7],[8,6],[12,7],[16,10],[16,4],[12,1],[8,0],[4,1],[0,4],[8,6],[18,6]], profile(1.31,1.20,.31,.16)),
    map('Icefall Circuit', 'snow', [[9,0],[15,2],[15,6],[18,8],[13,11],[7,11],[3,8],[0,6],[3,2],[9,0],[9,5],[5,5],[5,8],[12,8]], profile(.95,1.70,.48,.33)),
    map('Wildwood Gauntlet', 'grass', [[0,0],[3,0],[3,10],[6,10],[6,2],[9,2],[9,11],[12,11],[12,4],[15,4],[15,9],[18,9]], profile(1.11,1.50,.37,.24)),
    map('Final Crucible', 'volcanic', [[0,11],[18,11],[18,0],[0,0],[0,9],[16,9],[16,2],[2,2],[2,7],[14,7],[14,4],[4,4],[4,5],[11,5]], profile(1.18,1.78,.58,.36)),
];

export function mapRouteSignature(mapValue) {
    const forward = (mapValue?.waypoints || []).map(p => `${p.x},${p.y}`).join('>');
    const reverse = (mapValue?.waypoints || []).slice().reverse().map(p => `${p.x},${p.y}`).join('>');
    return forward < reverse ? forward : reverse;
}
