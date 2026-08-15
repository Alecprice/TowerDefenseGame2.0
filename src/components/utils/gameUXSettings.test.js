import { beforeEach, describe, expect, it } from 'vitest';
import {
    DEFAULT_UX_SETTINGS,
    TARGET_STRATEGIES,
    getTargetStrategy,
    getUXSettings,
    resetUXSettings,
    saveUXSettings,
    updateUXSetting,
} from './gameUXSettings';

describe('cross-device UX settings', () => {
    beforeEach(() => {
        localStorage.clear();
        resetUXSettings();
    });

    it('starts with safe defaults for mouse and touch players', () => {
        expect(getUXSettings()).toEqual(DEFAULT_UX_SETTINGS);
        expect(getUXSettings().haptics).toBe(true);
        expect(getUXSettings().adaptiveEffects).toBe(true);
    });

    it('persists accessibility and performance settings', () => {
        updateUXSetting('reducedMotion', true);
        updateUXSetting('effectsQuality', 'low');
        expect(getUXSettings().reducedMotion).toBe(true);
        expect(getUXSettings().effectsQuality).toBe('low');
    });

    it('supports all five targeting strategies and rejects unknown ones', () => {
        expect(TARGET_STRATEGIES.map(item => item.key)).toEqual(['first', 'last', 'strong', 'weak', 'closest']);
        saveUXSettings({ ...DEFAULT_UX_SETTINGS, targetStrategy: 'strong' });
        expect(getTargetStrategy()).toBe('strong');
        saveUXSettings({ ...DEFAULT_UX_SETTINGS, targetStrategy: 'not-real' });
        expect(getTargetStrategy()).toBe('first');
    });

    it('normalizes invalid effect quality', () => {
        saveUXSettings({ ...DEFAULT_UX_SETTINGS, effectsQuality: 'ultra-mega' });
        expect(getUXSettings().effectsQuality).toBe('high');
    });
});
