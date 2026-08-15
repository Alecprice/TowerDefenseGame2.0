const KEY = 'td_game_diagnostics';
const MAX_ENTRIES = 20;

function readEntries() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function recordGameError(error, context = {}) {
  try {
    const entries = readEntries();
    entries.unshift({
      at: new Date().toISOString(),
      message: error?.message || String(error),
      stack: error?.stack || null,
      context,
      href: window.location.href,
      userAgent: navigator.userAgent,
    });
    localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // Diagnostics must never be able to crash the game.
  }
}

export function getGameDiagnostics() {
  return readEntries();
}

export function clearGameDiagnostics() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export function installGlobalGameDiagnostics() {
  const onError = event => recordGameError(event.error || event.message, { source: 'window.error' });
  const onRejection = event => recordGameError(event.reason || 'Unhandled promise rejection', { source: 'unhandledrejection' });
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
  };
}
