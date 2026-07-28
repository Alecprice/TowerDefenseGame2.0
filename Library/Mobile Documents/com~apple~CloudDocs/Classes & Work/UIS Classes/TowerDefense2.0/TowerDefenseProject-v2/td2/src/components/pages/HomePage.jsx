import React from 'react';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import { playUiClick } from '../utils/sfx';

const HomePage = () => (
    <div>
        <h1>Tower<br/>Defense</h1>
        <div className="container">
            <Link to='/play' onClick={playUiClick}>
                <Button className='sbtn' variant="outline-light">Play</Button>
            </Link>
        </div>
        <div className="container">
            <Link to='/scores' onClick={playUiClick}>
                <Button variant="outline-light">Highscores</Button>
            </Link>
        </div>
        <div className="credits">
            Made by <a href="https://www.alecjprice.com" target="_blank" rel="noopener noreferrer">Alec Price</a>
        </div>
    </div>
);

export default HomePage;
