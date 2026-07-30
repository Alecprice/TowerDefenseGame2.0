import React, { useState } from 'react';
import { Checkbox } from '@mui/material';
import { markTutorialAsShown } from '../utils/progression';

const Tutorial = ({ onClose, isOpen }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const pages = [
        {
            title: 'Welcome to Tower Defense!',
            content: 'Bad guys are marching down the path. Your job is to build towers to stop them before they reach the end! If too many get through, the game ends - so build smart and have fun.',
        },
        {
            title: 'Step 1: Build a Tower',
            content: 'On the right side of the screen you\u2019ll see a box of towers. Press and hold one, then drag it onto the green ground and let go. You can only build on the green ground, not on the dirt path where enemies walk.',
        },
        {
            title: 'Step 2: Tap a Tower',
            content: 'Tap any tower you\u2019ve already built to open its little menu. You can spend gold to make it stronger (Upgrade), or Sell it back for some gold if you change your mind.',
        },
        {
            title: 'The Numbers at the Top',
            items: [
                'Money ($): gold you earn by defeating enemies. Spend it on towers and upgrades.',
                'Lives: how many enemies are allowed to reach the end before the game is over.',
                'Wave: which group of enemies is attacking right now. Waves get a little tougher each time.',
            ],
        },
        {
            title: 'Attack Towers',
            content: 'These towers shoot enemies to hurt them:',
            items: [
                'Striker (red circle): a solid all-around tower - great for getting started.',
                'Sniper (yellow triangle): shoots far and hits hard, but slowly.',
                'Blaster (orange diamond): hits every enemy near it at the same time.',
                'Burner (green square): fires super fast, but each hit is small.',
                'Cannon (purple hexagon): its shots splash and hurt nearby enemies too.',
            ],
        },
        {
            title: 'Special Towers',
            content: 'These towers do something extra instead of just hitting hard:',
            items: [
                'Toxin Spire (green cross): poisons enemies so they keep losing health over time.',
                'Frost Tower (cyan star): freezes enemies to make them move slower.',
                'Bank (yellow pentagon): makes gold appear over time, all on its own.',
                'Bulwark (red octagon): saves its big attacks just for giant Boss enemies.',
                'Beacon (cyan plus): makes towers standing near it stronger - build it in the middle of your other towers!',
            ],
        },
        {
            title: 'Meet the Enemies',
            items: [
                'Grunt: a normal enemy - nothing special.',
                'Runner: fast, but doesn\u2019t take many hits to defeat.',
                'Tank: has a lot of health, so it takes a while to bring down.',
                'Armored: shrugs off some of the damage from every hit.',
                'Boss: a giant enemy that shows up every 5th wave. Watch out!',
            ],
        },
        {
            title: 'The Buttons You\u2019ll Use',
            items: [
                'Play / Pause: start or freeze the action any time you need a break.',
                'Speed: makes the game go faster (or slower) - try it out!',
                'Sound: turns music and sound effects on or off.',
                'Menu: pause the game and go back to the main menu.',
            ],
        },
        {
            title: 'You\u2019ve Got This!',
            content: 'Build towers near the twists and turns in the path so they get more chances to shoot. It\u2019s okay to lose a few lives while you\u2019re learning - just try again! Have fun defending your base.',
        },
    ];

    const handleNextPage = () => {
        if (currentPage < pages.length - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleClose = () => {
        if (dontShowAgain) {
            markTutorialAsShown();
        }
        onClose();
    };

    if (!isOpen) return null;

    const page = pages[currentPage];

    return (
        <div className="tutorial-overlay">
            <div className="tutorial-modal">
                <h2 className="tutorial-title">{page.title}</h2>
                {page.content && <p className="tutorial-content">{page.content}</p>}
                {page.items && (
                    <ul className="tutorial-list">
                        {page.items.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                )}
                <div className="tutorial-controls">
                    <button className="tutorial-btn" onClick={handlePrevPage} disabled={currentPage === 0}>
                        ← Back
                    </button>
                    <span className="tutorial-page-counter">
                        {currentPage + 1} / {pages.length}
                    </span>
                    <button className="tutorial-btn" onClick={handleNextPage} disabled={currentPage === pages.length - 1}>
                        Next →
                    </button>
                </div>
                <div className="tutorial-footer">
                    <label className="tutorial-checkbox">
                        <Checkbox
                            size="small"
                            checked={dontShowAgain}
                            onChange={(e) => setDontShowAgain(e.target.checked)}
                        />
                        Don&apos;t show again
                    </label>
                    <button className="tutorial-close-btn" onClick={handleClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Tutorial;
