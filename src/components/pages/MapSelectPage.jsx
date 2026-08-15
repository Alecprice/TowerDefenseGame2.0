import React from 'react';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import { maps } from '../data/maps';
import { TOWER_TYPES_V3 } from '../objects/towerDefsV3';
import { playUiClick } from '../utils/sfx';
import { isMapUnlocked, getMapWavesCompleted } from '../utils/progression';
import MapPreview from '../objects/MapPreview';
import {
    isMapUnlockedV31, getMapStars, getMapRecordV31,
    getTotalStars, getMapUnlockRequirement,
} from '../utils/progressionV31';
import { getMapMechanic } from '../utils/mapMechanicsV31';
import { GAME_MODE_ORDER } from '../utils/gameModes';
import { getDailyChallenge } from '../utils/dailyChallengeV31';

const MapSelectPage = ({ mode = 'v2' }) => {
    const isV3 = mode === 'v3';
    const modeSuffix = isV3 ? '&mode=v3' : '';
    const mapCount = maps.length;
    const v3TowerCount = TOWER_TYPES_V3.length;
    const totalStars = isV3 ? getTotalStars() : 0;
    const daily = isV3 ? getDailyChallenge() : null;

    return (
    <div>
        <h1>Choose a Map - {isV3 ? 'Tower Defense 3.1' : 'Tower Defense 2.0'}</h1>
        <p className="map-select-subtitle">
            {isV3
                ? `${mapCount} maps · ${v3TowerCount} towers · ${GAME_MODE_ORDER.length} game modes · ${totalStars} stars earned`
                : `${mapCount} maps · 15 towers · single currency`}
        </p>
        {isV3 && daily && (
            <div className="container" style={{ paddingBottom: 14 }}>
                <Link to={`/login?map=${daily.mapIndex}&mode=v3&daily=1`} onClick={playUiClick}>
                    <Button className="sbtn" variant="outline-warning">Daily Challenge · Map #{daily.mapIndex + 1} · Reach Wave {daily.objectiveWave}</Button>
                </Link>
            </div>
        )}
        <div className="map-select-grid">
            {maps.map((map, index) => {
                const unlocked = isV3 ? isMapUnlockedV31(index) : isMapUnlocked(index);
                const wavesCompleted = isV3 ? getMapRecordV31(index).bestWave : getMapWavesCompleted(index);
                const stars = isV3 ? getMapStars(index) : 0;
                const requiredStars = isV3 ? getMapUnlockRequirement(index) : 0;
                const mechanic = isV3 ? getMapMechanic(index, map) : null;
                const card = (
                    <div className={`map-select-card ${unlocked ? '' : 'locked'}`}>
                        <MapPreview map={map} />
                        <div className="map-select-name">{map.name}</div>
                        {isV3 && (
                            <div className="map-select-progress" style={{ color: '#ffd60a' }}>
                                {'★'.repeat(stars)}{'☆'.repeat(3 - stars)} · {mechanic.name}
                            </div>
                        )}
                        {unlocked ? (
                            <div className="map-select-progress">
                                {wavesCompleted > 0 ? `Best: wave ${wavesCompleted}` : 'Not yet played'}
                            </div>
                        ) : (
                            <div className="map-select-lock">
                                {isV3
                                    ? `🔒 Earn ${Math.max(0, requiredStars - totalStars)} more stars to unlock this region`
                                    : `🔒 Reach wave 5 on "${maps[index - 1]?.name}"`}
                            </div>
                        )}
                    </div>
                );
                return unlocked ? (
                    <Link to={`/login?map=${index}${modeSuffix}`} onClick={playUiClick} key={map.name} style={{ textDecoration: 'none' }}>
                        {card}
                    </Link>
                ) : (
                    <div key={map.name} aria-disabled="true">{card}</div>
                );
            })}
        </div>
        <div className="container">
            <Link to='/' onClick={playUiClick}><Button variant="outline-light" size="sm">Back</Button></Link>
        </div>
    </div>
    );
};

export default MapSelectPage;
