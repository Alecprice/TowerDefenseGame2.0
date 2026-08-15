const KEY = 'td31_active_run';
const VERSION = 1;

export function saveRunV31(snapshot) {
    if (!snapshot) return false;
    try {
        localStorage.setItem(KEY, JSON.stringify({ version: VERSION, savedAt: new Date().toISOString(), ...snapshot }));
        return true;
    } catch {
        return false;
    }
}

export function loadRunV31() {
    try {
        const parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (!parsed || parsed.version !== VERSION || !Array.isArray(parsed.towers)) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function getSavedRunMetaV31() {
    const run = loadRunV31();
    if (!run) return null;
    return {
        mapIndex: run.mapIndex,
        mapName: run.mapName,
        wave: run.wave,
        difficultyKey: run.difficultyKey,
        modeKey: run.modeKey,
        ranked: Boolean(run.ranked),
        daily: Boolean(run.daily),
        savedAt: run.savedAt,
    };
}

export function clearRunV31() {
    try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}
