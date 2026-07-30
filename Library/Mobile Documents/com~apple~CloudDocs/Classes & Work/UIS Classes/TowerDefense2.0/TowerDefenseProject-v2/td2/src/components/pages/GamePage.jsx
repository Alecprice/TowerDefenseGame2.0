import React, { useRef, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from 'react-bootstrap/Button';

import Canvas from '../objects/Canvas';
import Draggable from '../objects/Draggable';
import { Enemy } from "../objects/enemy";
import { Block } from '../objects/block';
import { Tower, TOWER_DEFS, TOWER_TYPES, CATEGORY } from '../objects/tower';
import { collision, convertToRoman } from '../utils/utils';
import { maps } from '../data/maps';
import { getPlayerName, saveHighScore, startGameSession } from '../utils/highscores';
import {
    unlockTower, recordMapWaveCompletion, isMapUnlocked, getMapWavesCompleted,
    tutorialHasBeenShown, isTowerUnlocked, TOWER_UNLOCK_WAVE
} from '../utils/progression';
import { startMapMusic, stopMusic, setMusicEnabled } from '../utils/music';
import { setSfxEnabled } from '../utils/sfx';
import Timer from '../objects/timer';
import Popup from '../objects/Popup';
import PauseMenu from '../objects/PauseMenu';
import Tutorial from '../objects/Tutorial';
import { gameSpeed } from '../utils/gameSpeed';
import { mapTheme } from '../utils/mapTheme';
import { playEnemyDeath, playBuyTower, playUnlockTower, playUiClick } from '../utils/sfx';


export let towers = [];
export let bullets = [];
export let enemies = [];
export let grid = [];
let waveTimer = Date.now();
let bossSpawnedThisWave = false;


export const mouse = {
    x: -1,
    y: -1,
    width: .1,
    height: .1,
}

// Sound is on by default. Actually starting the music still requires a
// real user gesture (browsers block autoplay) - see the Play button and
// toggleSound() below, both of which are real click handlers so they
// satisfy that requirement the first time either one fires.

window.addEventListener("keypress", function (e) {
    
});

const SPEED_STEPS = [0.5, 1, 2, 3, 5, 10];

const init = () => {
    towers = [];
    bullets = [];
    enemies = [];
    grid = [];
    waveTimer = Date.now();
    bossSpawnedThisWave = false;
}

const GamePage = (props) => {
    const [searchParams] = useSearchParams();
    const mapIndex = Math.min(maps.length - 1, Math.max(0, parseInt(searchParams.get('map'), 10) || 0));
    const map = maps[mapIndex];

    const [gameState, setGameState] = useState('start');
    const [show, setShow] = useState(true);
    const [message, setMessage] = useState('');
    const [showTutorial, setShowTutorial] = useState(!tutorialHasBeenShown());
    const [mapUnlocked, setMapUnlocked] = useState(isMapUnlocked(mapIndex));
    const [menuOpen, setMenuOpen] = useState(false);
    const wasPlayingRef = useRef(false);
    const [values, setValues] = useState({
        score: 0,
        money: 20,
        wave: 0,
        enemyTotal: 0,
        enemySpawned: 0,
        lives: 10
    });
    const [speedLabel, setSpeedLabel] = useState(1);
    const toggleSpeed = () => {
        const currentIndex = SPEED_STEPS.indexOf(speedLabel);
        const next = SPEED_STEPS[(currentIndex + 1) % SPEED_STEPS.length];
        gameSpeed.value = next;
        setSpeedLabel(next);
    }
    // One switch for all sound - sound effects and music both follow it,
    // rather than two separate controls a kid has to find and understand.
    const [soundOn, setSoundOn] = useState(true);
    const toggleSound = () => {
        const next = !soundOn;
        setSoundOn(next);
        setSfxEnabled(next);
        setMusicEnabled(next);
        if (next) {
            startMapMusic(mapIndex); // this click is a real user gesture, so autoplay is allowed
        } else {
            stopMusic();
        }
    }
    const scoreSavedRef = useRef(false);
    const sessionIdRef = useRef(null);
    const lastFrameTimeRef = useRef(Date.now());
    const bankAccumRef = useRef(0);

    // The actually-selected Tower instance (for drawing its range circle
    // and for the upgrade/sell actions). This lives in a ref, not state,
    // because it's read every animation frame by the game loop and doesn't
    // need to trigger a React re-render by itself.
    const selectedTowerRef = useRef(null);
    // What the modal displays. This IS React state - previously the modal
    // read a plain mutable variable directly in JSX, which React has no way
    // to know changed, so the popup could show stale info (wrong cost, wrong
    // level, upgrade button not yet visible) right after selecting a tower.
    const [modalInfo, setModalInfo] = useState(null);

    const buildModalInfo = (tower) => ({
        type: tower.type,
        level: tower.level,
        maxLevel: tower.maxLevel,
        upgradeCost: tower.upgradeCost,
        canUpgrade: tower.canUpgrade(),
        sellValue: tower.getSellValue(),
    });

    const selectTower = () => {
        let found = null;
        for (let b = 0; b < grid.length; b++) {
            if (mouse.x && mouse.y && collision(grid[b], mouse) && grid[b].tower) {
                found = grid[b].tower;
                break;
            }
        }
        selectedTowerRef.current = found;
        setModalInfo(found ? buildModalInfo(found) : null);
    }

    if (gameState === 'start') {
        init();
        mapTheme.value = map.theme || 'grass';
        scoreSavedRef.current = false;
        sessionIdRef.current = null;
        // Anchors a server-side clock for this round, used to sanity-check
        // the score/wave when it's submitted at the end (see highscores.js).
        startGameSession(map.name).then(id => { sessionIdRef.current = id; });
        for (let y = 0; y < 12; y++) {
            for (let x = 0; x < 18; x++) {
                grid.push(new Block(x * 50, y * 50, map.grid[y][x]));
            }
        }
        setGameState('paused');
    }

    useEffect(() => {
        if (gameState === 'end' && !scoreSavedRef.current) {
            scoreSavedRef.current = true;
            saveHighScore(sessionIdRef.current, getPlayerName(), values.score, values.wave, map.name);
        }
    }, [gameState, values.score, values.wave, map.name]);

    useEffect(() => {
        return () => stopMusic();
    }, []);

    const draw = (ctx) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        grid.forEach(block => {
            block.draw(ctx);
            block.mouseIsOver(mouse);
            block.removeSoldTowers();
        });
        if (gameState === 'playing') {
            if (values.enemyTotal === 0 && values.wave > 0) {
                // Unlock towers at specific wave milestones. Tower
                // *upgrades* are entirely separate now - they're bought
                // per-placed-tower with gold via the in-game popup (see
                // upgradeTower() below) and reset each round.
                Object.entries(TOWER_UNLOCK_WAVE).forEach(([towerTypeStr, unlockWave]) => {
                    const towerType = Number(towerTypeStr);
                    if (values.wave === unlockWave && !isTowerUnlocked(towerType)) {
                        unlockTower(towerType);
                        setMessage(`${TOWER_DEFS[towerType].name} Unlocked!`);
                        playUnlockTower();
                    }
                });

                // Record wave completion for map unlock progression
                recordMapWaveCompletion(mapIndex, values.wave);
            }

            if (values.enemyTotal === 0) {
                // A boss wave (every 5th) spawns the normal squad plus one boss at the end,
                // so enemyTotal needs +1 to account for it.
                const isBossWave = values.wave + 1 > 0 && (values.wave + 1) % 5 === 0;
                let updatedWave = values.wave + 1;
                bossSpawnedThisWave = false;
                setValues(previousState => {
                    return {
                        ...previousState,
                        wave: updatedWave,
                        enemyTotal: isBossWave ? updatedWave + 1 : updatedWave,
                        enemySpawned: 0
                    };
                });
                waveTimer = Date.now();
            } else if (values.enemySpawned < values.wave) {
                const time = Date.now();
                const waitTime = (values.enemySpawned === 0 ? 2000 : 900) / gameSpeed.value;
                if (time >= waveTimer + waitTime) {
                    const profile = map.enemyProfile || { armoredChance: 0.25, tankChance: 0.12, speedMult: 1, healthMult: 1 };
                    let type = 1; // Grunt
                    if (values.wave > 3) {
                        type = Math.floor(Math.random() * 2) + 1; // Grunt or Runner
                    }
                    if (values.wave > 5 && Math.random() < profile.armoredChance) {
                        type = 4; // Armored - resists a flat chunk of every hit
                    }
                    if (values.wave > 8 && Math.random() < profile.tankChance) {
                        type = 3; // Tank - high HP, high value/score
                    }
                    // +5% HP per wave past the first, so difficulty keeps
                    // climbing even on maps/waves where tower upgrades have
                    // made short work of the base enemy stats. Combined
                    // with the map's own healthMult for per-map flavor.
                    const waveScale = (1 + (values.wave - 1) * 0.05) * profile.healthMult;
                    const enemy = new Enemy(map.waypoints[0].x - 60, map.waypoints[0].y, type, waveScale);
                    enemy.speed *= profile.speedMult;
                    enemy.baseSpeed = enemy.speed;
                    enemies.push(enemy);
                    let updatedSpawn = values.enemySpawned + 1;
                    setValues(previousState => { return { ...previousState, enemySpawned: updatedSpawn } });
                    waveTimer = time;
                }
            } else if (values.wave % 5 === 0 && !bossSpawnedThisWave) {
                // Last thing to arrive on a boss wave: one scaled-up boss.
                const time = Date.now();
                if (time >= waveTimer + 1500 / gameSpeed.value) {
                    const profile = map.enemyProfile || { healthMult: 1 };
                    const boss = new Enemy(map.waypoints[0].x - 60, map.waypoints[0].y, 5);
                    const bossTier = values.wave / 5;
                    boss.maxHealth *= bossTier * profile.healthMult;
                    boss.health = boss.maxHealth;
                    boss.value *= bossTier;
                    boss.score *= bossTier;
                    enemies.push(boss);
                    bossSpawnedThisWave = true;
                    setValues(previousState => { return { ...previousState, enemySpawned: previousState.enemySpawned + 1 } });
                }
            }
        }
        
        const now = Date.now();
        const dt = Math.min(0.25, (now - lastFrameTimeRef.current) / 1000) * gameSpeed.value;
        lastFrameTimeRef.current = now;

        if (gameState === 'playing') {
            // Beacon (support) towers buff every other tower in their aura
            // range. Recomputed fresh every frame from scratch so removing
            // a Beacon (sold) immediately drops its bonus - nothing here
            // is permanently baked into another tower's stats.
            for (let t = 0; t < towers.length; t++) {
                towers[t].auraBonus = { range: 0, dmg: 0, fireRate: 0 };
            }
            for (let t = 0; t < towers.length; t++) {
                const beacon = towers[t];
                if (beacon.def.category !== CATEGORY.SUPPORT) continue;
                for (let o = 0; o < towers.length; o++) {
                    if (o === t) continue;
                    const other = towers[o];
                    if (other.def.category === CATEGORY.SUPPORT) continue;
                    const dx = beacon.mid.x - other.mid.x, dy = beacon.mid.y - other.mid.y;
                    if (dx * dx + dy * dy <= beacon.auraRange * beacon.auraRange) {
                        other.auraBonus.range += beacon.rangeBonus;
                        other.auraBonus.dmg += beacon.dmgBonus;
                        other.auraBonus.fireRate += beacon.fireRateBonus;
                    }
                }
            }

            // Bank towers passively generate gold. Accumulated as a
            // fraction and only flushed into React state once a whole
            // dollar has built up, so this doesn't trigger a re-render
            // every single frame.
            let incomePerSecond = 0;
            for (let t = 0; t < towers.length; t++) {
                if (towers[t].def.category === CATEGORY.BANK) incomePerSecond += towers[t].incomePerSecond;
            }
            if (incomePerSecond > 0) {
                bankAccumRef.current += incomePerSecond * dt;
                if (bankAccumRef.current >= 1) {
                    const whole = Math.floor(bankAccumRef.current);
                    bankAccumRef.current -= whole;
                    setValues(previousState => ({ ...previousState, money: previousState.money + whole }));
                }
            }
        }

        for (let t = 0; t < towers.length; t++) {
            towers[t].draw(ctx);
            if (gameState === 'playing') {
                let tower = towers[t];
                let enemiesInRange = enemies.filter(function (enemy) {
                    return tower.inRange(enemy);
                });
                //console.log(enemiesInRange);
                towers[t].shoot(bullets, enemiesInRange);
                if (towers[t].sold) {
                    towers.splice(t, 1);
                    t--;
                }
            }
        }
        if (selectedTowerRef.current) {
            selectedTowerRef.current.drawRange(ctx);
        }
        
        for (let b = 0; b < bullets.length; b++){
            bullets[b].draw(ctx);
            if (gameState === 'playing') {
                bullets[b].move(enemies);
                if (bullets[b].end) {
                    bullets.splice(b, 1);
                    b--;
                }
            }
        }
        for (let e = 0; e < enemies.length; e++) {
            enemies[e].draw(ctx);
            enemies[e].drawHealth(ctx);
            if (gameState === 'playing') {
                enemies[e].move(map.waypoints);
                enemies[e].tick(dt);
                if (enemies[e].end || enemies[e].dead) {
                    if (enemies[e].end) {
                        let updatedLives = values.lives - enemies[e].atk;
                        let updatedEnemyTotal = values.enemyTotal - 1;
                        setValues(previousState => { return { ...previousState, enemyTotal: updatedEnemyTotal, lives: updatedLives } });
                        //console.log(lives);
                    }
                    else if (enemies[e].dead) {
                        let updatedScore = values.score + enemies[e].score;
                        let updatedMoney = values.money + enemies[e].value;
                        let updatedEnemyTotal = values.enemyTotal - 1;
                        setValues(previousState => { return { ...previousState, score: updatedScore, money: updatedMoney, enemyTotal: updatedEnemyTotal } });
                        playEnemyDeath(enemies[e].type === 5);
                    }
                    //let updatedEnemyTotal = waves.enemyTotal - 1;
                    //setWaves({wave: waves.wave, enemyTotal: updatedEnemyTotal});
                    enemies.splice(e, 1);
                    e--;
                }
            }
        }
        if (values.lives <= 0) {
            setGameState('end');
        }

        if (gameState === 'paused') {
            waveTimer += (1000 / 144);
        }
    }
    const placeTower = (type) => {
        if (!isTowerUnlocked(type)) {
            setMessage('Tower locked! Complete maps to unlock.');
            return;
        }
        grid.forEach(block => {
            if (block.hover && block.type !== 1 && !block.tower) {
                let tower = new Tower(block.x, block.y, type);
                if (tower.price <= values.money) {
                    towers.push(tower);
                    block.tower = tower;
                    setValues(previousState => { return {...previousState, money: previousState.money - tower.price } });
                    playBuyTower();
                }
                else {
                    setMessage('Not enough gold yet - defeat more enemies to earn more!');
                }
            }
        });
    }
    const sellTower = () => {
        const tower = selectedTowerRef.current;
        if (tower) {
            playUiClick();
            const refund = tower.sell();
            setValues(previousState => { return { ...previousState, money: previousState.money + refund } });
            closeTowerModal();
        }
    }
    const closeTowerModal = () => {
        selectedTowerRef.current = null;
        setModalInfo(null);
    }
    const upgradeTower = () => {
        const tower = selectedTowerRef.current;
        if (tower && tower.canUpgrade()) {
            const cost = tower.upgradeCost;
            if (cost <= values.money) {
                tower.upgrade();
                setValues(previousState => { return { ...previousState, money: previousState.money - cost } });
                setModalInfo(buildModalInfo(tower));
            } else {
                setMessage('Not enough gold yet - defeat more enemies to earn more!');
            }
        }
    }
    const openMenu = () => {
        wasPlayingRef.current = gameState === 'playing';
        if (gameState === 'playing') {
            setGameState('paused');
            setShow(true);
        }
        setMenuOpen(true);
    }
    const resumeFromMenu = () => {
        setMenuOpen(false);
        if (wasPlayingRef.current) {
            setGameState('playing');
            setShow(false);
        }
    }
    const makeEvents = canvas => {
        let canvasRect = canvas.getBoundingClientRect();

        const updateMouseFromEvent = (e) => {
            const scaleX = canvas.width / canvasRect.width;
            const scaleY = canvas.height / canvasRect.height;
            mouse.x = (e.clientX - canvasRect.left) * scaleX;
            mouse.y = (e.clientY - canvasRect.top) * scaleY;
        }
        const handlePointerDown = (e) => {
            setMessage('');
            updateMouseFromEvent(e);
        }
        const handlePointerMove = (e) => {
            updateMouseFromEvent(e);
        }
        const changeBoundRect = () => {
            canvasRect = canvas.getBoundingClientRect();
        }

        window.addEventListener('pointerup', selectTower);
        window.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('resize', changeBoundRect);
        window.addEventListener('scroll', changeBoundRect);
        return () => {
            window.removeEventListener('pointerup', selectTower);
            window.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('resize', changeBoundRect);
            window.removeEventListener('scroll', changeBoundRect);
        }
    }

    // Check if this map is unlocked
    if (gameState === 'start' && !mapUnlocked) {
        const prevWavesNeeded = 5 - getMapWavesCompleted(mapIndex - 1);
        return (
            <div>
                <h1>Map Locked</h1>
                <p style={{textAlign: 'center', color: '#cfcfcf', fontSize: '18px', marginTop: '40px'}}>
                    Complete <strong>{prevWavesNeeded} more waves</strong> on &quot;{maps[mapIndex - 1].name}&quot; to unlock this map.
                </p>
                <div className="container">
                    <Link to="/">
                        <Button variant="outline-light">Back to Maps</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Tutorial isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
            <h1 className="game-title">{map.name}</h1>
            <div className="waves-scores-wrapper">
                <div className="wave-label">Wave: {convertToRoman(values.wave)} : [{values.wave}]</div>
                <div className="score-label">Score: {values.score}</div>
                <Timer state={gameState}/>
            </div>
            <div className="game">
                <Canvas draw={draw} events={makeEvents} width='900' height='600' />
                <div className="panel">
                    <div className='panel-top'>
                        <div className='money'>
                            ${values.money}
                        </div>
                        <div className='lives'>
                            Lives: {values.lives}
                        </div>
                        <button className='menu' onClick={openMenu}>Menu</button>
                        <button className='sound-toggle' onClick={() => { playUiClick(); toggleSound(); }}>
                            {soundOn ? '🔊 Sound' : '🔈 Sound'}
                        </button>
                    </div>
                    <div className='panel-mid'>
                        <div className='towers'>
                            {TOWER_TYPES.map(type => (
                                <Draggable
                                    key={type}
                                    place={placeTower}
                                    type={type}
                                    state={gameState}
                                    isUnlocked={isTowerUnlocked(type)}
                                    cost={TOWER_DEFS[type].levels[0].price}
                                    money={values.money}
                                />
                            ))}
                        </div>
                    </div>
                    {modalInfo && (
                        <div className='tower-modal-backdrop' onClick={closeTowerModal}>
                            <div className='tower-modal-card' onClick={e => e.stopPropagation()}>
                                <button className='tower-modal-close' onClick={() => { playUiClick(); closeTowerModal(); }} aria-label="Close">×</button>
                                <div className='tower-modal-title'>{TOWER_DEFS[modalInfo.type]?.name || 'Tower'}</div>
                                <div className='tower-modal-level'>
                                    {modalInfo.canUpgrade
                                        ? `Level ${modalInfo.level} / ${modalInfo.maxLevel}`
                                        : `Level ${modalInfo.level} / ${modalInfo.maxLevel} (Max)`}
                                </div>
                                <div className='tower-modal-actions'>
                                    {modalInfo.canUpgrade && (
                                        <div className='upgradeButton'>
                                            <button className='upgrade' onClick={upgradeTower}>
                                                {`Upgrade ($${modalInfo.upgradeCost})`}
                                            </button>
                                        </div>
                                    )}
                                    <button className='sell' onClick={sellTower}>
                                        {`Sell ($${modalInfo.sellValue})`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className='panel-bottom'>
                        <div className='message'>
                            {message}
                        </div>
                        <div className='play-pause'>
                            {show ?
                                (<button className='play' onClick={function (e) { playUiClick(); setGameState('playing'); setShow(!show); if (soundOn) startMapMusic(mapIndex); }}>Play</button>):
                                (<button className='pause' onClick={function (e) { playUiClick(); setGameState('paused'); setShow(!show) }}>Pause</button>)}
                            <button className='speed' onClick={() => { playUiClick(); toggleSpeed(); }}>{speedLabel}x Speed</button>
                        </div>
                    </div>
                </div>
            </div>
            <Popup state={gameState} />
            <PauseMenu show={menuOpen} onResume={resumeFromMenu} />
        </div>
    );
}

export default GamePage;