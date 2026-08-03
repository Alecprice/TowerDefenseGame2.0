// Difficulty tiers. Easy is the game's existing, unmodified balance -
// every multiplier here is relative to that baseline, not to some other
// notion of "default."
//
// `mult` is applied to enemy HP (folded into the existing per-wave
// waveScale in GamePage.jsx, alongside each map's own healthMult), to
// enemy attack damage (Enemy() in enemy.js), and to each map's
// armored/tank spawn chances (capped at 90% so a wave can never become
// guaranteed-all-armored). Enemy speed and the wave/spawn cadence itself
// are left alone - the extra challenge is "enemies hit harder and take
// more hits," not "the game runs faster at you."
//
// `startMoneyMult` and `refundMult` are the economy side of the same
// idea: harder tiers also start you with less gold and give a worse
// sell-back on towers, so the tiers feel different in how you're forced
// to play (tighter early build order, more painful mistakes to walk
// back), not only in how tough the enemies are.
export const DIFFICULTIES = {
    easy: {
        key: 'easy',
        name: 'Easy',
        mult: 1.0,
        startMoneyMult: 1.0,
        refundMult: 1.0,
        desc: 'The standard game, unmodified.',
    },
    basic: {
        key: 'basic',
        name: 'Basic',
        mult: 1.25,
        startMoneyMult: 0.9,
        refundMult: 0.9,
        desc: '25% harder than Easy.',
    },
    normal: {
        key: 'normal',
        name: 'Normal',
        mult: 1.5,
        startMoneyMult: 0.8,
        refundMult: 0.8,
        desc: '50% harder than Easy.',
    },
    hard: {
        key: 'hard',
        name: 'Hard',
        mult: 1.75,
        startMoneyMult: 0.7,
        refundMult: 0.7,
        desc: '75% harder than Easy.',
    },
    challenge: {
        key: 'challenge',
        name: 'Challenge Mode',
        mult: 2.0,
        startMoneyMult: 0.6,
        refundMult: 0.6,
        desc: '100% harder than Easy.',
    },
};

export const DIFFICULTY_ORDER = ['easy', 'basic', 'normal', 'hard', 'challenge'];

export function getDifficulty(key) {
    return DIFFICULTIES[key] || DIFFICULTIES.easy;
}
