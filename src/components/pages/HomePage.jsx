import React from 'react';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import { playUiClick } from '../utils/sfx';
import { getSavedRunMetaV31 } from '../utils/runSaveV31';
import { getDailyChallenge } from '../utils/dailyChallengeV31';
import AdminTestPanel from '../objects/AdminTestPanel';

const HomePage = () => {
    const saved = getSavedRunMetaV31();
    const daily = getDailyChallenge();

    return (
        <div>
            <h1>Tower<br/>Defense</h1>
            <div className="container">
                <Link to='/play3' onClick={playUiClick}>
                    <Button className='sbtn' variant="outline-light">Tower Defense Game 3.2</Button>
                </Link>
            </div>
            {saved && (
                <div className="container">
                    <Link to='/game3?resume=1' onClick={playUiClick}>
                        <Button className='sbtn' variant="outline-info">Continue {saved.mapName || 'Run'} · Wave {saved.wave}</Button>
                    </Link>
                </div>
            )}
            <div className="container">
                <Link to={`/login?map=${daily.mapIndex}&mode=v3&daily=1`} onClick={playUiClick}>
                    <Button className='sbtn' variant="outline-warning">Daily Challenge · Reach Wave {daily.objectiveWave}</Button>
                </Link>
            </div>
            <div className="container">
                <Link to='/upgrades' onClick={playUiClick}><Button className='sbtn' variant="outline-light">Endless Upgrades</Button></Link>
            </div>
            <div className="container">
                <Link to='/achievements' onClick={playUiClick}><Button className='sbtn' variant="outline-light">550 Achievements</Button></Link>
            </div>
            <div className="container">
                <Link to='/scores' onClick={playUiClick}><Button variant="outline-light">Highscores</Button></Link>
            </div>

            <AdminTestPanel />

            <div className="credits">
                Made and Designed by <a href="https://www.alecjprice.com" target="_blank" rel="noopener noreferrer">Alec Price</a>
            </div>
            <div className="container">
                <a href="https://tower-defense-9awdv.ondigitalocean.app/" target="_blank" rel="noopener noreferrer" onClick={playUiClick}>
                    <Button className='sbtn' variant="outline-light">Tower Defense Game Version 1</Button>
                </a>
                <div className="legacy-note">Database not configured - an old version of the game, kept here for historical purposes.</div>
            </div>
            <div className="container">
                <Link to='/play' onClick={playUiClick}><Button className='sbtn' variant="outline-light">Tower Defense Game Version 2.0 Map Selection</Button></Link>
            </div>
        </div>
    );
};

export default HomePage;
