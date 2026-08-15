import React from 'react';
import GamePageV31 from './GamePageV31';
import { isAdminTestMode } from '../utils/adminTestMode';

const GamePageV32 = () => (
    <>
        <div style={{ maxWidth: 1500, margin: '6px auto 0', textAlign: 'center', fontFamily: 'pixel', color: '#9facbc', fontSize: 12 }}>
            Tower Defense 3.2 · 100 unique maps · 21 game modes · 550 achievements
            {isAdminTestMode() && <span style={{ color: '#ffd60a', marginLeft: 10 }}>QA / ADMIN — progression and competitive writes disabled</span>}
        </div>
        <GamePageV31 />
    </>
);

export default GamePageV32;
