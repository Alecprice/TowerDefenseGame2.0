import React, { useEffect, useRef } from 'react';
import { TOWER_DEFS, drawShape } from './tower';

const DRAG_THRESHOLD = 6;

const TowerIcon = ({ type, size = 44, defsTable = TOWER_DEFS }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, size, size);
        const def = defsTable[type];
        if (!def) return;
        drawShape(ctx, def.shape, size / 2, size / 2, size / 2 - 5, def.color);
    }, [type, size, defsTable]);

    // Game 3.1/3.2 changed the tower tray to click-to-select placement and
    // accidentally removed the original pointer drag interaction. Keep the
    // new board logic as the single source of truth: this adapter selects the
    // tower once a real drag starts, forwards pointer movement to the board so
    // its range preview continues to work, then forwards the release as the
    // board's normal pointerdown placement event.
    useEffect(() => {
        const icon = canvasRef.current;
        if (!icon) return undefined;

        const selectButton = icon.closest('.v31-tower-select');
        if (!selectButton) return undefined;
        const card = selectButton.closest('.v31-tower-card');

        let pointerId = null;
        let startX = 0;
        let startY = 0;
        let dragging = false;
        let ghost = null;

        const boardCanvas = () => document.querySelector('.v31-board-wrap canvas');

        const canStart = () => {
            if (selectButton.disabled) return false;
            if (card?.classList.contains('poor')) return false;
            return true;
        };

        const moveGhost = event => {
            if (!ghost) return;
            ghost.style.left = `${event.clientX}px`;
            ghost.style.top = `${event.clientY}px`;
        };

        const createGhost = event => {
            ghost = icon.cloneNode(true);
            ghost.setAttribute('aria-hidden', 'true');
            Object.assign(ghost.style, {
                position: 'fixed',
                left: `${event.clientX}px`,
                top: `${event.clientY}px`,
                width: `${size}px`,
                height: `${size}px`,
                transform: 'translate(-50%, -50%) scale(1.08)',
                pointerEvents: 'none',
                zIndex: '100000',
                opacity: '0.9',
                filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.45))',
            });
            document.body.appendChild(ghost);
        };

        const forwardBoardMove = event => {
            const board = boardCanvas();
            if (!board) return;
            const rect = board.getBoundingClientRect();
            const inside = event.clientX >= rect.left && event.clientX <= rect.right
                && event.clientY >= rect.top && event.clientY <= rect.bottom;
            if (!inside) return;
            board.dispatchEvent(new PointerEvent('pointermove', {
                bubbles: true,
                cancelable: true,
                clientX: event.clientX,
                clientY: event.clientY,
                pointerId: event.pointerId,
                pointerType: event.pointerType || 'mouse',
            }));
        };

        const cleanup = () => {
            ghost?.remove();
            ghost = null;
            pointerId = null;
            dragging = false;
        };

        const handlePointerDown = event => {
            if (!canStart()) return;
            if (event.button != null && event.button !== 0) return;
            pointerId = event.pointerId;
            startX = event.clientX;
            startY = event.clientY;
            icon.setPointerCapture?.(event.pointerId);
        };

        const handlePointerMove = event => {
            if (pointerId == null || event.pointerId !== pointerId) return;
            if (!dragging) {
                const distance = Math.hypot(event.clientX - startX, event.clientY - startY);
                if (distance < DRAG_THRESHOLD) return;
                dragging = true;
                // Select the tower through the existing React handler. This
                // preserves Draft/lock behavior and keeps click/tap placement.
                selectButton.click();
                createGhost(event);
            }
            moveGhost(event);
            forwardBoardMove(event);
            event.preventDefault();
        };

        const handlePointerUp = event => {
            if (pointerId == null || event.pointerId !== pointerId) return;
            const wasDragging = dragging;
            if (wasDragging) {
                const board = boardCanvas();
                if (board) {
                    const rect = board.getBoundingClientRect();
                    const inside = event.clientX >= rect.left && event.clientX <= rect.right
                        && event.clientY >= rect.top && event.clientY <= rect.bottom;
                    if (inside) {
                        // Let the React selection update flush, then invoke the
                        // exact same placement path used by click-to-place.
                        requestAnimationFrame(() => {
                            board.dispatchEvent(new PointerEvent('pointerdown', {
                                bubbles: true,
                                cancelable: true,
                                clientX: event.clientX,
                                clientY: event.clientY,
                                pointerId: event.pointerId,
                                pointerType: event.pointerType || 'mouse',
                                button: 0,
                            }));
                        });
                    }
                }
                event.preventDefault();
                event.stopPropagation();
            }
            try { icon.releasePointerCapture?.(event.pointerId); } catch { /* no-op */ }
            cleanup();
        };

        const handlePointerCancel = event => {
            if (pointerId == null || event.pointerId !== pointerId) return;
            cleanup();
        };

        icon.style.touchAction = 'none';
        icon.style.cursor = canStart() ? 'grab' : icon.style.cursor;
        icon.addEventListener('pointerdown', handlePointerDown, { passive: true });
        document.addEventListener('pointermove', handlePointerMove, { passive: false });
        document.addEventListener('pointerup', handlePointerUp, { passive: false });
        document.addEventListener('pointercancel', handlePointerCancel);
        return () => {
            icon.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handlePointerUp);
            document.removeEventListener('pointercancel', handlePointerCancel);
            cleanup();
        };
    }, [type, size]);

    return <canvas ref={canvasRef} width={size} height={size} />;
};

export default TowerIcon;
