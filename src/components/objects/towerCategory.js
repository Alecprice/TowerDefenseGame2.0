// Kept in its own file (no imports) specifically so tower.js and
// projectile.js can both depend on it without depending on each other -
// tower.js already imports Projectile, so projectile.js importing CATEGORY
// from tower.js would create a circular import that breaks module init
// order (CATEGORY reads as undefined the first time projectile.js runs).
export const CATEGORY = {
    ATTACK: 'attack',
    POISON: 'poison',
    SLOW: 'slow',
    BANK: 'bank',
    BOSS_HUNTER: 'boss_hunter',
    SUPPORT: 'support',
    // Game 3.0 only: a second resource category, generating Crystals (the
    // currency upgrades cost in that ruleset) instead of Money. Unused by
    // the original game's TOWER_DEFS, so adding it here is a no-op there.
    CRYSTAL: 'crystal',
};
