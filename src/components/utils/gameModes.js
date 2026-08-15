const MODE_KEY = 'td3_game_mode';

const mode = (key, name, desc, rules = {}) => ({ key, name, desc, rules });

export const GAME_MODES = {
    classic: mode('classic', 'Classic Defense', 'The standard Tower Defense 3.2 ruleset.'),
    overdrive: mode('overdrive', 'Overdrive', 'Faster aggressive enemies with richer kill rewards.', { enemyHp:.88, enemySpeed:1.35, enemyAttack:1.15, enemyReward:1.2, threatMult:1.08, spawnInterval:.58 }),
    titan: mode('titan', 'Titan Siege', 'Slow armored enemies with huge health pools and shields.', { enemyHp:1.5, enemySpeed:.82, enemyAttack:1.3, enemyReward:1.4, threatMult:.92, spawnInterval:.9, armorBonus:3, shieldPct:.18 }),
    bossrush: mode('bossrush', 'Boss Rush', 'Bosses arrive every 3 waves and elite mini-bosses fill the gaps.', { enemyHp:1.08, enemySpeed:1.04, enemyAttack:1.08, enemyReward:1.15, threatMult:.95, bossInterval:3, minibossStride:4 }),
    chaos: mode('chaos', 'Chaos Protocol', 'Elite traits appear far more often and compositions are volatile.', { enemyHp:1.05, enemySpeed:1.03, enemyAttack:1.05, enemyReward:1.18, traitMult:2.2 }),
    draft: mode('draft', 'Tower Draft', 'Each run gives a limited random tower roster plus economy towers.', { draft:true }),
    onelife: mode('onelife', 'One Life', 'You start with exactly one life. One leak ends the run.', { startLives:1 }),
    noeconomy: mode('noeconomy', 'No Economy', 'Economy towers are disabled; kills drip-feed upgrade Crystals.', { economyDisabled:true, killCrystalEvery:3 }),
    roguelite: mode('roguelite', 'Roguelite', 'Every 5 cleared waves, choose a permanent upgrade for that run.', { roguelite:true }),

    swarm: mode('swarm', 'Swarm Front', 'Huge fast swarms with low individual health and extremely tight spawn spacing.', { enemyHp:.62, enemySpeed:1.18, enemyReward:.72, threatMult:1.55, spawnInterval:.32, maxUnitsMult:1.65 }),
    glasscannon: mode('glasscannon', 'Glass Cannon', 'Your towers hit and cycle much harder, while enemy attacks become devastating.', { towerDmgMult:1.55, towerFireMult:1.18, enemyHp:1.10, enemyAttack:2.25, enemyReward:1.18 }),
    blackout: mode('blackout', 'Blackout', 'Tower range is heavily reduced and elite pressure rises.', { rangeMult:.68, traitMult:1.35, enemyReward:1.20 }),
    bounty: mode('bounty', 'Bounty Hunt', 'Enemies are tougher and waves are denser, but every kill pays a major bounty.', { enemyHp:1.35, enemyReward:1.75, threatMult:1.18, spawnInterval:.64 }),
    speedrun: mode('speedrun', 'Speedrun', 'Rapid spawns, faster enemies and bonus rewards create short high-pressure waves.', { enemySpeed:1.22, enemyReward:1.25, threatMult:1.2, spawnInterval:.25 }),
    marathon: mode('marathon', 'Marathon', 'Oversized endurance waves with bosses appearing only every ten waves.', { enemyHp:1.10, threatMult:1.5, maxUnitsMult:1.5, spawnInterval:.60, bossInterval:10, enemyReward:1.15 }),
    fortress: mode('fortress', 'Fortress Doctrine', 'Towers gain damage and range, but the enemy army is slow, armored and extremely durable.', { towerDmgMult:1.25, rangeMult:1.20, enemyHp:1.5, enemySpeed:.80, enemyReward:1.30, armorBonus:6, threatMult:.92 }),
    plague: mode('plague', 'Regenerator Plague', 'Most later enemies regenerate health, demanding sustained damage and focus fire.', { enemyHp:1.12, enemyReward:1.28, forcedTrait:'regenerating', forcedTraitFromWave:6, threatMult:1.12 }),
    mirror: mode('mirror', 'Mirror War', 'Odd waves become fortified; even waves become hasted, forcing alternating defenses.', { alternatingTraits:true, enemyReward:1.15, threatMult:1.10 }),
    apocalypse: mode('apocalypse', 'Apocalypse', 'Frequent elites, bosses every four waves and brutally strong enemy attacks.', { enemyHp:1.25, enemyAttack:1.5, enemyReward:1.35, traitMult:2.8, threatMult:1.35, bossInterval:4, spawnInterval:.55 }),
    precision: mode('precision', 'Precision Protocol', 'Tower damage, range and fire rate rise sharply, but every enemy is significantly tougher.', { towerDmgMult:1.30, towerFireMult:1.15, rangeMult:1.18, enemyHp:1.45, enemyReward:1.30, threatMult:1.08 }),
    splitterstorm: mode('splitterstorm', 'Splitter Storm', 'Later enemies split on death, turning every kill into a cleanup problem.', { enemyHp:.92, enemyReward:.90, forcedTrait:'splitter', forcedTraitFromWave:5, threatMult:1.28, spawnInterval:.58 }),
};

