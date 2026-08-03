// Achievements: a lightweight, generic "track a lifetime stat, unlock
// when it crosses a threshold" system, kept deliberately separate from
// progression.js (tower/map unlocks) and metaProgression.js (Cores) so
// none of the three localStorage-backed systems have to know about the
// others' shape.

const STATS_KEY = 'td_achievement_stats';
const UNLOCKED_KEY = 'td_achievements_unlocked';

const DEFAULT_STATS = {
    bestWaveAnyMap: 0,
    bossKills: 0,
    splitKills: 0,
    goldSpentUpgrading: 0,
    maxSupportTowersAtOnce: 0,
    challengeBestWave: 0,
    flawlessFiveWaveRuns: 0,
    towersUnlocked: 0,
    mapsUnlocked: 0,
};

export const ACHIEVEMENTS = [
    { id: 'first_wave', name: 'First Blood', desc: 'Reach wave 5 in a single run.', check: s => s.bestWaveAnyMap >= 5 },
    { id: 'endless_20', name: 'Endless Grinder', desc: 'Reach wave 20 in a single run.', check: s => s.bestWaveAnyMap >= 20 },
    { id: 'endless_35', name: 'Marathoner', desc: 'Reach wave 35 in a single run.', check: s => s.bestWaveAnyMap >= 35 },
    { id: 'flawless', name: 'Flawless', desc: 'Complete 5 waves on a map without losing a single life.', check: s => s.flawlessFiveWaveRuns >= 1 },
    { id: 'boss_slayer', name: 'Boss Slayer', desc: 'Defeat 10 bosses.', check: s => s.bossKills >= 10 },
    { id: 'boss_hunter', name: 'Boss Hunter', desc: 'Defeat 50 bosses.', check: s => s.bossKills >= 50 },
    { id: 'splitter_cleanup', name: 'Splitter Cleanup', desc: 'Defeat 20 split-spawned enemies.', check: s => s.splitKills >= 20 },
    { id: 'big_spender', name: 'Big Spender', desc: 'Spend 1000 total gold upgrading towers.', check: s => s.goldSpentUpgrading >= 1000 },
    { id: 'support_squad', name: 'Support Squad', desc: 'Have 3+ support towers on the board at the same time.', check: s => s.maxSupportTowersAtOnce >= 3 },
    { id: 'challenge_accepted', name: 'Challenge Accepted', desc: 'Reach wave 5 on Challenge Mode.', check: s => s.challengeBestWave >= 5 },
    { id: 'architect', name: 'Architect', desc: 'Unlock every tower type.', check: s => s.towersUnlocked >= 15 },
    { id: 'cartographer', name: 'Cartographer', desc: 'Unlock every map.', check: s => s.mapsUnlocked >= 50 },
];

export function getStats() {
    try {
        const raw = localStorage.getItem(STATS_KEY);
        return raw ? { ...DEFAULT_STATS, ...JSON.parse(raw) } : { ...DEFAULT_STATS };
    } catch {
        return { ...DEFAULT_STATS };
    }
}

function saveStats(stats) {
    try {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {
        // localStorage unavailable
    }
}

export function getUnlockedIds() {
    try {
        const raw = localStorage.getItem(UNLOCKED_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveUnlockedIds(ids) {
    try {
        localStorage.setItem(UNLOCKED_KEY, JSON.stringify(ids));
    } catch {
        // localStorage unavailable
    }
}

// mode: 'max' (keep the higher of current/new - for bests) or 'add'
// (running total - for counters). Returns any newly-unlocked
// achievements so the caller can show a toast/notification.
export function recordStat(key, value, mode = 'max') {
    const stats = getStats();
    stats[key] = mode === 'add' ? (stats[key] || 0) + value : Math.max(stats[key] || 0, value);
    saveStats(stats);
    return checkForNewUnlocks(stats);
}

function checkForNewUnlocks(stats) {
    const unlocked = new Set(getUnlockedIds());
    const newlyUnlocked = [];
    ACHIEVEMENTS.forEach(a => {
        if (!unlocked.has(a.id) && a.check(stats)) {
            unlocked.add(a.id);
            newlyUnlocked.push(a);
        }
    });
    if (newlyUnlocked.length > 0) {
        saveUnlockedIds([...unlocked]);
    }
    return newlyUnlocked;
}

export function isUnlocked(id) {
    return getUnlockedIds().includes(id);
}

export function resetAchievements() {
    try {
        localStorage.removeItem(STATS_KEY);
        localStorage.removeItem(UNLOCKED_KEY);
    } catch {
        // localStorage unavailable
    }
}
