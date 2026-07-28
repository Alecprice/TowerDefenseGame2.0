import React from 'react';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import { maps } from '../data/maps';

const HomePage = () => (
    <div>
        <h1>Tower<br/>Defense</h1>
        <h3>Choose a map</h3>
        <div className="map-select">
            {maps.map((map, index) => (
                <div className="container" key={map.name}>
                    <Link to={`/login?map=${index}`}>
                        <Button variant="outline-light">{map.name}</Button>
                    </Link>
                </div>
            ))}
        </div>
        <div className="container">
            <Link to='/scores'>
                <Button variant="outline-light">Highscores</Button>
            </Link>
        </div>
        <div className="credits">
            Made by <a href="https://www.alecjprice.com" target="_blank" rel="noopener noreferrer">Alec Price</a>
        </div>
    </div>
);

export default HomePage;