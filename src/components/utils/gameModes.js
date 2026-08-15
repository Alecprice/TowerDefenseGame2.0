const MODE_KEY = 'td3_game_mode';

export const GAME_MODES = {
    classic: { key: 'classic', name: 'Classic Defense', desc: 'The standard Game 3.0 ruleset.' },
    overdrive: { key: 'overdrive', name: 'Overdrive', desc: 'Faster, more aggressive enemies with richer kill rewards.' },
    titan: { key: 'titan', name: 'Titan Siege', desc: 'Slow armored enemies, frequent shields, and much larger health pools.' },
    bossrush: { key: 'bossrush', name: 'Boss Rush', desc: 'Every fourth regular spawn becomes an elite mini-boss.' },
    chaos: { key: 'chaos', name: 'Chaos Protocol', desc: 'Enemies roll a random dangerous trait when they enter the map.' },
};

export const GAME_MODE_ORDER = ['classic', 'overdrive', 'titan', 'bossrush', 'chaos'];

function readInitialMode() {
    try {
        const key = localStorage.getItem(MODE_KEY);
        return GAME_MODES[key] ? key : 'classic';
    } catch {
        return 'classic';
    }
}

let currentModeKey = readInitialMode();
let enabled = typeof window !== 'undefined' && window.location.pathname.includes('game3');
let enemySequence = 0;

export function getGameMode(key = currentModeKey) {
    return GAME_MODES[key] || GAME_MODES.classic;
}

export function getCurrentGameMode() {
    return getGameMode(currentModeKey);
}

export function setGameModeEnabled(value) {
    enabled = Boolean(value);
    enemySequence = 0;
}

export function setGameMode(key) {
    currentModeKey = GAME_MODES[key] ? key : 'classic';
    enemySequence = 0;
    try { localStorage.setItem(MODE_KEY, currentModeKey); } catch { /* localStorage unavailable */ }
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
    const mode = getCurrentGameMode();
    enemy.modeKey = mode.key;
    enemySequence += 1;

    if (mode.key === 'overdrive') {
        scaleEnemy(enemy, { hp: 0.88, speed: 1.35, attack: 1.15, reward: 1.2 });
        enemy.modeTrait = 'Overdrive';
        return;
    }
    if (mode.key === 'titan') {
        scaleEnemy(enemy, { hp: 1.5, speed: 0.82, attack: 1.3, reward: 1.4 });
        enemy.armor = (enemy.armor || 0) + 3;
        if (enemySequence % 3 === 0 && enemy.type !== 5) {
            enemy.shieldHP = Math.round(enemy.maxHealth * 0.28);
            enemy.modeTrait = 'Titan Shield';
        } else enemy.modeTrait = 'Titan Armor';
        return;
    }
    if (mode.key === 'bossrush') {
        scaleEnemy(enemy, { hp: 1.08, speed: 1.04, attack: 1.08, reward: 1.15 });
        if (enemy.type !== 5 && enemySequence % 4 === 0) {
            scaleEnemy(enemy, { hp: 3.4, speed: 0.72, attack: 2, reward: 2.5 });
            enemy.armor = (enemy.armor || 0) + 4;
            enemy.shieldHP = Math.round(enemy.maxHealth * 0.2);
            enemy.isModeElite = true;
            enemy.modeTrait = 'Mini-Boss';
        }
        return;
    }
    if (mode.key === 'chaos') {
        scaleEnemy(enemy, { hp: 1.05, speed: 1.03, attack: 1.05, reward: 1.18 });
        if (enemy.type === 5) return;
        const roll = Math.floor(Math.random() * 5);
        if (roll === 0) {
            enemy.shieldHP = Math.round(enemy.maxHealth * 0.45);
            enemy.modeTrait = 'Shielded';
        } else if (roll === 1) {
            enemy.regenPerSecond = Math.max(enemy.regenPerSecond || 0, enemy.maxHealth * 0.07);
            enemy.modeTrait = 'Regenerator';
        } else if (roll === 2) {
            enemy.speed *= 1.45;
            enemy.modeTrait = 'Haste';
        } else if (roll === 3) {
            enemy.armor = (enemy.armor || 0) + 8;
            enemy.modeTrait = 'Fortified';
        } else {
            enemy.splashResistance = Math.max(enemy.splashResistance || 0, 0.5);
            enemy.immuneToSlow = true;
            enemy.modeTrait = 'Phased';
        }
        enemy.isModeElite = true;
    }
}
