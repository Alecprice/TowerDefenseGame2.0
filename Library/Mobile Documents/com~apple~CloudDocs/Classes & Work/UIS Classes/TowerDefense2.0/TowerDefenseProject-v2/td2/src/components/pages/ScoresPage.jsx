import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import { getHighScores } from '../utils/highscores';
import { supabase } from '../utils/supabaseClient';

// Global leaderboard when Supabase is configured, otherwise a local
// (per-device) high score board as a fallback.
const ScoresPage = () => {
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getHighScores().then(result => {
            if (!cancelled) {
                setScores(result);
                setLoading(false);
            }
        });
        return () => { cancelled = true; };
    }, []);

    return (
        <div>
            <h1>Highscores</h1>
            <p className="scores-note">
                {supabase ? 'Top scores from all players' : 'Best scores on this device'}
            </p>
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
