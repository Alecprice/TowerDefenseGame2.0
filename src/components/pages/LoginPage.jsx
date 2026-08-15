import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import Button from 'react-bootstrap/Button';
import { setPlayerName } from '../utils/highscores';
import { DIFFICULTIES, DIFFICULTY_ORDER } from '../utils/difficulty';
import { GAME_MODES, GAME_MODE_ORDER, setGameMode, setGameModeEnabled } from '../utils/gameModes';

const LoginPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mapParam = searchParams.get('map') || '0';
    const version = searchParams.get('mode') === 'v3' ? 'v3' : 'v2';
    const [name, setName] = useState("");
    const [difficulty, setDifficulty] = useState('easy');
    const [gameMode, setSelectedGameMode] = useState('classic');
    const handleChange = e => setName(e.target.value);

    const handleSubmit = e => {
        e.preventDefault();
        setPlayerName(name);
        const isV3 = version === 'v3';
        setGameModeEnabled(isV3);
        if (isV3) setGameMode(gameMode);
        const destination = isV3 ? '/game3' : '/game';
        const rules = isV3 ? `&rules=${gameMode}` : '';
        navigate(`${destination}?map=${mapParam}&difficulty=${difficulty}${rules}`);
    }

    return (
        <div>
            <h2>Enter Name{version === 'v3' ? ' - Game 3.0' : ''}</h2>
            <div className="container">
                <form onSubmit={handleSubmit}>
                    <TextField required id="outlined-basic" label="Enter Name" variant="outlined" value={name} onChange={handleChange} />

                    <div className="difficulty-picker">
                        <div className="difficulty-picker-label">Choose a difficulty</div>
                        <div className="difficulty-picker-options">
                            {DIFFICULTY_ORDER.map(key => {
                                const d = DIFFICULTIES[key];
                                return (
                                    <button
                                        type="button"
                                        key={key}
                                        className={`difficulty-option difficulty-option-${key}${difficulty === key ? ' selected' : ''}`}
                                        onClick={() => setDifficulty(key)}
                                        aria-pressed={difficulty === key}
                                    >
                                        <span className="difficulty-option-name">{d.name}</span>
                                        <span className="difficulty-option-desc">{d.desc}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {version === 'v3' && (
                        <div className="difficulty-picker game-mode-picker">
                            <div className="difficulty-picker-label">Choose a game mode</div>
                            <div className="difficulty-picker-options">
                                {GAME_MODE_ORDER.map(key => {
                                    const rule = GAME_MODES[key];
                                    return (
                                        <button
                                            type="button"
                                            key={key}
                                            className={`difficulty-option${gameMode === key ? ' selected' : ''}`}
                                            onClick={() => setSelectedGameMode(key)}
                                            aria-pressed={gameMode === key}
                                        >
                                            <span className="difficulty-option-name">{rule.name}</span>
                                            <span className="difficulty-option-desc">{rule.desc}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <Button className='sbtn' variant="outline-light" type="submit">Begin</Button>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;
