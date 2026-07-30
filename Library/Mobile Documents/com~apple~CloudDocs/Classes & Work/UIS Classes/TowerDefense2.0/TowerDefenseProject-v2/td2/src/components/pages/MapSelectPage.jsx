import React from 'react';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import { maps } from '../data/maps';
import { playUiClick } from '../utils/sfx';
import { isMapUnlocked, getMapWavesCompleted } from '../utils/progression';
import MapPreview from '../objects/MapPreview';

// The map picker. Every map shows a small preview of its layout before you
// commit to it, and locked maps are shown (greyed out, with progress
// toward unlocking) instead of just being silently absent.
const MapSelectPage = () => (
    <div>
        <h1>Choose a map</h1>
        <div className="map-select-grid">
            {maps.map((map, index) => {
                const unlocked = isMapUnlocked(index);
                const wavesCompleted = getMapWavesCompleted(index);
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
                    <Link to={`/login?map=${index}`} onClick={playUiClick} key={map.name} style={{ textDecoration: 'none' }}>
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

export default MapSelectPage;
