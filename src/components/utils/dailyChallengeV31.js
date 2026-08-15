const MODES = ['classic', 'overdrive', 'titan', 'bossrush', 'chaos', 'draft', 'roguelite'];
const DIFFICULTIES = ['basic', 'normal', 'hard'];

function hash(text) {
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}

export function getDailyChallenge(date = new Date()) {
    const key = date.toISOString().slice(0, 10);
    const h = hash(key);
    const mapIndex = h % 60;
    const modeKey = MODES[(h >>> 6) % MODES.length];
    const difficultyKey = DIFFICULTIES[(h >>> 12) % DIFFICULTIES.length];
    const objectiveWave = 15 + ((h >>> 18) % 3) * 5;
    return {
        dateKey: key,
        mapIndex,
        modeKey,
        difficultyKey,
        objectiveWave,
        seed: `daily-${key}-${h.toString(16)}`,
        name: `Daily Defense ${key}`,
    };
}
