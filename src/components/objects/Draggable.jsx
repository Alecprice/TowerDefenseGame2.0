import React, { useEffect, useState, useRef } from 'react';
import TowerIcon from './TowerIcon';
import { TOWER_DEFS } from './tower';

// Shared, module-level (not React state - read every animation frame by
// GamePage's canvas draw loop, same pattern as `mouse`/`grid`/`bullets`)
// so the canvas can show a range preview at the hovered tile while a
// tower is being dragged out of the tray, before it's actually placed.
export const dragState = { active: false, type: null };

// Uses the Pointer Events API so the same code path drives mouse, touch, and
// pen input - important for the drag-a-tower-onto-the-board interaction to
// work on phones/tablets, not just desktop.
const Draggable = (props) => {

    const { place, type, state, isUnlocked, cost, money, defsTable = TOWER_DEFS, ...rest } = props;
    const [pressed, setPressed] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const ref = useRef();
    const lastPoint = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const dragRef = ref.current;
        if (!dragRef || !isUnlocked) return;

        const handlePointerMove = (e) => {
            if (pressed) {
                const dx = e.clientX - lastPoint.current.x;
                const dy = e.clientY - lastPoint.current.y;
                lastPoint.current = { x: e.clientX, y: e.clientY };
                setPosition(previous => ({ x: previous.x + dx, y: previous.y + dy }));
                e.preventDefault();
            }
        }
        const handlePointerDown = (e) => {
            if (state === 'playing' && isUnlocked && money >= cost) {
                lastPoint.current = { x: e.clientX, y: e.clientY };
                setPressed(true);
                dragState.active = true;
                dragState.type = type;
                e.preventDefault();
            }
        }
        const handlePointerUp = (e) => {
            if (pressed) {
                setPressed(false);
                dragState.active = false;
                dragState.type = null;
                place(type);
                setPosition({ x: 0, y: 0 });
                // Placing a tower shouldn't also select it - GamePage's
                // window-level 'pointerup' listener (selectTower) would
                // otherwise fire on this same event and open the
                // full-screen upgrade modal immediately after every
                // placement, blocking the tray until it's closed again.
                e.stopPropagation();
            }
        }

        document.addEventListener('pointerup', handlePointerUp);
        document.addEventListener('pointermove', handlePointerMove, { passive: false });
        dragRef.addEventListener('pointerdown', handlePointerDown, { passive: false });
        return () => {
            document.removeEventListener('pointerup', handlePointerUp);
            document.removeEventListener('pointermove', handlePointerMove);
            dragRef.removeEventListener('pointerdown', handlePointerDown);
        }
    }, [pressed, place, type, state, isUnlocked, cost, money]);

    useEffect(() => {
        if (ref.current) {
            ref.current.style.transform = `translate(${position.x}px, ${position.y}px)`
        }
    }, [position]);

    const canAfford = money >= cost;
    const isLocked = !isUnlocked;

    return (
        <div ref={ref} className={`draggable-tower ${isLocked ? 'locked' : ''} ${!canAfford && isUnlocked ? 'insufficient-funds' : ''}`} {...rest}>
            <TowerIcon type={type} size={40} defsTable={defsTable} />
            <div className="tower-name">{defsTable[type]?.name || 'Tower'}</div>
            {isLocked && (
                <div className="tower-lock">
                    <span className="lock-icon">🔒</span>
                </div>
            )}
            <div className="tower-cost">${cost}</div>
        </div>
    )
}

export default Draggable;
