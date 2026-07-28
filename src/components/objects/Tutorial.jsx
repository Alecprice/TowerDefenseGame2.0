import React, { useState } from 'react';
import { Checkbox } from '@mui/material';
import { markTutorialAsShown } from '../utils/progression';

const Tutorial = ({ onClose, isOpen }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const pages = [
        {
            title: 'Welcome to Tower Defense!',
            content: 'This is a strategic tower-placement game where you defend against waves of enemies. Build towers to stop enemies before they reach the end of the path.',
        },
        {
            title: 'How to Play',
            content: 'Drag towers from the panel on the right and drop them onto the buildable ground (darker areas). Click a tower to select it, then click Sell to refund money or Upgrade to make it stronger.',
        },
        {
            title: 'Towers',
            content: 'Tower 1 (Red): Balanced general-purpose tower. Tower 2 (Green): Slows enemies. Tower 3 (Blue): Shoots all enemies at once. Unlock more towers by completing maps!',
        },
        {
            title: 'Enemies',
            content: 'Grunt (Red): Standard enemy. Runner (Yellow): Fast but weak. Heavy (Gray): Tanky and armored. Boss (Purple): Appears every 5 waves, scaled up each time.',
        },
        {
            title: 'Progression',
            content: 'Complete 5 waves on each map to unlock the next one. Complete waves to earn permanent tower upgrades. Upgrades increase damage, range, and fire rate for all towers of that type.',
        },
        {
            title: 'Tips',
            content: 'Keep an eye on your health. If you lose all lives, the game ends. Build towers near chokepoints (narrow paths) for maximum coverage. Upgrades are permanent—invest in your favorites!',
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
                <p className="tutorial-content">{page.content}</p>
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
