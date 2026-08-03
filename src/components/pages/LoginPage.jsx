import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import Button from 'react-bootstrap/Button';
import { setPlayerName } from '../utils/highscores';
import { DIFFICULTIES, DIFFICULTY_ORDER } from '../utils/difficulty';


const LoginPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mapParam = searchParams.get('map') || '0';
    const mode = searchParams.get('mode') === 'v3' ? 'v3' : 'v2';
    const [name, setName] = useState("");
    const [difficulty, setDifficulty] = useState('easy');
    const handleChange = e => setName(e.target.value);

    const handleSubmit = e => {
        e.preventDefault();
        setPlayerName(name);
        const destination = mode === 'v3' ? '/game3' : '/game';
        navigate(`${destination}?map=${mapParam}&difficulty=${difficulty}`);
    }

    return (
        <div>
            <h2>Enter Name{mode === 'v3' ? ' - Game 3.0' : ''}</h2>
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

                    <Button className='sbtn' variant="outline-light" type="submit">Begin</Button>
                </form>
            </div>
        </div>
    );
}


export default LoginPage;