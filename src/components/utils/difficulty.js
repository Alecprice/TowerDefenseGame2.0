// Difficulty tiers are intentionally multi-dimensional: tougher enemies,
// tighter starting economy and worse sell-back. GamePage/GamePageV3 already
// consume these shared multipliers, so both rulesets stay in sync.
export const DIFFICULTIES = {
    easy: {
        key: 'easy',
        name: 'Casual',
        mult: 0.90,
        startMoneyMult: 1.15,
        refundMult: 1.0,
        eliteMult: 0.5,
        desc: 'Relaxed mode: slightly weaker enemies and extra starting gold.',
    },
    basic: {
        key: 'basic',
        name: 'Normal',
        mult: 1.15,
        startMoneyMult: 1.0,
        refundMult: 0.9,
        eliteMult: 1.0,
        desc: 'The recommended balanced experience.',
    },
    normal: {
        key: 'normal',
        name: 'Hard',
        mult: 1.50,
        startMoneyMult: 0.82,
        refundMult: 0.78,
        eliteMult: 1.35,
        desc: 'Stronger enemies, tighter builds and more dangerous late waves.',
    },
    hard: {
        key: 'hard',
        name: 'Nightmare',
        mult: 1.90,
        startMoneyMult: 0.68,
        refundMult: 0.65,
        eliteMult: 1.75,
        desc: 'Veteran mode: punishing enemies and very little room for mistakes.',
    },
    challenge: {
        key: 'challenge',
        name: 'Endless Challenge',
        mult: 2.35,
        startMoneyMult: 0.55,
        refundMult: 0.55,
        eliteMult: 2.2,
        desc: 'Maximum scaling for leaderboard and survival runs.',
    },
};

export const DIFFICULTY_ORDER = ['easy', 'basic', 'normal', 'hard', 'challenge'];

export function getDifficulty(key) {
    return DIFFICULTIES[key] || DIFFICULTIES.basic;
}