export const GAME_MODE_ORDER = [
    'classic','overdrive','titan','bossrush','chaos','draft','onelife','noeconomy','roguelite',
    'swarm','glasscannon','blackout','bounty','speedrun','marathon','fortress','plague','mirror','apocalypse','precision','splitterstorm',
];

function readInitialMode() {
    try { const key = localStorage.getItem(MODE_KEY); return GAME_MODES[key] ? key : 'classic'; }
    catch { return 'classic'; }
}

let currentModeKey = readInitialMode();
let enabled = typeof window !== 'undefined' && window.location.pathname.includes('game3');

export function getGameMode(key = currentModeKey) { return GAME_MODES[key] || GAME_MODES.classic; }
export function getGameModeRules(key = currentModeKey) { return getGameMode(key).rules || {}; }
export function getCurrentGameMode() { return getGameMode(currentModeKey); }
export function setGameModeEnabled(value) { enabled = Boolean(value); }
export function setGameMode(key) {
    currentModeKey = GAME_MODES[key] ? key : 'classic';
    try { localStorage.setItem(MODE_KEY, currentModeKey); } catch { /* unavailable */ }
    return getCurrentGameMode();
}

function scaleEnemy(enemy, { hp = 1, speed = 1, attack = 1, reward = 1 }) {
    enemy.maxHealth = Math.max(1, Math.round(enemy.maxHealth * hp));
    enemy.health = enemy.maxHealth;
    enemy.speed *= speed;
    enemy.atk = Math.max(1, Math.round(enemy.atk * attack));
    enemy.value = Math.max(1, Math.round(enemy.value * reward));
    enemy.score = Math.max(1, Math.round(enemy.score * reward));
}

export function applyGameModeToEnemy(enemy) {
    if (!enabled) return;
    const selected = getCurrentGameMode();
    const rules = selected.rules || {};
    enemy.modeKey = selected.key;
    scaleEnemy(enemy, {
        hp: rules.enemyHp || 1,
        speed: rules.enemySpeed || 1,
        attack: rules.enemyAttack || 1,
        reward: rules.enemyReward || 1,
    });
    if (rules.armorBonus) enemy.armor = (enemy.armor || 0) + rules.armorBonus;
    if (rules.shieldPct && enemy.type !== 5) enemy.shieldHP = Math.max(enemy.shieldHP || 0, Math.round(enemy.maxHealth * rules.shieldPct));
    if (selected.key === 'overdrive') enemy.modeTrait = 'Overdrive';
    else if (selected.key === 'titan') enemy.modeTrait = 'Titan';
    else if (selected.key === 'fortress') enemy.modeTrait = 'Fortified Army';
    else if (selected.key === 'apocalypse') enemy.modeTrait = 'Apocalypse';
}
