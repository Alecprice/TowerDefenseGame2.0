import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    DEFAULT_UX_SETTINGS,
    TARGET_STRATEGIES,
    getUXSettings,
    saveUXSettings,
} from '../utils/gameUXSettings';
import './CrossDevicePolish.css';

const DRAG_THRESHOLD = 8;
const LONG_PRESS_MS = 520;

function deviceLabel() {
    if (typeof window === 'undefined') return 'Desktop';
    const coarse = window.matchMedia?.('(pointer: coarse)').matches;
    const width = window.innerWidth;
    if (coarse && width < 760) return 'Phone';
    if (coarse || width < 1180) return 'Tablet';
    return 'Desktop';
}

function buttonByText(text) {
    return [...document.querySelectorAll('.v31-controls button, .v31-selected-actions button')]
        .find(button => button.textContent?.trim().toLowerCase().startsWith(text.toLowerCase()));
}

function applyDocumentSettings(settings, adaptiveLowEffects = false) {
    const root = document.documentElement;
    root.classList.toggle('td3-reduced-motion', Boolean(settings.reducedMotion));
    root.classList.toggle('td3-high-contrast', Boolean(settings.highContrast));
    root.classList.toggle('td3-large-ui', Boolean(settings.largeUI));
    root.classList.toggle('td3-low-effects', adaptiveLowEffects || settings.effectsQuality === 'low');
    root.classList.toggle('td3-medium-effects', !adaptiveLowEffects && settings.effectsQuality === 'medium');
}

const Toggle = ({ checked, onChange, label, hint }) => (
    <label className="td3-setting-row">
        <span><b>{label}</b>{hint && <small>{hint}</small>}</span>
        <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
    </label>
);

