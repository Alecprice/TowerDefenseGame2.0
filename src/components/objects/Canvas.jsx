import React, { useEffect, useRef } from 'react';
import { mouse } from '../pages/GamePage';

const Canvas = props => {

    const { draw, events, ...rest } = props;
    const canvasRef = useRef(null);
    const drawRef = useRef(draw);

    // draw closes over current game state (score, wave, selection, etc.)
    // so it legitimately changes every render - keep the latest version
    // in a ref rather than restarting the whole render loop for it.
    useEffect(() => {
        drawRef.current = draw;
    }, [draw]);

    // The render loop and pointer listeners only need to be set up once.
    // Previously this effect depended on [draw, events], both of which are
    // new function references every render, so the loop and all pointer
    // listeners were being torn down and rebuilt many times per second.
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const cleanupEvents = events(canvas);
        let animationFrameID;

        const render = () => {
            drawRef.current(ctx);
            animationFrameID = window.requestAnimationFrame(render);
        }
        render();

        return () => {
            window.cancelAnimationFrame(animationFrameID);
            if (typeof cleanupEvents === 'function') cleanupEvents();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <canvas ref={canvasRef} {...rest} />;
}

export default Canvas;