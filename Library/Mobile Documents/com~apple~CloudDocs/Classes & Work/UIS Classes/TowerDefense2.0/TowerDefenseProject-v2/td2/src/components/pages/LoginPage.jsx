import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import Button from 'react-bootstrap/Button';
import { setPlayerName } from '../utils/highscores';


const LoginPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mapParam = searchParams.get('map') || '0';
    const [name, setName] = useState("");
    const handleChange = e => setName(e.target.value);

    const handleSubmit = e => {
        e.preventDefault();
        setPlayerName(name);
        navigate(`/game?map=${mapParam}`);
    }

    return (
        <div>
            <h2>Enter Name</h2>
            <div className="container">
                <form onSubmit={handleSubmit}>
                    <TextField required id="outlined-basic" label="Enter Name" variant="outlined" value={name} onChange={handleChange} />
                    <Button className='sbtn' variant="outline-light" type="submit">Begin</Button>
                </form>
            </div>
        </div>
    );
}


export default LoginPage;