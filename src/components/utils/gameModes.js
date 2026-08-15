const MODE_KEY = 'td3_game_mode';

export const GAME_MODES = {
    classic: { key: 'classic', name: 'Classic Defense', desc: 'The standard Tower Defense 3.1 ruleset.' },
    overdrive: { key: 'overdrive', name: 'Overdrive', desc: 'Faster, aggressive enemies with richer kill rewards.' },
    titan: { key: 'titan', name: 'Titan Siege', desc: 'Slow armored enemies with much larger health pools and shields.' },
    bossrush: { key: 'bossrush', name: 'Boss Rush', desc: 'Bosses arrive every 3 waves and elite mini-bosses fill the gaps.' },
    chaos: { key: 'chaos', name: 'Chaos Protocol', desc: 'Elite traits appear far more often and wave compositions are volatile.' },
    draft: { key: 'draft', name: 'Tower Draft', desc: 'Each run gives you a limited random tower roster plus the two economy towers.' },
    onelife: { key: 'onelife', name: 'One Life', desc: 'You start with exactly one life. One leak ends the run.' },
    noeconomy: { key: 'noeconomy', name: 'No Economy', desc: 'Gold Mine and Crystal Forge are disabled; kills drip-feed upgrade Crystals.' },
    roguelite: { key: 'roguelite', name: 'Roguelite', desc: 'Every 5 cleared waves, choose one permanent upgrade for the rest of the run.' },
};

export const GAME_MODE_ORDER = ['classic', 'overdrive', 'titan', 'bossrush', 'chaos', 'draft', 'onelife', 'noeconomy', 'roguelite'];

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

export function getGameMode(key = currentModeKey) {
    return GAME_MODES[key] || GAME_MODES.classic;
}

export function getCurrentGameMode() {
    return getGameMode(currentModeKey);
}

export function setGameModeEnabled(value) {
    enabled = Boolean(value);
}

export function setGameMode(key) {
    currentModeKey = GAME_MODES[key] ? key : 'classic';
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

// 3.1 keeps mode-wide stat identity here, while the wave director owns
// exact elite/trait placement. That means the preview is the same plan
// the simulation actually spawns instead of a second layer of randomness.
export function applyGameModeToEnemy(enemy) {
    if (!enabled) return;
    const mode = getCurrentGameMode();
    enemy.modeKey = mode.key;

    if (mode.key === 'overdrive') {
        scaleEnemy(enemy, { hp: 0.88, speed: 1.35, attack: 1.15, reward: 1.2 });
        enemy.modeTrait = 'Overdrive';
        return;
    }
    if (mode.key === 'titan') {
        scaleEnemy(enemy, { hp: 1.5, speed: 0.82, attack: 1.3, reward: 1.4 });
        enemy.armor = (enemy.armor || 0) + 3;
        if (enemy.type !== 5) enemy.shieldHP = Math.max(enemy.shieldHP || 0, Math.round(enemy.maxHealth * 0.18));
        enemy.modeTrait = 'Titan';
        return;
    }
    if (mode.key === 'bossrush') {
        scaleEnemy(enemy, { hp: 1.08, speed: 1.04, attack: 1.08, reward: 1.15 });
        return;
    }
    if (mode.key === 'chaos') {
        scaleEnemy(enemy, { hp: 1.05, speed: 1.03, attack: 1.05, reward: 1.18 });
    }
}
