// Backup/restore for persistent player progress. The temporary admin/QA
// localStorage flag is intentionally excluded so a backup can never transfer
// testing access to another browser/device.
const BACKED_UP_KEYS = [
    'td_progression',
    'td3_progression',
    'td31_progression',
    'td31_tower_mastery',
    'td_meta',
    'td_achievement_stats',
    'td_achievements_unlocked',
    'td_highscores',
    'td_playerName',
    'td_tutorial_shown',
    'td3_tutorial_shown',
];

const BACKUP_VERSION = 2;

export function exportProgress() {
    const data = {};
    BACKED_UP_KEYS.forEach(key => {
        const value = localStorage.getItem(key);
        if (value !== null) data[key] = value;
    });
    const payload = { version: BACKUP_VERSION, exportedAt: new Date().toISOString(), data };
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

export function importProgress(file) {
    return new Promise((resolve, reject) => {
        if (!file) { reject('No file selected.'); return; }
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
