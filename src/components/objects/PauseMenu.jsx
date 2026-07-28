import React from 'react';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';

// Shown when the player opens the in-game menu. Pauses the game behind it
// (handled by the caller) and offers a way back into the game or out to
// the home page entirely.
const PauseMenu = ({ show, onResume }) => {
    if (!show) return null;

    return (
        <div className="popup-container">
            <div className="popup">
                <header className="popup-header">
                    <h1 className="popup-title">Paused</h1>
                </header>
                <main className="popup-content">
                    The wave is on hold. Jump back in whenever you&apos;re ready.
                </main>
                <footer className="popup-footer pause-menu-footer">
                    <Button className="popup-button" variant="outline-light" onClick={onResume}>
                        Resume
                    </Button>
                    <Link to="/">
                        <Button className="popup-button" variant="outline-light">
                            Quit
                        </Button>
                    </Link>
                </footer>
            </div>
        </div>
    );
};

export default PauseMenu;
