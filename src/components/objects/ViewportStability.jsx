import React, { useEffect, useRef, useState } from 'react';
import './ViewportStability.css';

const SETTLE_MS = 280;

function liveViewport() {
    if (typeof window === 'undefined') return { width: 0, height: 0 };
    const viewport = window.visualViewport;
    const width = Math.max(1, Math.round(viewport?.width || window.innerWidth || document.documentElement.clientWidth || 1));
    const height = Math.max(1, Math.round(viewport?.height || window.innerHeight || document.documentElement.clientHeight || 1));
    return { width, height };
}

function applyViewportVars() {
    const { width, height } = liveViewport();
    const root = document.documentElement;
    root.style.setProperty('--td3-vw', `${width}px`);
    root.style.setProperty('--td3-vh', `${height}px`);
    root.style.setProperty('--td3-vh-unit', `${height * 0.01}px`);
    root.dataset.td3Orientation = width >= height ? 'landscape' : 'portrait';
    return { width, height };
}

function pauseForRotation() {
    const pause = [...document.querySelectorAll('.v31-controls button')]
        .find(button => button.textContent?.trim().toLowerCase().startsWith('pause'));
    pause?.click();
}

function clearTransientPointerUI() {
    document.querySelectorAll('.td3-drag-ghost').forEach(node => node.remove());
    document.documentElement.classList.remove('td3-pointer-active');
}

const ViewportStability = () => {
    const settleTimerRef = useRef(0);
    const frameRef = useRef(0);
    const [rotating, setRotating] = useState(false);

    useEffect(() => {
        let last = applyViewportVars();

        const settle = () => {
            cancelAnimationFrame(frameRef.current);
            clearTimeout(settleTimerRef.current);
            frameRef.current = requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    last = applyViewportVars();
                    document.documentElement.classList.remove('td3-rotating');
                    setRotating(false);
                    window.dispatchEvent(new CustomEvent('td3:viewport-settled', { detail: last }));
                });
            });
        };

        const startReflow = () => {
            const next = liveViewport();
            const orientationChanged = (last.width >= last.height) !== (next.width >= next.height);
            const sizeChanged = Math.abs(next.width - last.width) > 2 || Math.abs(next.height - last.height) > 2;
            if (!orientationChanged && !sizeChanged) return;

            document.documentElement.classList.add('td3-rotating');
            setRotating(true);
            clearTransientPointerUI();
            pauseForRotation();
            clearTimeout(settleTimerRef.current);
            settleTimerRef.current = window.setTimeout(settle, SETTLE_MS);
        };

        const viewport = window.visualViewport;
        window.addEventListener('resize', startReflow, { passive: true });
        window.addEventListener('orientationchange', startReflow, { passive: true });
        viewport?.addEventListener('resize', startReflow, { passive: true });
        viewport?.addEventListener('scroll', startReflow, { passive: true });

        return () => {
            clearTimeout(settleTimerRef.current);
            cancelAnimationFrame(frameRef.current);
            window.removeEventListener('resize', startReflow);
            window.removeEventListener('orientationchange', startReflow);
            viewport?.removeEventListener('resize', startReflow);
            viewport?.removeEventListener('scroll', startReflow);
            document.documentElement.classList.remove('td3-rotating');
        };
    }, []);

    return rotating ? <div className="td3-rotation-shield" role="status" aria-live="polite">Reflowing game…</div> : null;
};

export { liveViewport, applyViewportVars };
export default ViewportStability;
