import { ALL_MAPS } from '../data/mapCatalog';
import { getProgressionV31, DIFFICULTY_RANK_V31 } from './progressionV31';
import { isAdminTestMode } from './adminTestMode';

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

const BASE_GLOBAL_ACHIEVEMENTS = [
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
    { id: 'crystal_investor', name: 'Crystal Investor', desc: 'Spend 1000 Crystals upgrading towers.', check: s => s.crystalsSpentUpgrading >= 1000 },
    { id: 'support_squad', name: 'Support Squad', desc: 'Have 3+ support towers on the board at the same time.', check: s => s.maxSupportTowersAtOnce >= 3 },
    { id: 'challenge_accepted', name: 'Challenge Accepted', desc: 'Reach wave 5 on Endless Challenge difficulty.', check: s => s.challengeBestWave >= 5 },
    { id: 'architect', name: 'Architect', desc: 'Unlock all 15 Version 2 tower types.', check: s => s.towersUnlocked >= 15 },
    { id: 'architect_v31', name: 'Architect 3.2', desc: 'Unlock all 28 Game 3.x tower types.', check: s => s.v31TowersUnlocked >= 28 },
    { id: 'cartographer', name: 'Cartographer', desc: 'Unlock all 100 maps.', check: s => s.mapsUnlocked >= 100 },
    { id: 'star_commander', name: 'Star Commander', desc: 'Earn 3 stars on 10 different maps.', check: s => s.threeStarMaps >= 10 },
    { id: 'ranked_20', name: 'Ranked Defender', desc: 'Reach wave 20 in a Ranked run.', check: s => s.rankedBestWave >= 20 },
    { id: 'daily_regular', name: 'Daily Regular', desc: 'Complete 5 Daily Challenges.', check: s => s.dailyCompletions >= 5 },
    { id: 'mode_explorer', name: 'Mode Explorer', desc: 'Finish 5 Game 3.x mode runs.', check: s => s.modesPlayedV31 >= 5 },
].map(a => ({ ...a, category: 'global' }));

const EXTRA_GLOBAL_ACHIEVEMENTS = [
    ...[
        [25, 'Quarter Century', 'wave_25'], [50, 'Fifty Waves Strong', 'wave_50'], [75, 'Endurance Expert', 'wave_75'],
        [100, 'Century Defense', 'wave_100'], [150, 'Endless Legend', 'wave_150'],
    ].map(([threshold, name, id]) => ({ id, name, desc: `Reach wave ${threshold} in a single run.`, category: 'global', check: s => s.bestWaveAnyMap >= threshold })),
    ...[
        [1, 'First Boss Down', 'boss_1'], [5, 'Boss Breaker', 'boss_5'], [25, 'Boss Executioner', 'boss_25'],
        [100, 'Boss Exterminator', 'boss_100'], [250, 'Boss Apocalypse', 'boss_250'],
    ].map(([threshold, name, id]) => ({ id, name, desc: `Defeat ${threshold} bosses across all runs.`, category: 'global', check: s => s.bossKills >= threshold })),
    ...[
        [1, 'First Perfect Map', 'three_star_1'], [25, 'Quarter Atlas', 'three_star_25'], [50, 'Half Atlas', 'three_star_50'],
        [75, 'Master Cartographer', 'three_star_75'], [100, 'Perfect Atlas', 'three_star_100'],
    ].map(([threshold, name, id]) => ({ id, name, desc: `Earn 3 stars on ${threshold} map${threshold === 1 ? '' : 's'}.`, category: 'global', check: s => s.threeStarMaps >= threshold })),
    ...[
        [5, 'Ranked Initiate', 'ranked_5'], [10, 'Ranked Regular', 'ranked_10'], [30, 'Ranked Veteran', 'ranked_30'],
        [50, 'Ranked Elite', 'ranked_50'], [75, 'Ranked Legend', 'ranked_75'],
    ].map(([threshold, name, id]) => ({ id, name, desc: `Reach wave ${threshold} in a Ranked run.`, category: 'global', check: s => s.rankedBestWave >= threshold })),
    ...[
        [1, 'Daily Debut', 'daily_1'], [10, 'Daily Ten', 'daily_10'], [25, 'Daily Dedicated', 'daily_25'],
        [50, 'Daily Specialist', 'daily_50'], [100, 'Daily Century', 'daily_100'],
    ].map(([threshold, name, id]) => ({ id, name, desc: `Complete ${threshold} Daily Challenge${threshold === 1 ? '' : 's'}.`, category: 'global', check: s => s.dailyCompletions >= threshold })),
    { id: 'modes_3', name: 'Rules Sampler', desc: 'Complete runs in 3 unique game modes.', category: 'global', check: (s, c) => c.uniqueModes >= 3 },
    { id: 'modes_10', name: 'Rules Explorer', desc: 'Complete runs in 10 unique game modes.', category: 'global', check: (s, c) => c.uniqueModes >= 10 },
    { id: 'modes_15', name: 'Rules Scholar', desc: 'Complete runs in 15 unique game modes.', category: 'global', check: (s, c) => c.uniqueModes >= 15 },
    { id: 'modes_21', name: 'Rules Omniscient', desc: 'Complete runs in all 21 game modes.', category: 'global', check: (s, c) => c.uniqueModes >= 21 },
    { id: 'stars_300', name: 'Three Hundred Stars', desc: 'Earn all 300 map stars.', category: 'global', check: (s, c) => c.totalStars >= 300 },
];

