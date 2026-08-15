export const BOSS_ARCHETYPES = [
    { key: 'warden', name: 'The Warden', desc: 'Rebuilds a shield during the fight.', color: '#4cc9f0' },
    { key: 'queen', name: 'Swarm Queen', desc: 'Spawns reinforcements at health thresholds.', color: '#a3e635' },
    { key: 'saboteur', name: 'The Saboteur', desc: 'Temporarily disables towers.', color: '#f4a300' },
    { key: 'prime', name: 'Juggernaut Prime', desc: 'Gains armor as its health falls.', color: '#adb5bd' },
    { key: 'chrono', name: 'Chronomancer', desc: 'Accelerates nearby enemies.', color: '#c77dff' },
    { key: 'splitter', name: 'Splitter King', desc: 'Breaks off escorts as it takes damage.', color: '#ff595e' },
];

export function getBossArchetype(wave) {
    const tier = Math.max(1, Math.floor(wave / 5));
    return BOSS_ARCHETYPES[(tier - 1) % BOSS_ARCHETYPES.length];
}

export function applyBossArchetype(boss, wave) {
    const archetype = getBossArchetype(wave);
    boss.bossArchetype = archetype.key;
    boss.bossName = archetype.name;
    boss.bossColor = archetype.color;
    boss.bossAbilityCooldown = 4;
    boss.bossThresholds = [0.75, 0.5, 0.25];

    switch (archetype.key) {
        case 'warden':
            boss.maxHealth = Math.round(boss.maxHealth * 1.05);
            boss.health = boss.maxHealth;
            boss.shieldHP = Math.round(boss.maxHealth * 0.22);
            break;
        case 'queen':
            boss.speed *= 0.92;
            break;
        case 'saboteur':
            boss.speed *= 1.08;
            break;
        case 'prime':
            boss.maxHealth = Math.round(boss.maxHealth * 1.18);
            boss.health = boss.maxHealth;
            boss.armor = (boss.armor || 0) + 8;
            break;
        case 'chrono':
            boss.speed *= 0.9;
            break;
        case 'splitter':
            boss.maxHealth = Math.round(boss.maxHealth * 1.1);
            boss.health = boss.maxHealth;
            break;
        default:
            break;
    }
    boss.baseSpeed = boss.speed;
    return archetype;
}

function spawnThresholdMinions(boss, spawnEnemy, count, type = 1) {
    if (!boss.bossThresholds?.length) return false;
    const pct = boss.maxHealth > 0 ? boss.health / boss.maxHealth : 0;
    if (pct > boss.bossThresholds[0]) return false;
    boss.bossThresholds.shift();
    for (let i = 0; i < count; i++) {
        spawnEnemy(type, {
            x: boss.x + (i - (count - 1) / 2) * 18,
            y: boss.y,
            waypoint: boss.waypoint,
            distance: boss.distance,
            bossEscort: true,
        });
    }
    return true;
}

export function tickBossAbility({ boss, dt, enemies, towers, spawnEnemy, announce }) {
    if (!boss || boss.dead) return;
    boss.bossAbilityCooldown = Math.max(0, (boss.bossAbilityCooldown || 0) - dt);

    if (boss.bossArchetype === 'warden' && boss.bossAbilityCooldown <= 0) {
        const restore = Math.round(boss.maxHealth * 0.16);
        boss.shieldHP = Math.max(boss.shieldHP || 0, restore);
        boss.bossAbilityCooldown = 8;
        announce?.('The Warden restored its shield!');
    }

    if (boss.bossArchetype === 'queen') {
        if (spawnThresholdMinions(boss, spawnEnemy, 3, 2)) announce?.('Swarm Queen released runners!');
    }

    if (boss.bossArchetype === 'saboteur' && boss.bossAbilityCooldown <= 0) {
        const active = towers.filter(tower => !tower.sold);
        const targets = active.sort(() => Math.random() - 0.5).slice(0, Math.min(2, active.length));
        targets.forEach(tower => { tower.disabledRemaining = Math.max(tower.disabledRemaining || 0, 3.5); });
        boss.bossAbilityCooldown = 9;
        if (targets.length) announce?.(`Saboteur disabled ${targets.length} tower${targets.length === 1 ? '' : 's'}!`);
    }

    if (boss.bossArchetype === 'prime') {
        const pct = boss.maxHealth > 0 ? boss.health / boss.maxHealth : 0;
        const phaseArmor = pct <= 0.25 ? 20 : pct <= 0.5 ? 14 : pct <= 0.75 ? 10 : 8;
        boss.armor = Math.max(boss.armor || 0, phaseArmor);
    }

    if (boss.bossArchetype === 'chrono') {
        for (const enemy of enemies) {
            if (enemy === boss || enemy.dead) continue;
            const dx = enemy.mid.x - boss.mid.x;
            const dy = enemy.mid.y - boss.mid.y;
            if (dx * dx + dy * dy <= 180 * 180) enemy.bossHasteRemaining = 0.3;
        }
        if (boss.bossAbilityCooldown <= 0) {
            boss.bossAbilityCooldown = 7;
            announce?.('Chronomancer accelerated nearby enemies!');
        }
    }

    if (boss.bossArchetype === 'splitter') {
        if (spawnThresholdMinions(boss, spawnEnemy, 2, 4)) announce?.('Splitter King shed armored escorts!');
    }
}
