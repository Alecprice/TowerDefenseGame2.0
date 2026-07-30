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
};
