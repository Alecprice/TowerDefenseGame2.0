import React, { useEffect, useRef } from 'react';
import { TOWER_DEFS, drawShape } from './tower';

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

    return <canvas ref={canvasRef} width={size} height={size} />;
};

export default TowerIcon;
