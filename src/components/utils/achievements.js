// Lifetime achievements. Existing ids/stat keys are preserved so old
// unlocks remain valid while 3.1 adds its own progression targets.
const STATS_KEY = 'td_achievement_stats';
const UNLOCKED_KEY = 'td_achievements_unlocked';

const DEFAULT_STATS = {
    bestWaveAnyMap: 0,
    bossKills: 0,
    splitKills: 0,
    goldSpentUpgrading: 0,
    crystalsSpentUpgrading: 0,
    maxSupportTowersAtOnce: 0,
    challengeBestWave: 0,
    flawlessFiveWaveRuns: 0,
    towersUnlocked: 0,
    mapsUnlocked: 0,
    v31TowersUnlocked: 0,
    threeStarMaps: 0,
    rankedBestWave: 0,
    dailyCompletions: 0,
    bossArchetypesDefeated: 0,
    modesPlayedV31: 0,
};

export const ACHIEVEMENTS = [
    { id: 'first_wave', name: 'First Blood', desc: 'Reach wave 5 in a single run.', check: s => s.bestWaveAnyMap >= 5 },
    { id: 'endless_20', name: 'Endless Grinder', desc: 'Reach wave 20 in a single run.', check: s => s.bestWaveAnyMap >= 20 },
    { id: 'endless_35', name: 'Marathoner', desc: 'Reach wave 35 in a single run.', check: s => s.bestWaveAnyMap >= 35 },
    { id: 'endless_60', name: 'Unbreakable', desc: 'Reach wave 60 in a single run.', check: s => s.bestWaveAnyMap >= 60 },
    { id: 'flawless', name: 'Flawless', desc: 'Complete 5 waves on a map without losing a single life.', check: s => s.flawlessFiveWaveRuns >= 1 },
    { id: 'boss_slayer', name: 'Boss Slayer', desc: 'Defeat 10 bosses.', check: s => s.bossKills >= 10 },
    { id: 'boss_hunter', name: 'Boss Hunter', desc: 'Defeat 50 bosses.', check: s => s.bossKills >= 50 },
    { id: 'boss_bestiary', name: 'Boss Bestiary', desc: 'Defeat all 6 boss archetypes.', check: s => s.bossArchetypesDefeated >= 6 },
    { id: 'splitter_cleanup', name: 'Splitter Cleanup', desc: 'Defeat 20 split-spawned enemies.', check: s => s.splitKills >= 20 },
    { id: 'big_spender', name: 'Big Spender', desc: 'Spend 1000 total upgrade currency in the classic ruleset.', check: s => s.goldSpentUpgrading >= 1000 },
    { id: 'crystal_investor', name: 'Crystal Investor', desc: 'Spend 1000 Crystals upgrading towers in Game 3.1.', check: s => s.crystalsSpentUpgrading >= 1000 },
    { id: 'support_squad', name: 'Support Squad', desc: 'Have 3+ support towers on the board at the same time.', check: s => s.maxSupportTowersAtOnce >= 3 },
    { id: 'challenge_accepted', name: 'Challenge Accepted', desc: 'Reach wave 5 on Endless Challenge difficulty.', check: s => s.challengeBestWave >= 5 },
    { id: 'architect', name: 'Architect', desc: 'Unlock all 15 Version 2 tower types.', check: s => s.towersUnlocked >= 15 },
    { id: 'architect_v31', name: 'Architect 3.1', desc: 'Unlock all 28 Game 3.1 tower types.', check: s => s.v31TowersUnlocked >= 28 },
    { id: 'cartographer', name: 'Cartographer', desc: 'Unlock all 60 maps.', check: s => s.mapsUnlocked >= 60 },
    { id: 'star_commander', name: 'Star Commander', desc: 'Earn 3 stars on 10 different maps.', check: s => s.threeStarMaps >= 10 },
    { id: 'ranked_20', name: 'Ranked Defender', desc: 'Reach wave 20 in a Ranked run.', check: s => s.rankedBestWave >= 20 },
    { id: 'daily_regular', name: 'Daily Regular', desc: 'Complete 5 Daily Challenges.', check: s => s.dailyCompletions >= 5 },
    { id: 'mode_explorer', name: 'Mode Explorer', desc: 'Finish 5 Game 3.1 mode runs.', check: s => s.modesPlayedV31 >= 5 },
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
    try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch { /* storage unavailable */ }
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
    try { localStorage.setItem(UNLOCKED_KEY, JSON.stringify(ids)); } catch { /* storage unavailable */ }
}

export function recordStat(key, value, mode = 'max') {
    const stats = getStats();
    stats[key] = mode === 'add' ? (stats[key] || 0) + value : Math.max(stats[key] || 0, value);
    saveStats(stats);
    return checkForNewUnlocks(stats);
}

function checkForNewUnlocks(stats) {
    const unlocked = new Set(getUnlockedIds());
    const newlyUnlocked = [];
    ACHIEVEMENTS.forEach(achievement => {
        if (!unlocked.has(achievement.id) && achievement.check(stats)) {
            unlocked.add(achievement.id);
            newlyUnlocked.push(achievement);
        }
    });
    if (newlyUnlocked.length) saveUnlockedIds([...unlocked]);
    return newlyUnlocked;
}

export function isUnlocked(id) {
    return getUnlockedIds().includes(id);
}

export function resetAchievements() {
    try {
        localStorage.removeItem(STATS_KEY);
        localStorage.removeItem(UNLOCKED_KEY);
    } catch { /* storage unavailable */ }
}
