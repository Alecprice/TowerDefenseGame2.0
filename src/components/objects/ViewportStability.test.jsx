import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyViewportVars, liveViewport } from './ViewportStability';

describe('viewport stability helpers', () => {
    beforeEach(() => {
        document.documentElement.style.removeProperty('--td3-vw');
        document.documentElement.style.removeProperty('--td3-vh');
        delete document.documentElement.dataset.td3Orientation;
    });

    it('always returns non-zero dimensions', () => {
        const viewport = liveViewport();
        expect(viewport.width).toBeGreaterThan(0);
        expect(viewport.height).toBeGreaterThan(0);
    });

    it('stores settled viewport dimensions as CSS variables', () => {
        const result = applyViewportVars();
        expect(document.documentElement.style.getPropertyValue('--td3-vw')).toBe(`${result.width}px`);
        expect(document.documentElement.style.getPropertyValue('--td3-vh')).toBe(`${result.height}px`);
        expect(['portrait', 'landscape']).toContain(document.documentElement.dataset.td3Orientation);
    });

    it('prefers visualViewport dimensions when Safari exposes them', () => {
        const original = window.visualViewport;
        Object.defineProperty(window, 'visualViewport', {
            configurable: true,
            value: { width: 844.4, height: 390.2 },
        });
        expect(liveViewport()).toEqual({ width: 844, height: 390 });
        Object.defineProperty(window, 'visualViewport', { configurable: true, value: original });
        vi.restoreAllMocks();
    });
});
