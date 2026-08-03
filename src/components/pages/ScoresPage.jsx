import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import { getHighScores, getCurrentSeasonLabel } from '../utils/highscores';
import { supabase } from '../utils/supabaseClient';

// Global leaderboard when Supabase is configured, otherwise a local
// (per-device) high score board as a fallback. Two views: the current
// calendar month (resets on its own every month, so there's always a
// fresh climb) and the permanent all-time board.
// Global leaderboard when Supabase is configured, otherwise a local
// (per-device) high score board as a fallback. Two independent toggles:
// which game (the original, or Game 3.0 - always separate leaderboards,
// never merged - see game_version in schema.sql) and which time window
// (the current calendar month, which resets on its own, or all-time).
const ScoresPage = () => {
    const [gameVersion, setGameVersion] = useState('v2');
    const [season, setSeason] = useState('current');
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        const seasonParam = season === 'current' ? new Date().toISOString().slice(0, 7) : 'all';
        getHighScores(seasonParam, gameVersion).then(result => {
            if (!cancelled) {
                setScores(result);
                setLoading(false);
            }
        });
        return () => { cancelled = true; };
    }, [season, gameVersion]);

    return (
        <div>
            <h1>Highscores</h1>
            <p className="scores-note">
                {supabase ? 'Top scores from all players' : 'Best scores on this device'}
            </p>
            <div className="season-toggle">
                <button
                    className={gameVersion === 'v2' ? 'active' : ''}
                    onClick={() => setGameVersion('v2')}
                >
                    Tower Defense 2.0
                </button>
                <button
                    className={gameVersion === 'v3' ? 'active' : ''}
                    onClick={() => setGameVersion('v3')}
                >
                    Tower Defense 3.0
                </button>
            </div>
            <div className="season-toggle">
                <button
                    className={season === 'current' ? 'active' : ''}
                    onClick={() => setSeason('current')}
                >
                    This Month ({getCurrentSeasonLabel()})
                </button>
                <button
                    className={season === 'all' ? 'active' : ''}
                    onClick={() => setSeason('all')}
                >
                    All-Time
                </button>
            </div>
            <div className="container">
                {loading ? (
                    <p>Loading scores...</p>
                ) : scores.length === 0 ? (
                    <p>No scores yet - go play a round!</p>
                ) : (
                    <table className="scores-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Score</th>
                                <th>Wave</th>
                                <th>Map</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scores.map((entry, index) => (
                                <tr key={`${entry.date}-${index}`}>
                                    <td>{index + 1}</td>
                                    <td>{entry.name}</td>
                                    <td>{entry.score}</td>
                                    <td>{entry.wave}</td>
                                    <td>{entry.mapName}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <div className="container">
                <Link to='/'>
                    <Button variant="outline-light">Home</Button>
                </Link>
            </div>
        </div>
    );
};

export default ScoresPage;
