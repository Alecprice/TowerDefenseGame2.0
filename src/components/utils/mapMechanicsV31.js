const MECHANICS = [
    { key: 'highground', name: 'High Ground', desc: 'Marked build tiles grant +20% range and +15% damage.' },
    { key: 'fog', name: 'Rolling Fog', desc: 'Every 4th wave reduces tower range by 18%.' },
    { key: 'rush', name: 'Warpath', desc: 'Every 5th wave enemies surge 22% faster.' },
    { key: 'crystal', name: 'Crystal Veins', desc: 'Every 5 enemy kills awards a bonus Crystal.' },
    { key: 'fortified', name: 'Ruined Ground', desc: 'Several build tiles are blocked by ruins.' },
    { key: 'portal', name: 'Unstable Portals', desc: 'Teleporter enemies appear earlier and more often.' },
];

function buildableCells(map) {
    const cells = [];
    for (let y = 0; y < 12; y++) {
        for (let x = 0; x < 18; x++) {
            if (map?.grid?.[y]?.[x] === 0) cells.push({ x, y });
        }
    }
    return cells;
}

function deterministicPick(cells, count, seed) {
    if (!cells.length) return [];
    const copy = [...cells];
    let state = (seed + 1) * 2654435761;
    const rand = () => {
        state = Math.imul(state ^ (state >>> 15), 2246822519);
        state = Math.imul(state ^ (state >>> 13), 3266489917);
        state ^= state >>> 16;
        return (state >>> 0) / 4294967296;
    };
    const picked = [];
    while (copy.length && picked.length < count) {
        picked.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
    }
    return picked;
}

export function getMapMechanic(mapIndex, map) {
    const base = MECHANICS[Math.abs(mapIndex) % MECHANICS.length];
    const cells = buildableCells(map);
    const specialCells = base.key === 'highground'
        ? deterministicPick(cells, 6, mapIndex * 17 + 3)
        : base.key === 'fortified'
            ? deterministicPick(cells, Math.min(10, Math.max(5, Math.floor(cells.length * 0.05))), mapIndex * 23 + 7)
            : [];
    return { ...base, specialCells };
}

export function cellKey(x, y) {
    return `${x}:${y}`;
}

export function isBlockedCell(mechanic, x, y) {
    if (mechanic?.key !== 'fortified') return false;
    const key = cellKey(x, y);
    return mechanic.specialCells.some(cell => cellKey(cell.x, cell.y) === key);
}

export function applyMapBonusToTower(tower, mechanic, cell) {
    tower.mapDmgMult = 1;
    tower.mapRangeMult = 1;
    if (!mechanic || !cell) return tower;
    if (mechanic.key === 'highground' && mechanic.specialCells.some(c => c.x === cell.x && c.y === cell.y)) {
        tower.mapDmgMult = 1.15;
        tower.mapRangeMult = 1.20;
        tower.mapBonusLabel = 'High Ground';
    }
    return tower;
}

export function isFogWave(mechanic, wave) {
    return mechanic?.key === 'fog' && wave > 0 && wave % 4 === 0;
}

export function getEnemySpeedMultiplier(mechanic, wave) {
    return mechanic?.key === 'rush' && wave > 0 && wave % 5 === 0 ? 1.22 : 1;
}

export function getTeleporterBias(mechanic) {
    return mechanic?.key === 'portal' ? 2.2 : 1;
}

export function getCrystalKillBonus(mechanic, killCount) {
    return mechanic?.key === 'crystal' && killCount > 0 && killCount % 5 === 0 ? 1 : 0;
}

export function drawMapMechanicOverlay(ctx, mechanic, wave) {
    if (!ctx || !mechanic) return;
    ctx.save();
    if (mechanic.key === 'highground') {
        for (const cell of mechanic.specialCells) {
            ctx.fillStyle = 'rgba(255, 214, 10, 0.14)';
            ctx.fillRect(cell.x * 50 + 3, cell.y * 50 + 3, 44, 44);
            ctx.strokeStyle = 'rgba(255, 214, 10, 0.65)';
            ctx.lineWidth = 2;
            ctx.strokeRect(cell.x * 50 + 5, cell.y * 50 + 5, 40, 40);
        }
    }
    if (mechanic.key === 'fortified') {
        for (const cell of mechanic.specialCells) {
            const px = cell.x * 50, py = cell.y * 50;
            ctx.fillStyle = 'rgba(45, 45, 45, 0.72)';
            ctx.fillRect(px + 5, py + 5, 40, 40);
            ctx.strokeStyle = 'rgba(140, 140, 140, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(px + 8, py + 12); ctx.lineTo(px + 42, py + 38);
            ctx.moveTo(px + 38, py + 8); ctx.lineTo(px + 12, py + 42);
            ctx.stroke();
        }
    }
    if (isFogWave(mechanic, wave)) {
        ctx.fillStyle = 'rgba(220, 230, 235, 0.09)';
        ctx.fillRect(0, 0, 900, 600);
    }
    if (mechanic.key === 'rush' && wave > 0 && wave % 5 === 0) {
        ctx.strokeStyle = 'rgba(255, 89, 94, 0.55)';
        ctx.lineWidth = 4;
        ctx.strokeRect(3, 3, 894, 594);
    }
    ctx.restore();
}
