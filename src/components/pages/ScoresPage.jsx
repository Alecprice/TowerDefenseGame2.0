import React from 'react';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import { getHighScores } from '../utils/highscores';

// There's no backend anymore, so this is a local (per-device) high score
// board rather than a shared/global leaderboard.
const ScoresPage = () => {
    const scores = getHighScores();

    return (
        <div>
            <h1>Highscores</h1>
            <p className="scores-note">Best scores on this device</p>
            <div className="container">
                {scores.length === 0 ? (
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
