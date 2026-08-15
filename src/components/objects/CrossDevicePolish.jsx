import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    DEFAULT_UX_SETTINGS,
    TARGET_STRATEGIES,
    getUXSettings,
    saveUXSettings,
} from '../utils/gameUXSettings';
import { maps } from '../data/maps';
import { TOWER_DEFS_V3 } from './towerDefsV3';
import { CATEGORY } from './towerCategory';
import { getMapMechanic, isBlockedCell } from '../utils/mapMechanicsV31';
import { ACHIEVEMENTS, getUnlockedIds } from '../utils/achievements';
import './CrossDevicePolish.css';

const DRAG_THRESHOLD = 8;
const LONG_PRESS_MS = 520;
const TUTORIAL_KEY = 'td3_polish_tutorial_v1';

function deviceLabel() {
    if (typeof window === 'undefined') return 'Desktop';
    const coarse = window.matchMedia?.('(pointer: coarse)').matches;
    const width = window.visualViewport?.width || window.innerWidth;
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

function towerTypeFromCard(card) {
    const text = card?.innerText || '';
    const match = Object.entries(TOWER_DEFS_V3).find(([, def]) => text.includes(def?.name));
    return match ? Number(match[0]) : null;
}

function currentMapContext() {
    const params = new URLSearchParams(window.location.search);
    const index = Math.max(0, Math.min(maps.length - 1, Number.parseInt(params.get('map'), 10) || 0));
    const map = maps[index];
    return { map, mechanic: map ? getMapMechanic(index, map) : null };
}

function placementAt(event, towerType) {
    const board = document.querySelector('.v31-board-wrap canvas');
    if (!board || !board.isConnected || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return null;
    const rect = board.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return null;
    const inside = event.clientX >= rect.left && event.clientX <= rect.right
        && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) return null;
    const cellW = rect.width / 18;
    const cellH = rect.height / 12;
    const cellX = Math.max(0, Math.min(17, Math.floor((event.clientX - rect.left) / cellW)));
    const cellY = Math.max(0, Math.min(11, Math.floor((event.clientY - rect.top) / cellH)));
    const { map, mechanic } = currentMapContext();
    const valid = Boolean(map && map.grid?.[cellY]?.[cellX] === 0 && !isBlockedCell(mechanic, cellX, cellY));
    const def = TOWER_DEFS_V3[towerType];
    const level = def?.levels?.[0];
    const logicalRange = def?.global ? 0 : def?.category === CATEGORY.SUPPORT ? (level?.auraRange || 0) : (level?.range || 0);
    const rangePx = logicalRange * rect.width / 900;
    return {
        board, valid, cellX, cellY, cellW, cellH, rangePx,
        left: rect.left + cellX * cellW,
        top: rect.top + cellY * cellH,
        centerX: rect.left + (cellX + .5) * cellW,
        centerY: rect.top + (cellY + .5) * cellH,
    };
}

function dispatchBoardDrop(board, sourceEvent) {
    if (!board?.isConnected) return false;
    try {
        const synthetic = new Event('pointerdown', { bubbles: true, cancelable: true });
        Object.defineProperties(synthetic, {
            clientX: { value: sourceEvent.clientX },
            clientY: { value: sourceEvent.clientY },
            pointerId: { value: sourceEvent.pointerId ?? 1 },
            pointerType: { value: sourceEvent.pointerType || 'touch' },
            button: { value: 0 },
        });
        return board.dispatchEvent(synthetic);
    } catch {
        return false;
    }
}

function makeGhost(towerType) {
    const def = TOWER_DEFS_V3[towerType];
    const ghost = document.createElement('div');
    ghost.className = 'td3-drag-ghost td3-safe-ghost';
    ghost.setAttribute('aria-hidden', 'true');
    const name = def?.name || 'Tower';
    const price = def?.levels?.[0]?.price;
    ghost.innerHTML = `<strong>${name}</strong>${price != null ? `<small>$${price}</small>` : ''}`;
    document.body.appendChild(ghost);
    return ghost;
}

function clearDrag(dragRef, setPlacement) {
    const drag = dragRef.current;
    if (drag) clearTimeout(drag.longPress);
    drag?.ghost?.remove();
    dragRef.current = null;
    setPlacement(null);
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
    const [placement, setPlacement] = useState(null);
    const [tutorialStep, setTutorialStep] = useState(0);
    const [achievementToast, setAchievementToast] = useState(null);
    const [bossWarning, setBossWarning] = useState(false);
    const [paused, setPaused] = useState(true);
    const tipTimerRef = useRef(null);
    const dragRef = useRef(null);
    const unlockedRef = useRef(new Set(getUnlockedIds()));
    const bossPresentRef = useRef(false);

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

    const finishTutorial = () => {
        try { localStorage.setItem(TUTORIAL_KEY, 'done'); } catch { /* unavailable */ }
        setTutorialStep(0);
    };

    useEffect(() => {
        applyDocumentSettings(settings, adaptiveLowEffects);
    }, [settings, adaptiveLowEffects]);

    useEffect(() => {
        let timer = 0;
        try {
            if (localStorage.getItem(TUTORIAL_KEY) !== 'done') timer = window.setTimeout(() => setTutorialStep(1), 650);
        } catch { /* unavailable */ }
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const resize = () => setDevice(deviceLabel());
        const onOnline = () => setOnline(true);
        const onOffline = () => setOnline(false);
        const onInstall = event => { event.preventDefault(); setInstallPrompt(event); };
        const resetTransientInput = () => {
            clearDrag(dragRef, setPlacement);
            setDevice(deviceLabel());
        };
        window.addEventListener('resize', resize);
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
        window.addEventListener('beforeinstallprompt', onInstall);
        window.addEventListener('td3:rotation-start', resetTransientInput);
        window.addEventListener('td3:viewport-settled', resetTransientInput);
        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
            window.removeEventListener('beforeinstallprompt', onInstall);
            window.removeEventListener('td3:rotation-start', resetTransientInput);
            window.removeEventListener('td3:viewport-settled', resetTransientInput);
            clearDrag(dragRef, setPlacement);
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
            if (document.hidden) buttonByText('Pause')?.click();
        };
        document.addEventListener('visibilitychange', pauseOnHidden);
        return () => document.removeEventListener('visibilitychange', pauseOnHidden);
    }, []);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setPaused(Boolean(buttonByText('Play')));
            const bossPresent = Boolean(document.querySelector('.v31-boss'));
            if (bossPresent && !bossPresentRef.current) {
                bossPresentRef.current = true;
                setBossWarning(true);
                window.setTimeout(() => setBossWarning(false), 2200);
                if (settings.haptics) navigator.vibrate?.([35, 30, 55]);
            } else if (!bossPresent) bossPresentRef.current = false;

            const nextIds = new Set(getUnlockedIds());
            const newlyUnlocked = [...nextIds].filter(id => !unlockedRef.current.has(id));
            if (newlyUnlocked.length) {
                const achievement = ACHIEVEMENTS.find(item => item.id === newlyUnlocked[0]);
                if (achievement) {
                    setAchievementToast(achievement);
                    window.setTimeout(() => setAchievementToast(null), 3200);
                }
            }
            unlockedRef.current = nextIds;
        }, 700);
        return () => clearInterval(timer);
    }, [settings.haptics]);

    useEffect(() => {
        const onKeyDown = event => {
            if (event.metaKey || event.ctrlKey || event.altKey) return;
            const tag = event.target?.tagName?.toLowerCase();
            if (['input', 'textarea', 'select'].includes(tag)) return;
            if (event.key === ' ') {
                event.preventDefault();
                (buttonByText('Pause') || buttonByText('Play'))?.click();
            } else if (/^[1-9]$/.test(event.key)) {
                [...document.querySelectorAll('.v31-tower-select:not(:disabled)')][Number(event.key) - 1]?.click();
            } else if (event.key.toLowerCase() === 'f') {
                [...document.querySelectorAll('.v31-controls button')].find(button => /x$/.test(button.textContent?.trim() || ''))?.click();
            } else if (event.key.toLowerCase() === 'u') {
                buttonByText('Upgrade')?.click();
            } else if (event.key.toLowerCase() === 's') {
                const sell = buttonByText('Sell');
                if (sell && (!settings.confirmSell || window.confirm('Sell this tower?'))) sell.click();
            } else if (event.key === 'Escape') {
                document.querySelector('.v31-tower-card.selected .v31-tower-select')?.click();
                setSettingsOpen(false);
                clearDrag(dragRef, setPlacement);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [settings.confirmSell]);

    useEffect(() => {
        const onPointerDown = event => {
            if (document.documentElement.classList.contains('td3-rotating')) return;
            const card = event.target?.closest?.('.v31-tower-card');
            if (!card || event.target?.closest?.('.v31-favorite')) return;
            const select = card.querySelector('.v31-tower-select');
            if (!select || select.disabled || card.classList.contains('poor')) return;
            const towerType = towerTypeFromCard(card);
            if (!towerType) return;
            clearDrag(dragRef, setPlacement);
            const longPress = window.setTimeout(() => {
                if (!dragRef.current || dragRef.current.moved) return;
                showTip(select.innerText.replace(/\n+/g, ' · '));
                if (settings.haptics) navigator.vibrate?.(12);
            }, LONG_PRESS_MS);
            dragRef.current = {
                card, select, towerType, pointerId: event.pointerId,
                startX: event.clientX, startY: event.clientY,
                moved: false, selectedForDrag: false, ghost: null, longPress,
            };
        };

        const onPointerMove = event => {
            const drag = dragRef.current;
            if (!drag || event.pointerId !== drag.pointerId || document.documentElement.classList.contains('td3-rotating')) return;
            if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < DRAG_THRESHOLD) return;
            drag.moved = true;
            clearTimeout(drag.longPress);
            if (!drag.selectedForDrag) {
                drag.selectedForDrag = true;
                if (!drag.card.classList.contains('selected')) drag.select.click();
                drag.ghost = makeGhost(drag.towerType);
            }
            const preview = placementAt(event, drag.towerType);
            setPlacement(previous => {
                if (!preview) return null;
                if (previous?.cellX === preview.cellX && previous?.cellY === preview.cellY && previous?.valid === preview.valid) return previous;
                if (settings.haptics && preview.valid && (!previous || previous.cellX !== preview.cellX || previous.cellY !== preview.cellY)) navigator.vibrate?.(5);
                return preview;
            });
            if (drag.ghost?.isConnected) {
                drag.ghost.style.left = `${event.clientX}px`;
                drag.ghost.style.top = `${event.clientY}px`;
                drag.ghost.classList.toggle('over-board', Boolean(preview));
                drag.ghost.classList.toggle('invalid-drop', Boolean(preview && !preview.valid));
            }
            event.preventDefault();
        };

        const finishDrag = event => {
            const drag = dragRef.current;
            if (!drag || event.pointerId !== drag.pointerId) return;
            clearTimeout(drag.longPress);
            if (drag.moved && !document.documentElement.classList.contains('td3-rotating')) {
                const preview = placementAt(event, drag.towerType);
                if (preview?.valid && preview.board) {
                    requestAnimationFrame(() => {
                        if (!document.documentElement.classList.contains('td3-rotating')) {
                            dispatchBoardDrop(preview.board, event);
                            if (settings.haptics) navigator.vibrate?.(18);
                        }
                    });
                } else if (preview && !preview.valid) {
                    showTip('That tile cannot hold a tower.');
                    if (settings.haptics) navigator.vibrate?.([20, 25, 20]);
                }
                event.preventDefault();
                event.stopPropagation();
            }
            clearDrag(dragRef, setPlacement);
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
            clearDrag(dragRef, setPlacement);
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

            {paused && !settingsOpen && <button className="td3-paused-pill" onClick={() => buttonByText('Play')?.click()}>▶ Paused · Resume</button>}
            {tip && <div className="td3-longpress-tip" role="status">{tip}</div>}
            {bossWarning && <div className="td3-event-toast boss" role="alert">⚠ BOSS INCOMING</div>}
            {achievementToast && <div className="td3-event-toast achievement" role="status">🏆 <b>{achievementToast.name}</b><small>{achievementToast.desc}</small></div>}

            {placement && (
                <div className="td3-placement-layer" aria-hidden="true">
                    {settings.showRangePreview && placement.rangePx > 0 && <i className="td3-range-preview" style={{ left: placement.centerX, top: placement.centerY, width: placement.rangePx * 2, height: placement.rangePx * 2 }} />}
                    <i className={`td3-cell-preview ${placement.valid ? 'valid' : 'invalid'}`} style={{ left: placement.left, top: placement.top, width: placement.cellW, height: placement.cellH }} />
                </div>
            )}

            {tutorialStep > 0 && (
                <div className="td3-tutorial-card" role="dialog" aria-label="Quick tutorial">
                    <div className="td3-tutorial-progress">{tutorialStep} / 3</div>
                    {tutorialStep === 1 && <><h3>1. Place a tower</h3><p>Drag a tower from the tray onto a green build tile, or tap a tower and then tap the board.</p></>}
                    {tutorialStep === 2 && <><h3>2. Run the defense</h3><p>Press Play. If you rotate while playing, the defense resumes automatically after the layout settles.</p></>}
                    {tutorialStep === 3 && <><h3>3. Upgrade & target</h3><p>Tap a placed tower to upgrade or sell it. Open Settings to choose First, Last, Strong, Weak, or Closest targeting.</p></>}
                    <div><button onClick={finishTutorial}>Skip</button><button className="primary" onClick={() => tutorialStep >= 3 ? finishTutorial() : setTutorialStep(step => step + 1)}>{tutorialStep >= 3 ? 'Play' : 'Next'}</button></div>
                </div>
            )}

            {settingsOpen && (
                <div className="td3-settings-backdrop" onPointerDown={event => {
                    if (event.target === event.currentTarget) setSettingsOpen(false);
                }}>
                    <section className="td3-settings-panel" role="dialog" aria-modal="true" aria-label="Game settings">
                        <header><h2>Game Settings</h2><button onClick={() => setSettingsOpen(false)}>✕</button></header>
                        <div className="td3-settings-scroll">
                            <h3>Gameplay</h3>
                            <Toggle checked={settings.damageNumbers} onChange={value => persist({ damageNumbers: value })} label="Damage numbers" hint="Hide for a cleaner battlefield or extra performance." />
                            <Toggle checked={settings.showRangePreview} onChange={value => persist({ showRangePreview: value })} label="Placement range preview" hint="Shows tower reach while dragging." />
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