const CrossDevicePolish = () => {
    const [settings, setSettings] = useState(() => getUXSettings());
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [online, setOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine);
    const [device, setDevice] = useState(deviceLabel);
    const [fps, setFps] = useState(60);
    const [adaptiveLowEffects, setAdaptiveLowEffects] = useState(false);
    const [installPrompt, setInstallPrompt] = useState(null);
    const [tip, setTip] = useState('');
    const tipTimerRef = useRef(null);
    const dragRef = useRef(null);

    const target = useMemo(
        () => TARGET_STRATEGIES.find(item => item.key === settings.targetStrategy) || TARGET_STRATEGIES[0],
        [settings.targetStrategy],
    );

    const persist = patch => {
        const next = saveUXSettings({ ...settings, ...patch });
        setSettings(next);
    };

    const showTip = text => {
        setTip(text);
        clearTimeout(tipTimerRef.current);
        tipTimerRef.current = setTimeout(() => setTip(''), 1800);
    };

    useEffect(() => {
        applyDocumentSettings(settings, adaptiveLowEffects);
    }, [settings, adaptiveLowEffects]);

    useEffect(() => {
        const resize = () => setDevice(deviceLabel());
        const onOnline = () => setOnline(true);
        const onOffline = () => setOnline(false);
        const onInstall = event => { event.preventDefault(); setInstallPrompt(event); };
        window.addEventListener('resize', resize);
        window.addEventListener('orientationchange', resize);
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
        window.addEventListener('beforeinstallprompt', onInstall);
        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('orientationchange', resize);
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
            window.removeEventListener('beforeinstallprompt', onInstall);
        };
    }, []);

    useEffect(() => {
        let raf = 0;
        let frames = 0;
        let started = performance.now();
        let lowSamples = 0;
        const tick = now => {
            frames += 1;
            const elapsed = now - started;
            if (elapsed >= 1000) {
                const measured = Math.round(frames * 1000 / elapsed);
                setFps(measured);
                if (settings.adaptiveEffects) {
                    lowSamples = measured < 43 ? lowSamples + 1 : Math.max(0, lowSamples - 1);
                    setAdaptiveLowEffects(lowSamples >= 3);
                } else {
                    lowSamples = 0;
                    setAdaptiveLowEffects(false);
                }
                frames = 0;
                started = now;
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [settings.adaptiveEffects]);

    useEffect(() => {
        const pauseOnHidden = () => {
            if (!document.hidden) return;
            const pause = buttonByText('Pause');
            pause?.click();
        };
        document.addEventListener('visibilitychange', pauseOnHidden);
        return () => document.removeEventListener('visibilitychange', pauseOnHidden);
    }, []);

    useEffect(() => {
        const onKeyDown = event => {
            if (event.metaKey || event.ctrlKey || event.altKey) return;
            const tag = event.target?.tagName?.toLowerCase();
            if (['input', 'textarea', 'select'].includes(tag)) return;
            if (event.key === ' ') {
                event.preventDefault();
                (buttonByText('Pause') || buttonByText('Play'))?.click();
            } else if (/^[1-9]$/.test(event.key)) {
                const buttons = [...document.querySelectorAll('.v31-tower-select:not(:disabled)')];
                buttons[Number(event.key) - 1]?.click();
            } else if (event.key.toLowerCase() === 'f') {
                const speedButton = [...document.querySelectorAll('.v31-controls button')].find(button => /x$/.test(button.textContent?.trim() || ''));
                speedButton?.click();
            } else if (event.key.toLowerCase() === 'u') {
                buttonByText('Upgrade')?.click();
            } else if (event.key.toLowerCase() === 's') {
                const sell = buttonByText('Sell');
                if (sell && (!settings.confirmSell || window.confirm('Sell this tower?'))) sell.click();
            } else if (event.key === 'Escape') {
                const selected = document.querySelector('.v31-tower-card.selected .v31-tower-select');
                selected?.click();
                setSettingsOpen(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [settings.confirmSell]);

    useEffect(() => {
        const onPointerDown = event => {
            const card = event.target.closest?.('.v31-tower-card');
            if (!card || event.target.closest('.v31-favorite')) return;
            const select = card.querySelector('.v31-tower-select');
            if (!select || select.disabled || card.classList.contains('poor')) return;
            const icon = card.querySelector('canvas');
            const rect = card.getBoundingClientRect();
            const longPress = window.setTimeout(() => {
                if (!dragRef.current || dragRef.current.moved) return;
                showTip(select.innerText.replace(/\n+/g, ' · '));
                navigator.vibrate?.(settings.haptics ? 12 : 0);
            }, LONG_PRESS_MS);
            dragRef.current = {
                card, select, icon, pointerId: event.pointerId,
                startX: event.clientX, startY: event.clientY,
                moved: false, selectedForDrag: false, ghost: null, longPress,
                offsetX: event.clientX - rect.left,
                offsetY: event.clientY - rect.top,
            };
        };

        const onPointerMove = event => {
            const drag = dragRef.current;
            if (!drag || event.pointerId !== drag.pointerId) return;
            const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
            if (!drag.moved && distance < DRAG_THRESHOLD) return;
            drag.moved = true;
            clearTimeout(drag.longPress);
            if (!drag.selectedForDrag) {
                drag.selectedForDrag = true;
                if (!drag.card.classList.contains('selected')) drag.select.click();
                const ghost = drag.card.cloneNode(true);
                ghost.classList.add('td3-drag-ghost');
                ghost.querySelector('.v31-favorite')?.remove();
                document.body.appendChild(ghost);
                drag.ghost = ghost;
            }
            const board = document.querySelector('.v31-board-wrap canvas');
            const boardRect = board?.getBoundingClientRect();
            const overBoard = Boolean(boardRect
                && event.clientX >= boardRect.left && event.clientX <= boardRect.right
                && event.clientY >= boardRect.top && event.clientY <= boardRect.bottom);
            if (drag.ghost) {
                drag.ghost.style.left = `${event.clientX}px`;
                drag.ghost.style.top = `${event.clientY}px`;
                drag.ghost.classList.toggle('over-board', overBoard);
            }
            if (overBoard && board) {
                board.dispatchEvent(new PointerEvent('pointermove', {
                    bubbles: true, cancelable: true,
                    clientX: event.clientX, clientY: event.clientY,
                    pointerId: event.pointerId, pointerType: event.pointerType || 'mouse',
                }));
            }
            event.preventDefault();
        };

        const finishDrag = event => {
            const drag = dragRef.current;
            if (!drag || event.pointerId !== drag.pointerId) return;
            clearTimeout(drag.longPress);
            if (drag.moved) {
                const board = document.querySelector('.v31-board-wrap canvas');
                const rect = board?.getBoundingClientRect();
                const overBoard = Boolean(rect
                    && event.clientX >= rect.left && event.clientX <= rect.right
                    && event.clientY >= rect.top && event.clientY <= rect.bottom);
                if (overBoard && board) {
                    requestAnimationFrame(() => {
                        board.dispatchEvent(new PointerEvent('pointerdown', {
                            bubbles: true, cancelable: true,
                            clientX: event.clientX, clientY: event.clientY,
                            pointerId: event.pointerId, pointerType: event.pointerType || 'mouse', button: 0,
                        }));
                        if (settings.haptics) navigator.vibrate?.(18);
                    });
                }
                event.preventDefault();
                event.stopPropagation();
            }
            drag.ghost?.remove();
            dragRef.current = null;
        };

        document.addEventListener('pointerdown', onPointerDown, true);
        document.addEventListener('pointermove', onPointerMove, { capture: true, passive: false });
        document.addEventListener('pointerup', finishDrag, true);
        document.addEventListener('pointercancel', finishDrag, true);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown, true);
            document.removeEventListener('pointermove', onPointerMove, true);
            document.removeEventListener('pointerup', finishDrag, true);
            document.removeEventListener('pointercancel', finishDrag, true);
            if (dragRef.current) {
                clearTimeout(dragRef.current.longPress);
                dragRef.current.ghost?.remove();
                dragRef.current = null;
            }
        };
    }, [settings.haptics]);

    useEffect(() => () => clearTimeout(tipTimerRef.current), []);

    const install = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        try { await installPrompt.userChoice; } catch { /* ignored */ }
        setInstallPrompt(null);
    };

    return (
        <>
            <div className="td3-device-bar" role="status">
                <span>{device}</span>
                <span className={online ? 'online' : 'offline'}>{online ? '● Online / offline-ready' : '● Offline'}</span>
                <span className={fps < 43 ? 'fps-low' : ''}>{fps} FPS{adaptiveLowEffects ? ' · adaptive effects' : ''}</span>
                <span>Target: {target.label}</span>
                {installPrompt && <button onClick={install}>Install</button>}
                <button onClick={() => setSettingsOpen(true)} aria-label="Open game settings">⚙ Settings</button>
            </div>

            <div className="td3-touch-help" aria-live="polite">
                Drag a tower onto the board or tap a tower, then tap a build tile. Long-press a tower for details.
            </div>

            {tip && <div className="td3-longpress-tip" role="status">{tip}</div>}

            {settingsOpen && (
                <div className="td3-settings-backdrop" onPointerDown={event => {
                    if (event.target === event.currentTarget) setSettingsOpen(false);
                }}>
                    <section className="td3-settings-panel" role="dialog" aria-modal="true" aria-label="Game settings">
                        <header><h2>Game Settings</h2><button onClick={() => setSettingsOpen(false)}>✕</button></header>
                        <div className="td3-settings-scroll">
                            <h3>Gameplay</h3>
                            <Toggle checked={settings.damageNumbers} onChange={value => persist({ damageNumbers: value })} label="Damage numbers" hint="Hide for a cleaner battlefield or extra performance." />
                            <Toggle checked={settings.haptics} onChange={value => persist({ haptics: value })} label="Haptics" hint="Short vibration feedback on supported phones/tablets." />
                            <Toggle checked={settings.confirmSell} onChange={value => persist({ confirmSell: value })} label="Confirm keyboard selling" hint="Protects against accidental S-key sells." />
                            <Toggle checked={settings.screenShake} onChange={value => persist({ screenShake: value })} label="Screen shake" hint="Used by high-impact effects when enabled." />

                            <h3>Targeting</h3>
                            <div className="td3-target-grid">
                                {TARGET_STRATEGIES.map(item => (
                                    <button key={item.key} className={settings.targetStrategy === item.key ? 'active' : ''}
                                        onClick={() => persist({ targetStrategy: item.key })}>
                                        <b>{item.label}</b><small>{item.desc}</small>
                                    </button>
                                ))}
                            </div>

                            <h3>Graphics & performance</h3>
                            <label className="td3-select-row"><span><b>Effects quality</b><small>Lower this on older devices.</small></span>
                                <select value={settings.effectsQuality} onChange={event => persist({ effectsQuality: event.target.value })}>
                                    <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                                </select>
                            </label>
                            <Toggle checked={settings.adaptiveEffects} onChange={value => persist({ adaptiveEffects: value })} label="Adaptive effects" hint="Automatically reduces visual load after sustained low FPS." />

                            <h3>Accessibility</h3>
                            <Toggle checked={settings.reducedMotion} onChange={value => persist({ reducedMotion: value })} label="Reduced motion" />
                            <Toggle checked={settings.highContrast} onChange={value => persist({ highContrast: value })} label="High contrast" />
                            <Toggle checked={settings.largeUI} onChange={value => persist({ largeUI: value })} label="Larger controls" />
                        </div>
                        <footer>
                            <button onClick={() => { const reset = saveUXSettings(DEFAULT_UX_SETTINGS); setSettings(reset); }}>Reset defaults</button>
                            <button className="primary" onClick={() => setSettingsOpen(false)}>Done</button>
                        </footer>
                    </section>
                </div>
            )}
        </>
    );
};

export default CrossDevicePolish;
