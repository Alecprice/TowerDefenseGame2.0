import React, { useEffect, useRef, useState } from 'react';

// Shared pointer position is intentionally lightweight so the canvas render
// loop can preview the tile/range underneath a tower while it is dragged.
export const towerDragState = {
    active: false,
    type: null,
    clientX: 0,
    clientY: 0,
};

const PointerDraggable = ({ type, disabled = false, onDrop, children, className = '' }) => {
    const ref = useRef(null);
    const pressedRef = useRef(false);
    const movedRef = useRef(false);
    const startRef = useRef({ x: 0, y: 0 });
    const lastRef = useRef({ x: 0, y: 0 });
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [pressed, setPressed] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element || disabled) return undefined;

        const handlePointerDown = event => {
            if (event.button != null && event.button !== 0) return;
            pressedRef.current = true;
            movedRef.current = false;
            startRef.current = { x: event.clientX, y: event.clientY };
            lastRef.current = { x: event.clientX, y: event.clientY };
            towerDragState.active = true;
            towerDragState.type = type;
            towerDragState.clientX = event.clientX;
            towerDragState.clientY = event.clientY;
            setPressed(true);
            element.setPointerCapture?.(event.pointerId);
            event.preventDefault();
        };

        const handlePointerMove = event => {
            if (!pressedRef.current) return;
            const dx = event.clientX - lastRef.current.x;
            const dy = event.clientY - lastRef.current.y;
            lastRef.current = { x: event.clientX, y: event.clientY };
            towerDragState.clientX = event.clientX;
            towerDragState.clientY = event.clientY;
            if (Math.hypot(event.clientX - startRef.current.x, event.clientY - startRef.current.y) > 5) {
                movedRef.current = true;
            }
            setPosition(previous => ({ x: previous.x + dx, y: previous.y + dy }));
            event.preventDefault();
        };

        const finish = event => {
            if (!pressedRef.current) return;
            pressedRef.current = false;
            const wasDrag = movedRef.current;
            towerDragState.clientX = event.clientX;
            towerDragState.clientY = event.clientY;
            towerDragState.active = false;
            towerDragState.type = null;
            setPressed(false);
            setPosition({ x: 0, y: 0 });
            try { element.releasePointerCapture?.(event.pointerId); } catch { /* no-op */ }
            if (wasDrag) {
                onDrop?.(type, event);
                // Prevent the release from also activating the click-to-place fallback.
                event.preventDefault();
                event.stopPropagation();
            }
        };

        element.addEventListener('pointerdown', handlePointerDown, { passive: false });
        document.addEventListener('pointermove', handlePointerMove, { passive: false });
        document.addEventListener('pointerup', finish, { passive: false });
        document.addEventListener('pointercancel', finish, { passive: false });
        return () => {
            element.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', finish);
            document.removeEventListener('pointercancel', finish);
            if (pressedRef.current) {
                towerDragState.active = false;
                towerDragState.type = null;
            }
        };
    }, [disabled, onDrop, type]);

    return (
        <div
            ref={ref}
            className={className}
            style={{
                position: 'relative',
                transform: `translate(${position.x}px, ${position.y}px)`,
                zIndex: pressed ? 1000 : undefined,
                cursor: disabled ? 'not-allowed' : pressed ? 'grabbing' : 'grab',
                touchAction: 'none',
                userSelect: 'none',
            }}
        >
            {children}
        </div>
    );
};

export default PointerDraggable;
