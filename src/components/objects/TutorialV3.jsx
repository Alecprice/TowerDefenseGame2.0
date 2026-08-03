import React, { useState } from 'react';
import { Checkbox } from '@mui/material';
import { markTutorialAsShownV3 } from '../utils/progressionV3';

const TutorialV3 = ({ onClose, isOpen }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const pages = [
        {
            title: 'Welcome to Tower Defense 3.0!',
            content: 'Same idea as the original: enemies march down the path, you build towers to stop them before they reach the end. What\u2019s different here is the economy and the roster - this page and the next few cover exactly that.',
        },
        {
            title: 'Two Currencies, Not One',
            items: [
                'Money ($): earned by defeating enemies, and from your Gold Mine towers. Money is what you spend to PLACE new towers.',
                'Crystals (💎): earned only from Crystal Forge towers. Crystals are what you spend to UPGRADE towers you\u2019ve already built.',
                'Placing towers never costs Crystals, and upgrading never costs Money - the two are completely separate budgets.',
            ],
        },
        {
            title: 'Build Both Resource Towers Early',
            content: 'Without a Gold Mine, you can\u2019t afford new towers. Without a Crystal Forge, you can never upgrade the towers you already have - they\u2019ll fall behind as waves get tougher. A run with only one resource tower will stall out, so get both going early rather than pouring everything into attack towers first.',
        },
        {
            title: '15 Attack Towers - Each Does Something Different',
            content: 'These aren\u2019t just different numbers on the same idea - every one has its own trick:',
            items: [
                'Vanguard, Longshot, Cluster Charge, Rapid Vents, Mortar: the fundamentals - balanced, sniper, area damage, rapid fire, and splash.',
                'Venom Lance / Cryo Spike: poison over time / slows enemies down.',
                'Executioner: finishes off enemies already low on health - weak against full-health targets on its own.',
                'Chain Bolt: its hit arcs to a second nearby enemy.',
                'Armor Breaker: permanently wears down a target\u2019s armor for every other tower shooting it.',
                'Siege Cannon: bonus damage against big, tanky enemies.',
                'Rapid Pierce: shots continue through enemies standing in a line.',
                'Volatile Core: a chance for a bonus-damage mini-explosion on hit.',
                'Shield Breaker: bonus damage specifically against Shielded enemies.',
                'Farseer Spire: can hit any enemy anywhere on the map, no matter the range.',
            ],
        },
        {
            title: 'Support Towers: 4 Buffs, 1 Debuff',
            content: 'None of these five ever attack directly - they only affect what\u2019s around them:',
            items: [
                'Beacon: a little of everything for nearby towers - range, damage, and fire rate.',
                'Sharpshooter Nest / Ammo Depot / Overclock Rig: a big boost to just range / just damage / just fire rate.',
                'Blight Totem: the one debuff tower - instead of buffing your towers, it continuously slows every enemy in its aura. Zero damage, but it buys your attack towers more time on every target nearby.',
            ],
        },
        {
            title: 'Meet the New Enemies',
            items: [
                'Regenerator: heals itself back up if you don\u2019t keep hitting it - burst damage or sustained fire works, one poke and walking away doesn\u2019t.',
                'Juggernaut: shrugs off a big chunk of splash damage - keep at least one single-target or Rapid Pierce tower around so AOE isn\u2019t your only answer.',
                'All the original enemies (Grunt, Runner, Tank, Armored, Flyer, Teleporter, Shielded, Splitter, Boss) still show up too.',
            ],
        },
        {
            title: 'You\u2019ve Got This!',
            content: 'Start with a Vanguard or two, a Gold Mine, and a Crystal Forge as soon as you can afford it. Everything else - the specialists, the support towers, the harder enemies - unlocks gradually as you play. Have fun building!',
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
            markTutorialAsShownV3();
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

export default TutorialV3;
