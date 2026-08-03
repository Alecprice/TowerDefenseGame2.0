import React from 'react';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import { maps } from '../data/maps';
import { playUiClick } from '../utils/sfx';
import { isMapUnlocked, getMapWavesCompleted } from '../utils/progression';
import { isMapUnlockedV3, getMapWavesCompletedV3 } from '../utils/progressionV3';
import MapPreview from '../objects/MapPreview';

// The map picker. Every map shows a small preview of its layout before you
// commit to it, and locked maps are shown (greyed out, with progress
// toward unlocking) instead of just being silently absent.
//
// mode='v3' switches this to Game 3.0's own (fully independent) unlock
// progress and routes into /login?mode=v3 instead of the original flow -
// see progressionV3.js and MENTAL_MODEL.md's note on why the two modes'
// save data is never shared.
const MapSelectPage = ({ mode = 'v2' }) => {
    const isUnlockedFn = mode === 'v3' ? isMapUnlockedV3 : isMapUnlocked;
    const wavesCompletedFn = mode === 'v3' ? getMapWavesCompletedV3 : getMapWavesCompleted;
    const modeSuffix = mode === 'v3' ? '&mode=v3' : '';

    return (
    <div>
        <h1>Choose a Map - {mode === 'v3' ? 'Tower Defense 3.0' : 'Tower Defense 2.0'}</h1>
        <p className="map-select-subtitle">
            {mode === 'v3'
                ? '22 towers · Money to build, Crystals to upgrade'
                : '15 towers · single currency'}
        </p>
        <div className="map-select-grid">
            {maps.map((map, index) => {
                const unlocked = isUnlockedFn(index);
                const wavesCompleted = wavesCompletedFn(index);
                const card = (
                    <div className={`map-select-card ${unlocked ? '' : 'locked'}`}>
                        <MapPreview map={map} />
                        <div className="map-select-name">{map.name}</div>
                        {unlocked ? (
                            <div className="map-select-progress">
                                {wavesCompleted > 0 ? `Best: wave ${wavesCompleted}` : 'Not yet played'}
                            </div>
                        ) : (
                            <div className="map-select-lock">
                                🔒 Reach wave 5 on &quot;{maps[index - 1]?.name}&quot;
                            </div>
                        )}
                    </div>
                );
                return unlocked ? (
                    <Link to={`/login?map=${index}${modeSuffix}`} onClick={playUiClick} key={map.name} style={{ textDecoration: 'none' }}>
                        {card}
                    </Link>
                ) : (
                    <div key={map.name} aria-disabled="true">
                        {card}
                    </div>
                );
            })}
        </div>
        <div className="container">
            <Link to='/' onClick={playUiClick}>
                <Button variant="outline-light" size="sm">Back</Button>
            </Link>
        </div>
    </div>
    );
};

export default MapSelectPage;
