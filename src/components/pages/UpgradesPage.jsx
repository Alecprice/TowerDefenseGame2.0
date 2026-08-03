import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import {
    getMeta, META_UPGRADES, getUpgradeLevel, getUpgradeCost, purchaseUpgrade,
    PALETTES, purchasePalette, selectPalette,
} from '../utils/metaProgression';
import { playUiClick, playBuyTower } from '../utils/sfx';

// Endless mode's meta-progression shop. Cores are earned at the end of
// every run (see metaProgression.js / GamePage's game-over handling) and
// spent here on small permanent bonuses that apply to every future run,
// on any map. This is separate from in-round tower upgrades, which are
// gold-bought, per-tower, and reset every game.
const UpgradesPage = () => {
    const [meta, setMeta] = useState(getMeta());

    const buy = (key) => {
        const result = purchaseUpgrade(key);
        if (result.success) {
            playBuyTower();
            setMeta(result.meta);
        } else {
            playUiClick();
        }
    };

    const buyPalette = (id) => {
        const result = purchasePalette(id);
        if (result.success) {
            playBuyTower();
            setMeta(result.meta);
        } else {
            playUiClick();
        }
    };

    const choosePalette = (id) => {
        const result = selectPalette(id);
        if (result.success) {
            playUiClick();
            setMeta(result.meta);
        }
    };

    return (
        <div>
            <h1>Endless<br />Upgrades</h1>
            <p className="scores-note">
                Permanent bonuses, bought with Cores earned from any run. They apply everywhere, every map.
            </p>
            <div className="container">
                <div className="cores-balance">Cores: {meta.cores}</div>
                {meta.bestWave > 0 && (
                    <div className="cores-best-wave">Best wave reached: {meta.bestWave}</div>
                )}
            </div>
            <div className="upgrades-grid">
                {Object.entries(META_UPGRADES).map(([key, def]) => {
                    const level = getUpgradeLevel(key);
                    const cost = getUpgradeCost(key);
                    const maxed = cost === null;
                    const affordable = !maxed && meta.cores >= cost;
                    return (
                        <div className={`upgrade-card${maxed ? ' maxed' : ''}`} key={key}>
                            <div className="upgrade-name">{def.name}</div>
                            <div className="upgrade-desc">{def.desc}</div>
                            <div className="upgrade-level">Level {level} / {def.max}</div>
                            <button
                                className="upgrade-buy"
                                disabled={maxed || !affordable}
                                onClick={() => buy(key)}
                            >
                                {maxed ? 'Maxed' : `Buy (${cost} Cores)`}
                            </button>
                        </div>
                    );
                })}
            </div>
            <h2 className="upgrades-subheading">Tower Palettes</h2>
            <p className="scores-note">
                Cosmetic only - every tower keeps its shape and stats, just re-skinned. One-time purchase per palette, applies to every map.
            </p>
            <div className="upgrades-grid palettes-grid">
                {Object.entries(PALETTES).map(([id, def]) => {
                    const owned = meta.unlockedPalettes.includes(id);
                    const active = meta.activePalette === id;
                    const affordable = meta.cores >= def.cost;
                    return (
                        <div className={`upgrade-card palette-card${active ? ' active' : ''}`} key={id}>
                            <div
                                className="palette-swatch"
                                style={{ filter: `hue-rotate(${def.hueShift}deg)` }}
                            />
                            <div className="upgrade-name">{def.name}</div>
                            {owned ? (
                                <button
                                    className="upgrade-buy"
                                    disabled={active}
                                    onClick={() => choosePalette(id)}
                                >
                                    {active ? 'Equipped' : 'Equip'}
                                </button>
                            ) : (
                                <button
                                    className="upgrade-buy"
                                    disabled={!affordable}
                                    onClick={() => buyPalette(id)}
                                >
                                    {`Unlock (${def.cost} Cores)`}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="container">
                <Link to='/play' onClick={playUiClick}>
                    <Button className='sbtn' variant="outline-light">Play a Map</Button>
                </Link>
            </div>
            <div className="container">
                <Link to='/' onClick={playUiClick}>
                    <Button variant="outline-light">Home</Button>
                </Link>
            </div>
        </div>
    );
};

export default UpgradesPage;
