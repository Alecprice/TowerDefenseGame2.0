const KEY = 'td3_ux_settings';

export const DEFAULT_UX_SETTINGS = {
    reducedMotion: false,
    highContrast: false,
    largeUI: false,
    haptics: true,
    damageNumbers: true,
    screenShake: true,
    showRangePreview: true,
    confirmSell: true,
    adaptiveEffects: true,
    effectsQuality: 'high',
    targetStrategy: 'first',
};

export const TARGET_STRATEGIES = [
    { key: 'first', label: 'First', desc: 'Enemy furthest along the path.' },
    { key: 'last', label: 'Last', desc: 'Enemy least far along the path.' },
    { key: 'strong', label: 'Strong', desc: 'Enemy with the most health.' },
    { key: 'weak', label: 'Weak', desc: 'Enemy with the least health.' },
    { key: 'closest', label: 'Closest', desc: 'Enemy nearest the firing tower.' },
];

function normalize(value) {
    const next = { ...DEFAULT_UX_SETTINGS, ...(value || {}) };
    if (!['low', 'medium', 'high'].includes(next.effectsQuality)) next.effectsQuality = 'high';
    if (!TARGET_STRATEGIES.some(item => item.key === next.targetStrategy)) next.targetStrategy = 'first';
    return next;
}

export function getUXSettings() {
    try {
        const raw = localStorage.getItem(KEY);
        return normalize(raw ? JSON.parse(raw) : null);
    } catch {
        return { ...DEFAULT_UX_SETTINGS };
    }
}

export function saveUXSettings(settings) {
    const normalized = normalize(settings);
    try { localStorage.setItem(KEY, JSON.stringify(normalized)); } catch { /* storage unavailable */ }
    try { window.dispatchEvent(new CustomEvent('td3:ux-settings', { detail: normalized })); } catch { /* non-browser/test */ }
    return normalized;
}

export function updateUXSetting(key, value) {
    return saveUXSettings({ ...getUXSettings(), [key]: value });
}

export function getTargetStrategy() {
    return getUXSettings().targetStrategy;
}

export function shouldShowDamageNumbers() {
    return getUXSettings().damageNumbers;
}

export function shouldUseHaptics() {
    return getUXSettings().haptics;
}

export function resetUXSettings() {
    try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
    return { ...DEFAULT_UX_SETTINGS };
}
