import React from 'react';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import { playUiClick } from '../utils/sfx';

const HomePage = () => (
    <div>
        <h1>Tower<br/>Defense</h1>
        <div className="container">
            <Link to='/play' onClick={playUiClick}>
                <Button className='sbtn' variant="outline-light">Map Selection</Button>
            </Link>
        </div>
        <div className="container">
            <a href="https://tower-defense-9awdv.ondigitalocean.app/" target="_blank" rel="noopener noreferrer" onClick={playUiClick}>
                <Button className='sbtn' variant="outline-light">Tower Defense Game Version 1</Button>
            </a>
        </div>
        <div className="container">
            <Link to='/scores' onClick={playUiClick}>
                <Button variant="outline-light">Highscores</Button>
            </Link>
        </div>
        <div className="credits">
            Made and Designed by <a href="https://www.alecjprice.com" target="_blank" rel="noopener noreferrer">Alec Price</a>
        </div>
    </div>
);

export default HomePage;
