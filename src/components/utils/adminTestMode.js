const ADMIN_STATE_KEY = 'td_admin_test_mode';
const FALLBACK_ADMIN_KEY = 'TD3-QA-UNLOCK-2026';

function configuredKey() {
    try {
        return String(import.meta.env.VITE_TD_ADMIN_KEY || FALLBACK_ADMIN_KEY).trim();
    } catch {
        return FALLBACK_ADMIN_KEY;
    }
}

export function isAdminTestMode() {
    try {
        return localStorage.getItem(ADMIN_STATE_KEY) === 'enabled';
    } catch {
        return false;
    }
}

export function enableAdminTestMode(key) {
    const supplied = String(key || '').trim();
    if (!supplied || supplied !== configuredKey()) {
        return { success: false, reason: 'invalid-key' };
    }
    try {
        localStorage.setItem(ADMIN_STATE_KEY, 'enabled');
        return { success: true };
    } catch {
        return { success: false, reason: 'storage' };
    }
}

export function disableAdminTestMode() {
    try {
        localStorage.removeItem(ADMIN_STATE_KEY);
        return true;
    } catch {
        return false;
    }
}

export function getAdminTestLabel() {
    return isAdminTestMode() ? 'QA / Admin unlock active' : '';
}

// Client-side testing gate only. This intentionally does not claim to be a
// security boundary: Vite embeds environment values in the browser bundle.
// Competitive systems therefore treat admin mode as non-competitive instead
// of trusting the key as proof of identity.
export function shouldBlockCompetitiveProgress() {
    return isAdminTestMode();
}
