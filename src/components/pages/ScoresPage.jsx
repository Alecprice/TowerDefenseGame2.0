import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import { getHighScores, getCurrentSeasonLabel, parseRunLabel } from '../utils/highscores';
import { supabase } from '../utils/supabaseClient';
import { DIFFICULTIES, DIFFICULTY_ORDER } from '../utils/difficulty';
import { GAME_MODES, GAME_MODE_ORDER } from '../utils/gameModes';

const ScoresPage = () => {
    const [gameVersion, setGameVersion] = useState('v3');
    const [season, setSeason] = useState('current');
    const [difficulty, setDifficulty] = useState('all');
    const [mode, setMode] = useState('all');
    const [ranked, setRanked] = useState('all');
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        const seasonParam = season === 'current' ? new Date().toISOString().slice(0, 7) : 'all';
        const scope = gameVersion === 'v3' ? { difficulty, mode, ranked } : {};
        getHighScores(seasonParam, gameVersion, scope).then(result => {
            if (!cancelled) { setScores(result); setLoading(false); }
        });
        return () => { cancelled = true; };
    }, [season, gameVersion, difficulty, mode, ranked]);

    return (
        <div>
            <h1>Highscores</h1>
            <p className="scores-note">{supabase ? 'Top scores from all players' : 'Best scores on this device'}</p>
            <div className="season-toggle">
                <button className={gameVersion === 'v2' ? 'active' : ''} onClick={() => setGameVersion('v2')}>Tower Defense 2.0</button>
                <button className={gameVersion === 'v3' ? 'active' : ''} onClick={() => setGameVersion('v3')}>Tower Defense 3.1</button>
            </div>
            <div className="season-toggle">
                <button className={season === 'current' ? 'active' : ''} onClick={() => setSeason('current')}>This Month ({getCurrentSeasonLabel()})</button>
                <button className={season === 'all' ? 'active' : ''} onClick={() => setSeason('all')}>All-Time</button>
            </div>

            {gameVersion === 'v3' && (
                <div className="leaderboard-filters" style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', margin: '12px auto 18px' }}>
                    <label>Difficulty&nbsp;
                        <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                            <option value="all">All</option>
                            {DIFFICULTY_ORDER.map(key => <option value={key} key={key}>{DIFFICULTIES[key].name}</option>)}
                        </select>
                    </label>
                    <label>Mode&nbsp;
                        <select value={mode} onChange={e => setMode(e.target.value)}>
                            <option value="all">All</option>
                            {GAME_MODE_ORDER.map(key => <option value={key} key={key}>{GAME_MODES[key].name}</option>)}
                        </select>
                    </label>
                    <label>Run&nbsp;
                        <select value={ranked} onChange={e => setRanked(e.target.value)}>
                            <option value="all">All</option>
                            <option value="ranked">Ranked</option>
                            <option value="unranked">Unranked</option>
                        </select>
                    </label>
                </div>
            )}

            <div className="container">
                {loading ? <p>Loading scores...</p> : scores.length === 0 ? <p>No scores match these filters yet.</p> : (
                    <table className="scores-table">
                        <thead><tr><th>#</th><th>Name</th><th>Score</th><th>Wave</th><th>Map / Rules</th></tr></thead>
                        <tbody>{scores.map((entry, index) => {
                            const parsed = parseRunLabel(entry.mapName);
                            return <tr key={`${entry.date}-${index}`}>
                                <td>{index + 1}</td><td>{entry.name}</td><td>{entry.score}</td><td>{entry.wave}</td>
                                <td>{parsed.displayMap}{parsed.mode ? <><br/><small>{GAME_MODES[parsed.mode]?.name || parsed.mode} · {DIFFICULTIES[parsed.difficulty]?.name || parsed.difficulty}{parsed.ranked ? ' · Ranked' : ''}{parsed.daily ? ' · Daily' : ''}</small></> : null}</td>
                            </tr>;
                        })}</tbody>
                    </table>
                )}
            </div>
            <div className="container"><Link to='/'><Button variant="outline-light">Home</Button></Link></div>
        </div>
    );
};

export default ScoresPage;
