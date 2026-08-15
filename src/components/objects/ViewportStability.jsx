import React, { useEffect, useRef, useState } from 'react';
import './ViewportStability.css';

const SETTLE_MS = 320;
const SIZE_SETTLE_MS = 120;

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

function controlButton(prefix) {
    return [...document.querySelectorAll('.v31-controls button')]
        .find(button => button.textContent?.trim().toLowerCase().startsWith(prefix));
}

function pauseIfPlaying() {
    const pause = controlButton('pause');
    if (!pause) return false;
    pause.click();
    return true;
}

function resumeIfPaused() {
    controlButton('play')?.click();
}

function clearTransientPointerUI() {
    document.querySelectorAll('.td3-drag-ghost').forEach(node => node.remove());
    document.documentElement.classList.remove('td3-pointer-active');
}

const ViewportStability = () => {
    const settleTimerRef = useRef(0);
    const frameRef = useRef(0);
    const rotationActiveRef = useRef(false);
    const resumeAfterRotationRef = useRef(false);
    const [rotating, setRotating] = useState(false);

    useEffect(() => {
        let last = applyViewportVars();

        const finishLayout = () => {
            cancelAnimationFrame(frameRef.current);
            clearTimeout(settleTimerRef.current);
            frameRef.current = requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    last = applyViewportVars();
                    const wasRotation = rotationActiveRef.current;
                    rotationActiveRef.current = false;
                    document.documentElement.classList.remove('td3-rotating');
                    setRotating(false);
                    window.dispatchEvent(new CustomEvent('td3:viewport-settled', { detail: last }));
                    if (wasRotation && resumeAfterRotationRef.current && !document.hidden) {
                        resumeAfterRotationRef.current = false;
                        requestAnimationFrame(resumeIfPaused);
                    } else if (wasRotation) {
                        resumeAfterRotationRef.current = false;
                    }
                });
            });
        };

        const scheduleSettle = delay => {
            clearTimeout(settleTimerRef.current);
            settleTimerRef.current = window.setTimeout(finishLayout, delay);
        };

        const handleViewportChange = () => {
            const next = liveViewport();
            const orientationChanged = (last.width >= last.height) !== (next.width >= next.height);
            const sizeChanged = Math.abs(next.width - last.width) > 2 || Math.abs(next.height - last.height) > 2;
            if (!orientationChanged && !sizeChanged) return;

            if (orientationChanged && !rotationActiveRef.current) {
                rotationActiveRef.current = true;
                resumeAfterRotationRef.current = pauseIfPlaying();
                document.documentElement.classList.add('td3-rotating');
                setRotating(true);
                clearTransientPointerUI();
                window.dispatchEvent(new CustomEvent('td3:rotation-start'));
            }

            // Safari fires several visualViewport resize/scroll events while its
            // address bars settle. Those size-only changes should update layout,
            // but must never pause a running game.
            scheduleSettle(rotationActiveRef.current ? SETTLE_MS : SIZE_SETTLE_MS);
        };

        const viewport = window.visualViewport;
        window.addEventListener('resize', handleViewportChange, { passive: true });
        window.addEventListener('orientationchange', handleViewportChange, { passive: true });
        viewport?.addEventListener('resize', handleViewportChange, { passive: true });
        viewport?.addEventListener('scroll', handleViewportChange, { passive: true });

        return () => {
            clearTimeout(settleTimerRef.current);
            cancelAnimationFrame(frameRef.current);
            window.removeEventListener('resize', handleViewportChange);
            window.removeEventListener('orientationchange', handleViewportChange);
            viewport?.removeEventListener('resize', handleViewportChange);
            viewport?.removeEventListener('scroll', handleViewportChange);
            document.documentElement.classList.remove('td3-rotating');
        };
    }, []);

    return rotating ? <div className="td3-rotation-shield" role="status" aria-live="polite">Adjusting view…</div> : null;
};

export { liveViewport, applyViewportVars };
export default ViewportStability;
