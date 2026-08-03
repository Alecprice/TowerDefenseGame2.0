// Tracks stats for a single run - which tower types dealt how much
// damage, and which tower types got placed at all - purely for the
// post-game run summary screen. Reset at the start of every run, read
// once at game-over. Deliberately separate from achievements.js (which
// is lifetime, persisted) and metaProgression.js (Cores/upgrades) - this
// never touches localStorage at all, it only needs to survive one round.

export const runStats = {
    damageByType: {},
    towersUsed: new Set(),
};

export function recordDamage(towerType, amount) {
    if (!amount || towerType == null) return;
    runStats.damageByType[towerType] = (runStats.damageByType[towerType] || 0) + amount;
}

export function recordTowerPlaced(towerType) {
    runStats.towersUsed.add(towerType);
}

export function resetRunStats() {
    runStats.damageByType = {};
    runStats.towersUsed = new Set();
}

// A plain-object snapshot, safe to stash in React state without the next
// run's resetRunStats() mutating what's already being displayed.
export function snapshotRunStats() {
    return {
        damageByType: { ...runStats.damageByType },
        towersUsed: [...runStats.towersUsed],
    };
}
