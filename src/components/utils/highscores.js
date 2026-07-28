// Simple per-device high score list stored in localStorage.
// There is no backend anymore - scores only persist on the browser/device
// they were set on. Good enough for a family high-score board.

const SCORES_KEY = 'td_highscores';
const NAME_KEY = 'td_playerName';
const MAX_SCORES = 10;

export function getPlayerName() {
    try {
        return localStorage.getItem(NAME_KEY) || '';
    } catch {
        return '';
    }
}

export function setPlayerName(name) {
    try {
        localStorage.setItem(NAME_KEY, name);
    } catch {
        // localStorage unavailable (private browsing, etc.) - just skip persisting.
    }
}

export function getHighScores() {
    try {
        const raw = localStorage.getItem(SCORES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function saveHighScore(name, score, wave, mapName) {
    try {
        const scores = getHighScores();
        scores.push({ name: name || 'Player', score, wave, mapName, date: new Date().toISOString() });
        scores.sort((a, b) => b.score - a.score);
        const trimmed = scores.slice(0, MAX_SCORES);
        localStorage.setItem(SCORES_KEY, JSON.stringify(trimmed));
        return trimmed;
    } catch {
        return getHighScores();
    }
}
