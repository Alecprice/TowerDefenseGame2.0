import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import Button from 'react-bootstrap/Button';
import { getPlayerName, setPlayerName } from '../utils/highscores';
import { DIFFICULTIES, DIFFICULTY_ORDER } from '../utils/difficulty';
import { GAME_MODES, GAME_MODE_ORDER, setGameMode, setGameModeEnabled } from '../utils/gameModes';
import { getDailyChallenge } from '../utils/dailyChallengeV31';

const LoginPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const version = searchParams.get('mode') === 'v3' ? 'v3' : 'v2';
    const daily = version === 'v3' && searchParams.get('daily') === '1' ? getDailyChallenge() : null;
    const mapParam = daily ? String(daily.mapIndex) : (searchParams.get('map') || '0');
    const [name, setName] = useState(getPlayerName());
    const [difficulty, setDifficulty] = useState(daily?.difficultyKey || 'basic');
    const [gameMode, setSelectedGameMode] = useState(daily?.modeKey || 'classic');
    const [ranked, setRanked] = useState(Boolean(daily));
    const handleChange = e => setName(e.target.value);

    const handleSubmit = e => {
        e.preventDefault();
        setPlayerName(name);
        const isV3 = version === 'v3';
        setGameModeEnabled(isV3);
        if (isV3) setGameMode(gameMode);
        const destination = isV3 ? '/game3' : '/game';
        const rules = isV3 ? `&rules=${gameMode}` : '';
        const rankedParam = isV3 && ranked ? '&ranked=1' : '';
        const dailyParam = daily ? `&daily=1&seed=${encodeURIComponent(daily.seed)}` : '';
        navigate(`${destination}?map=${mapParam}&difficulty=${difficulty}${rules}${rankedParam}${dailyParam}`);
    };

    return (
        <div>
            <h2>Enter Name{version === 'v3' ? ' - Game 3.1' : ''}</h2>
            <div className="container">
                <form onSubmit={handleSubmit}>
                    <TextField required id="outlined-basic" label="Enter Name" variant="outlined" value={name} onChange={handleChange} />

                    {daily && (
                        <div className="daily-challenge-card">
                            <strong>{daily.name}</strong>
                            <span>Map #{daily.mapIndex + 1} · {DIFFICULTIES[daily.difficultyKey].name} · {GAME_MODES[daily.modeKey].name}</span>
                            <span>Objective: reach wave {daily.objectiveWave}. Daily runs are Ranked.</span>
                        </div>
                    )}

                    <div className="difficulty-picker">
                        <div className="difficulty-picker-label">Choose a difficulty</div>
                        <div className="difficulty-picker-options">
                            {DIFFICULTY_ORDER.map(key => {
                                const d = DIFFICULTIES[key];
                                return (
                                    <button
                                        type="button"
                                        key={key}
                                        disabled={Boolean(daily)}
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
                        <>
                            <div className="difficulty-picker game-mode-picker">
                                <div className="difficulty-picker-label">Choose a game mode</div>
                                <div className="difficulty-picker-options">
                                    {GAME_MODE_ORDER.map(key => {
                                        const rule = GAME_MODES[key];
                                        return (
                                            <button
                                                type="button"
                                                key={key}
                                                disabled={Boolean(daily)}
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
                            <label className="ranked-toggle">
                                <input type="checkbox" checked={ranked} disabled={Boolean(daily)} onChange={e => setRanked(e.target.checked)} />
                                <span><strong>Ranked run</strong> — disables permanent Core stat bonuses so leaderboard starts are equal.</span>
                            </label>
                        </>
                    )}

                    <Button className='sbtn' variant="outline-light" type="submit">Begin</Button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
