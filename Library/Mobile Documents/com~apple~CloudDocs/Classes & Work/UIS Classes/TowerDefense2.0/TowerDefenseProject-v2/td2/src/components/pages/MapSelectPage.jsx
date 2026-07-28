import React from 'react';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import { maps } from '../data/maps';
import { playUiClick } from '../utils/sfx';

const MapSelectPage = () => (
    <div>
        <h1>Choose a map</h1>
        <div className="map-select">
            {maps.map((map, index) => (
                <div className="container" key={map.name}>
                    <Link to={`/login?map=${index}`} onClick={playUiClick}>
                        <Button variant="outline-light">{map.name}</Button>
                    </Link>
                </div>
            ))}
        </div>
        <div className="container">
            <Link to='/' onClick={playUiClick}>
                <Button variant="outline-light" size="sm">Back</Button>
            </Link>
        </div>
    </div>
);

export default MapSelectPage;
