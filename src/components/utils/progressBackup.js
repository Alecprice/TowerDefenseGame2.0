// Backup/restore for everything the game keeps in localStorage. Useful
// for moving progress between devices/browsers, or just having a backup,
// independent of (and available even without) the Supabase leaderboard -
// none of these keys are anything the server tracks.

const BACKED_UP_KEYS = [
    'td_progression',       // tower/map unlocks - progression.js
    'td_meta',               // Cores, stat upgrades, palettes - metaProgression.js
    'td_achievement_stats',  // lifetime stat counters - achievements.js
    'td_achievements_unlocked', // which achievements are unlocked - achievements.js
    'td_highscores',         // local-fallback leaderboard - highscores.js
    'td_playerName',        // saved player name - highscores.js
    'td_tutorial_shown',     // whether the tutorial has been dismissed - progression.js
];

const BACKUP_VERSION = 1;

export function exportProgress() {
    const data = {};
    BACKED_UP_KEYS.forEach(key => {
        const value = localStorage.getItem(key);
        if (value !== null) data[key] = value;
    });
    const payload = {
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        data,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tower-defense-progress-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Reads a File (from an <input type="file">) and restores every key it
// contains. Resolves with the number of keys restored, or rejects with a
// message safe to show directly to the player.
export function importProgress(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject('No file selected.');
            return;
        }
        const reader = new FileReader();
        reader.onerror = () => reject('Could not read that file.');
        reader.onload = () => {
            try {
                const payload = JSON.parse(reader.result);
                if (!payload || typeof payload.data !== 'object') {
                    reject('That file doesn\'t look like a Tower Defense progress backup.');
                    return;
                }
                let restored = 0;
                BACKED_UP_KEYS.forEach(key => {
                    if (payload.data[key] !== undefined) {
                        localStorage.setItem(key, payload.data[key]);
                        restored++;
                    }
                });
                resolve(restored);
            } catch {
                reject('That file isn\'t valid JSON.');
            }
        };
        reader.readAsText(file);
    });
}
