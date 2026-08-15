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

function map(name, theme, waypoints, enemyProfile) {
    return { name, theme, waypoints, grid: makeGrid(waypoints), enemyProfile };
}

export const expansionMaps = [
    map('Neon Gauntlet', 'volcanic', [
        { x: 0, y: 100 }, { x: 800, y: 100 }, { x: 800, y: 250 },
        { x: 150, y: 250 }, { x: 150, y: 450 }, { x: 850, y: 450 },
    ], { speedMult: 1.22, healthMult: 1.18, armoredChance: 0.30, tankChance: 0.16 }),

    map('Frozen Circuit', 'snow', [
        { x: 50, y: 0 }, { x: 50, y: 500 }, { x: 300, y: 500 },
        { x: 300, y: 100 }, { x: 600, y: 100 }, { x: 600, y: 500 },
        { x: 850, y: 500 },
    ], { speedMult: 0.92, healthMult: 1.42, armoredChance: 0.38, tankChance: 0.22 }),

    map('Sunken Causeway', 'grass', [
        { x: 0, y: 300 }, { x: 200, y: 300 }, { x: 200, y: 50 },
        { x: 500, y: 50 }, { x: 500, y: 500 }, { x: 800, y: 500 },
        { x: 800, y: 250 }, { x: 900, y: 250 },
    ], { speedMult: 1.08, healthMult: 1.25, armoredChance: 0.28, tankChance: 0.20 }),

    map('Ashen Fork', 'volcanic', [
        { x: 0, y: 50 }, { x: 400, y: 50 }, { x: 400, y: 250 },
        { x: 100, y: 250 }, { x: 100, y: 500 }, { x: 750, y: 500 },
        { x: 750, y: 300 }, { x: 900, y: 300 },
    ], { speedMult: 1.16, healthMult: 1.33, armoredChance: 0.44, tankChance: 0.18 }),

    map('Dust Devil', 'desert', [
        { x: 0, y: 500 }, { x: 850, y: 500 }, { x: 850, y: 350 },
        { x: 100, y: 350 }, { x: 100, y: 200 }, { x: 850, y: 200 },
        { x: 850, y: 50 }, { x: 0, y: 50 },
    ], { speedMult: 1.34, healthMult: 1.02, armoredChance: 0.22, tankChance: 0.12 }),

    map('Black Ice', 'snow', [
        { x: 450, y: 0 }, { x: 450, y: 150 }, { x: 100, y: 150 },
        { x: 100, y: 400 }, { x: 700, y: 400 }, { x: 700, y: 200 },
        { x: 850, y: 200 }, { x: 850, y: 600 },
    ], { speedMult: 1.12, healthMult: 1.38, armoredChance: 0.34, tankChance: 0.25 }),

    map('Emerald Coil', 'grass', [
        { x: 0, y: 0 }, { x: 850, y: 0 }, { x: 850, y: 550 },
        { x: 50, y: 550 }, { x: 50, y: 100 }, { x: 750, y: 100 },
        { x: 750, y: 450 }, { x: 150, y: 450 }, { x: 150, y: 200 },
        { x: 650, y: 200 }, { x: 650, y: 350 }, { x: 300, y: 350 },
    ], { speedMult: 0.96, healthMult: 1.48, armoredChance: 0.32, tankChance: 0.26 }),

    map('Cinder Run', 'volcanic', [
        { x: 0, y: 150 }, { x: 250, y: 150 }, { x: 250, y: 450 },
        { x: 500, y: 450 }, { x: 500, y: 50 }, { x: 750, y: 50 },
        { x: 750, y: 350 }, { x: 900, y: 350 },
    ], { speedMult: 1.25, healthMult: 1.30, armoredChance: 0.42, tankChance: 0.21 }),

    map('Mirage Ladder', 'desert', [
        { x: 0, y: 550 }, { x: 150, y: 550 }, { x: 150, y: 400 },
        { x: 350, y: 400 }, { x: 350, y: 250 }, { x: 550, y: 250 },
        { x: 550, y: 100 }, { x: 750, y: 100 }, { x: 750, y: 0 },
    ], { speedMult: 1.30, healthMult: 1.12, armoredChance: 0.29, tankChance: 0.17 }),

    map('Last Bastion', 'snow', [
        { x: 0, y: 300 }, { x: 200, y: 300 }, { x: 200, y: 100 },
        { x: 700, y: 100 }, { x: 700, y: 500 }, { x: 350, y: 500 },
        { x: 350, y: 250 }, { x: 850, y: 250 }, { x: 850, y: 600 },
    ], { speedMult: 1.00, healthMult: 1.60, armoredChance: 0.48, tankChance: 0.30 }),
];
