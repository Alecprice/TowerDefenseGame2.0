import React, { useEffect, useRef } from 'react';

const THEME_COLORS = {
    grass: { path: '#8a6d3b', buildable: '#2d5a27' },
    desert: { path: '#c9a35a', buildable: '#7a6238' },
    snow: { path: '#c9d6e3', buildable: '#5b7a8c' },
    volcanic: { path: '#5a3a2a', buildable: '#3a1f1f' },
};

const PREVIEW_WIDTH = 200;
const PREVIEW_HEIGHT = Math.round(PREVIEW_WIDTH * (12 / 18)); // matches the 18x12 board ratio

const MapPreview = ({ map }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const cellW = PREVIEW_WIDTH / 18;
        const cellH = PREVIEW_HEIGHT / 12;
        const colors = THEME_COLORS[map.theme] || THEME_COLORS.grass;

        ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
        for (let y = 0; y < 12; y++) {
            for (let x = 0; x < 18; x++) {
                ctx.fillStyle = map.grid[y][x] === 1 ? colors.path : colors.buildable;
                ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);
            }
        }

        if (map.waypoints && map.waypoints.length > 1) {
            ctx.strokeStyle = 'rgba(255,255,255,0.85)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            const scaleX = PREVIEW_WIDTH / 900;
            const scaleY = PREVIEW_HEIGHT / 600;
            map.waypoints.forEach((wp, i) => {
                const x = wp.x * scaleX;
                const y = wp.y * scaleY;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
            ctx.stroke();
        }
    }, [map]);

    return <canvas ref={canvasRef} width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT} />;
};

export default MapPreview;
