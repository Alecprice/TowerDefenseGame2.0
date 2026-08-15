import React, { useEffect, useRef } from 'react';
import { recordGameError } from '../utils/gameDiagnostics';

const Canvas = props => {
    const { draw, events, ...rest } = props;
    const canvasRef = useRef(null);
    const drawRef = useRef(draw);

    useEffect(() => {
        drawRef.current = draw;
    }, [draw]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;
        const ctx = canvas.getContext('2d');
        if (!ctx) return undefined;

        const cleanupEvents = events(canvas);
        let animationFrameID = null;
        let stopped = false;
        let consecutiveErrors = 0;

        const render = () => {
            if (stopped) return;
            try {
                drawRef.current(ctx);
                consecutiveErrors = 0;
            } catch (error) {
                consecutiveErrors += 1;
                recordGameError(error, {
                    source: 'canvas-render-loop',
                    consecutiveErrors,
                    width: canvas.width,
                    height: canvas.height,
                    hidden: document.hidden,
                });
                // One bad object/frame should not permanently kill the game.
                // If the same bug repeats continuously, stop the loop and let
                // the global React boundary/reload path take over instead of
                // pegging the CPU with an exception every frame.
                if (consecutiveErrors >= 8) {
                    stopped = true;
                    window.dispatchEvent(new CustomEvent('td-game-loop-failed', { detail: { message: error?.message } }));
                    return;
                }
            }
            animationFrameID = window.requestAnimationFrame(render);
        };

        const handleVisibility = () => {
            // requestAnimationFrame is already throttled in background tabs;
            // restart with a clean frame when the tab returns so stale timing
            // deltas cannot create a huge simulation jump.
            if (!document.hidden && !stopped && animationFrameID == null) {
                animationFrameID = window.requestAnimationFrame(render);
            }
        };

        animationFrameID = window.requestAnimationFrame(render);
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            stopped = true;
            if (animationFrameID != null) window.cancelAnimationFrame(animationFrameID);
            document.removeEventListener('visibilitychange', handleVisibility);
            if (typeof cleanupEvents === 'function') cleanupEvents();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <canvas ref={canvasRef} {...rest} />;
};

export default Canvas;
