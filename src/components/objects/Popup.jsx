import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import { TOWER_DEFS } from './tower';

const Popup = (props) => {

    const { state, wave, coresEarned, runSummary, ...rest } = props;
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (state === 'end') {
            setShow(true);
        }
    }, [state])

    const topDamageDealers = runSummary
        ? Object.entries(runSummary.damageByType)
            .map(([type, dmg]) => ({ type: Number(type), dmg }))
            .sort((a, b) => b.dmg - a.dmg)
            .slice(0, 3)
        : [];

    return (
        <>
        {
        show ?
                    (<div className='popup-container'>
                        <div className='popup'>
                            <header className='popup-header'>
                                <h1 className='popup-title'>Game Over</h1>
                            </header>
                            <main className='popup-content'>
                                You ran out of lives on wave {wave}!
                                <br/>
                                {coresEarned > 0 && (
                                    <span className='popup-cores'>+{coresEarned} Cores earned</span>
                                )}
                                {runSummary && (topDamageDealers.length > 0 || runSummary.towersUsed.length > 0) && (
                                    <div className="run-summary">
                                        {runSummary.towersUsed.length > 0 && (
                                            <div className="run-summary-line">
                                                {runSummary.towersUsed.length} tower type{runSummary.towersUsed.length === 1 ? '' : 's'} used
                                            </div>
                                        )}
                                        {topDamageDealers.length > 0 && (
                                            <>
                                                <div className="run-summary-heading">Top damage dealers</div>
                                                <ul className="run-summary-list">
                                                    {topDamageDealers.map(({ type, dmg }) => (
                                                        <li key={type}>
                                                            {TOWER_DEFS[type]?.name || `Tower ${type}`}: {Math.round(dmg).toLocaleString()}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </>
                                        )}
                                    </div>
                                )}
                            </main>
                            <footer className='popup-footer'>
                                <Link to='/upgrades'>
                                    <Button className='popup-button' variant='outline-light'>Spend Cores</Button>
                                </Link>
                                <Link to='/scores' >
                                    <Button className='popup-button' variant='outline-light'>Leaderboard</Button>
                                </Link>
                            </footer>
                        </div>
                    </div>
                    ) :
                    (null)
            }
            </>
        )
}

export default Popup;