function mapAchievementsFor(map, mapIndex) {
    const prefix = `map_${String(mapIndex + 1).padStart(3, '0')}`;
    const mapName = map.name;
    return [
        {
            id: `${prefix}_scout`, name: `${mapName}: Scout`, category: 'map', mapIndex, tier: 1,
            desc: `Reach wave 5 on ${mapName}.`,
            check: (s, c) => (c.records[mapIndex]?.bestWave || 0) >= 5,
        },
        {
            id: `${prefix}_veteran`, name: `${mapName}: Veteran`, category: 'map', mapIndex, tier: 2,
            desc: `Reach wave 10 on ${mapName} on Hard difficulty or higher.`,
            check: (s, c) => Math.max(
                c.records[mapIndex]?.difficultyBest?.normal || 0,
                c.records[mapIndex]?.difficultyBest?.hard || 0,
                c.records[mapIndex]?.difficultyBest?.challenge || 0,
            ) >= 10,
        },
        {
            id: `${prefix}_flawless`, name: `${mapName}: Flawless`, category: 'map', mapIndex, tier: 3,
            desc: `Reach wave 15 on ${mapName} without losing a life.`,
            check: (s, c) => (c.records[mapIndex]?.flawlessBest || 0) >= 15,
        },
        {
            id: `${prefix}_versatile`, name: `${mapName}: Versatile`, category: 'map', mapIndex, tier: 4,
            desc: `Reach wave 10 on ${mapName} in 3 different game modes.`,
            check: (s, c) => Object.values(c.records[mapIndex]?.modeBest || {}).filter(wave => wave >= 10).length >= 3,
        },
        {
            id: `${prefix}_ranked`, name: `${mapName}: Ranked Master`, category: 'map', mapIndex, tier: 5,
            desc: `Reach wave 20 on ${mapName} in Ranked play.`,
            check: (s, c) => (c.records[mapIndex]?.rankedBest || 0) >= 20,
        },
    ];
}

const MAP_ACHIEVEMENTS = ALL_MAPS.slice(0, 100).flatMap(mapAchievementsFor);
export const ACHIEVEMENTS = [...BASE_GLOBAL_ACHIEVEMENTS, ...EXTRA_GLOBAL_ACHIEVEMENTS, ...MAP_ACHIEVEMENTS];

function achievementContext() {
    const progression = getProgressionV31();
    return {
        progression,
        records: progression.mapRecords || [],
        uniqueModes: (progression.lifetime?.modesPlayed || []).length,
        totalStars: (progression.mapStars || []).reduce((sum, value) => sum + (value || 0), 0),
    };
}

export function getStats() {
    try {
        const raw = localStorage.getItem(STATS_KEY);
        return raw ? { ...DEFAULT_STATS, ...JSON.parse(raw) } : { ...DEFAULT_STATS };
    } catch { return { ...DEFAULT_STATS }; }
}
function saveStats(stats) { try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch { /* unavailable */ } }
export function getUnlockedIds() {
    try { const raw = localStorage.getItem(UNLOCKED_KEY); return raw ? JSON.parse(raw) : []; }
    catch { return []; }
}
function saveUnlockedIds(ids) { try { localStorage.setItem(UNLOCKED_KEY, JSON.stringify(ids)); } catch { /* unavailable */ } }

export function recordStat(key, value, mode = 'max') {
    if (isAdminTestMode()) return [];
    const stats = getStats();
    stats[key] = mode === 'add' ? (stats[key] || 0) + value : Math.max(stats[key] || 0, value);
    saveStats(stats);
    return checkForNewUnlocks(stats);
}

export function refreshAchievementUnlocks() {
    if (isAdminTestMode()) return [];
    return checkForNewUnlocks(getStats());
}

function checkForNewUnlocks(stats) {
    const unlocked = new Set(getUnlockedIds());
    const newlyUnlocked = [];
    const context = achievementContext();
    ACHIEVEMENTS.forEach(achievement => {
        if (!unlocked.has(achievement.id) && achievement.check(stats, context)) {
            unlocked.add(achievement.id);
            newlyUnlocked.push(achievement);
        }
    });
    if (newlyUnlocked.length) saveUnlockedIds([...unlocked]);
    return newlyUnlocked;
}

export function isUnlocked(id) { return getUnlockedIds().includes(id); }
export function resetAchievements() {
    try { localStorage.removeItem(STATS_KEY); localStorage.removeItem(UNLOCKED_KEY); } catch { /* unavailable */ }
}

export { DEFAULT_STATS, DIFFICULTY_RANK_V31 };
