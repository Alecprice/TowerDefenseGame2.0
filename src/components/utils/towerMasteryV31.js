const KEY = 'td31_tower_mastery';
const MAX_LEVEL = 10;

function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

function write(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage unavailable */ }
}

export function getTowerMasteryXP(type) {
    return read()[type] || 0;
}

export function masteryLevelForXP(xp) {
    return Math.min(MAX_LEVEL, Math.floor(Math.sqrt(Math.max(0, xp) / 250)));
}

export function getTowerMasteryLevel(type) {
    return masteryLevelForXP(getTowerMasteryXP(type));
}

export function getMasteryProgress(type) {
    const xp = getTowerMasteryXP(type);
    const level = masteryLevelForXP(xp);
    if (level >= MAX_LEVEL) return { level, xp, pct: 100, nextXP: xp };
    const currentXP = level * level * 250;
    const nextXP = (level + 1) * (level + 1) * 250;
    return { level, xp, nextXP, pct: Math.round(((xp - currentXP) / Math.max(1, nextXP - currentXP)) * 100) };
}

export function addTowerMasteryXP(type, amount) {
    if (!type || !amount || amount <= 0) return getMasteryProgress(type);
    const data = read();
    data[type] = Math.max(0, (data[type] || 0) + Math.round(amount));
    write(data);
    return getMasteryProgress(type);
}

export function awardMasteryFromDamage(damageByType = {}) {
    const awards = [];
    Object.entries(damageByType).forEach(([type, damage]) => {
        const xp = Math.max(1, Math.round(Number(damage || 0) / 120));
        const before = getTowerMasteryLevel(Number(type));
        const after = addTowerMasteryXP(Number(type), xp);
        awards.push({ type: Number(type), xp, level: after.level, leveledUp: after.level > before });
    });
    return awards;
}

export function getTotalMasteryLevels() {
    const data = read();
    return Object.values(data).reduce((sum, xp) => sum + masteryLevelForXP(xp), 0);
}
