import React, { useRef, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from 'react-bootstrap/Button';

import Canvas from '../objects/Canvas';
import Draggable from '../objects/Draggable';
import { Enemy } from "../objects/enemy";
import { Block } from '../objects/block';
import { Tower } from '../objects/tower';
import { collision, convertToRoman } from '../utils/utils';
import { maps } from '../data/maps';
import { getPlayerName, saveHighScore, startGameSession } from '../utils/highscores';
import {
    getProgression, saveProgression, unlockTower, upgradeTowerPermanently,
    recordMapWaveCompletion, isMapUnlocked, getMapWavesCompleted,
    tutorialHasBeenShown, isTowerUnlocked, getTowerUpgradeLevel
} from '../utils/progression';
import useAudio from "../objects/Audio";
import { Checkbox } from "@mui/material";
import Audio1 from "../assets/audioClips/songformydeath.mp3";
import Timer from '../objects/timer';
import Popup from '../objects/Popup';
import PauseMenu from '../objects/PauseMenu';
import Tutorial from '../objects/Tutorial';


import circleImg from "../objects/circle.png";
const circle = new Image();
circle.src = circleImg;

export let towers = [];
export let bullets = [];
export let enemies = [];
export let grid = [];
export let selected = false;
let waveTimer = Date.now();
let bossSpawnedThisWave = false;


export const mouse = {
    x: -1,
    y: -1,
    width: .1,
    height: .1,
}

//Game Audio is off by default
function Radio() {
    const audio = useAudio(Audio1, { volume: 0.8, playbackRate: 1.2 });
    const [isChecked, setIsChecked] = React.useState(false);

    return (
        <div>
            <p className="audio">
                Toggle for audio{" "}
                <Checkbox
                    onChange={() => setIsChecked(!isChecked)}
                    className="audio-bttn"
                    onClick={() => {
                        isChecked ? audio.play() : audio.stop();
                    }}
                />
            </p>
        </div>
    );
}

const AudioFile = () => {
    //Audio();
    return <div>{Radio()}</div>;
};

window.addEventListener("keypress", function (e) {
    
});

const selectTower = () => {
    for (let b = 0; b < grid.length; b++) {
        if (mouse.x && mouse.y && collision(grid[b], mouse) && grid[b].tower) {
            selected = grid[b].tower;
            break;
        } else {
            selected = false;
        }
    }
}


const init = () => {
    towers = [];
    bullets = [];
    enemies = [];
    grid = [];
    selected = false;
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
    const buttonRef = useRef();
    const upgradeButtonRef = useRef();
    const scoreSavedRef = useRef(false);
    const sessionIdRef = useRef(null);
    let currentRef = buttonRef.current;

    if (gameState === 'start') {
        init();
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

    const draw = (ctx) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        grid.forEach(block => {
            block.draw(ctx);
            block.mouseIsOver(mouse);
            block.removeSoldTowers();
        });
        if (gameState === 'playing') {
            if (values.enemyTotal === 0 && values.wave > 0) {
                // Award rewards for completing the previous wave
                const prog = getProgression();
                let rewardsGranted = false;

                // Unlock towers at specific wave milestones
                if (values.wave === 5 && !isTowerUnlocked(2)) {
                    unlockTower(2);
                    setMessage('Tower 2 Unlocked!');
                    rewardsGranted = true;
                }
                if (values.wave === 10 && !isTowerUnlocked(3)) {
                    unlockTower(3);
                    setMessage('Tower 3 Unlocked!');
                    rewardsGranted = true;
                }
                if (values.wave === 15 && !isTowerUnlocked(4)) {
                    unlockTower(4);
                    setMessage('Tower 4 Unlocked!');
                    rewardsGranted = true;
                }

                // Grant tower upgrades every 3 waves
                if (values.wave % 3 === 0) {
                    const towerToUpgrade = (values.wave / 3) % 4 + 1; // Cycle through towers
                    if (upgradeTowerPermanently(towerToUpgrade)) {
                        setMessage(msg => msg || `Tower ${towerToUpgrade} Upgraded!`);
                        rewardsGranted = true;
                    }
                }

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
                const waitTime = values.enemySpawned === 0 ? 2000 : 900;
                if (time >= waveTimer + waitTime) {
                    let type = 1; // Grunt
                    if (values.wave > 3) {
                        type = Math.floor(Math.random() * 2) + 1; // Grunt or Runner
                    }
                    if (values.wave > 5 && Math.random() < 0.25) {
                        type = 4; // Armored - resists a flat chunk of every hit
                    }
                    enemies.push(new Enemy(map.waypoints[0].x - 60, map.waypoints[0].y, type));
                    let updatedSpawn = values.enemySpawned + 1;
                    setValues(previousState => { return { ...previousState, enemySpawned: updatedSpawn } });
                    waveTimer = time;
                }
            } else if (values.wave % 5 === 0 && !bossSpawnedThisWave) {
                // Last thing to arrive on a boss wave: one scaled-up boss.
                const time = Date.now();
                if (time >= waveTimer + 1500) {
                    const boss = new Enemy(map.waypoints[0].x - 60, map.waypoints[0].y, 5);
                    const bossTier = values.wave / 5;
                    boss.maxHealth *= bossTier;
                    boss.health = boss.maxHealth;
                    boss.value *= bossTier;
                    boss.score *= bossTier;
                    enemies.push(boss);
                    bossSpawnedThisWave = true;
                    setValues(previousState => { return { ...previousState, enemySpawned: previousState.enemySpawned + 1 } });
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
         if (selected) {
             selected.drawRange(ctx);
             if (currentRef) {
                 currentRef.style.display = 'Block';
             }
             if (upgradeButtonRef.current) {
                 upgradeButtonRef.current.style.display = selected.canUpgrade() ? 'Block' : 'None';
             }
         } else if (!selected) {
             if (currentRef) {
                 currentRef.style.display = 'None';
             }
             if (upgradeButtonRef.current) {
                 upgradeButtonRef.current.style.display = 'None';
             }
         }
        
        for (let b = 0; b < bullets.length; b++){
            bullets[b].draw(ctx);
            if (gameState === 'playing') {
                bullets[b].move();
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
                //enemies[e].hit(bullets);
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
                const upgradeLevel = getTowerUpgradeLevel(type);
                if (upgradeLevel > 0) {
                    tower.dmgMultiplier = 1 + 0.5 * upgradeLevel;
                    tower.range = tower.baseRange * (1 + 0.15 * upgradeLevel);
                    tower.fireRate = tower.baseFireRate * Math.max(0.3, 1 - 0.15 * upgradeLevel);
                }
                if (tower.price <= values.money) {
                    towers.push(tower);
                    block.tower = tower;
                    setValues(previousState => { return {...previousState, money: values.money - towers[towers.length - 1].price } });
                }
                else {
                    setMessage('Not enough money. U R PoOr LoL!');
                }
            }
        });
    }
    const sellTower = () => {
        if (selected) {
            let refund = selected.sell();
            let updatedMoney = values.money + refund;
            setValues(previousState => { return { ...previousState, money: updatedMoney } });
        }
    }
    const upgradeTower = () => {
        if (selected && selected.canUpgrade()) {
            const cost = selected.upgradeCost;
            if (cost <= values.money) {
                selected.upgrade();
                setValues(previousState => { return { ...previousState, money: previousState.money - cost } });
            } else {
                setMessage('Not enough money. U R PoOr LoL!');
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
            <AudioFile></AudioFile>
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
                    </div>
                    <div className='panel-mid'>
                        <div className='towers'>
                            <Draggable 
                                place={placeTower} 
                                type={1} 
                                state={gameState}
                                isUnlocked={isTowerUnlocked(1)}
                                cost={10}
                                upgradeLevel={getTowerUpgradeLevel(1)}
                                money={values.money}
                            />
                            <Draggable 
                                place={placeTower} 
                                type={2} 
                                state={gameState}
                                isUnlocked={isTowerUnlocked(2)}
                                cost={20}
                                upgradeLevel={getTowerUpgradeLevel(2)}
                                money={values.money}
                            />
                            <Draggable 
                                place={placeTower} 
                                type={3} 
                                state={gameState}
                                isUnlocked={isTowerUnlocked(3)}
                                cost={30}
                                upgradeLevel={getTowerUpgradeLevel(3)}
                                money={values.money}
                            />
                            <Draggable 
                                place={placeTower} 
                                type={4} 
                                state={gameState}
                                isUnlocked={isTowerUnlocked(4)}
                                cost={40}
                                upgradeLevel={getTowerUpgradeLevel(4)}
                                money={values.money}
                            />
                        </div>
                    </div>
                    <div className='panel-bottom'>
                        <div ref={ buttonRef } className='sellButton'>
                            <button className='sell' onClick={ sellTower }>Sell</button>
                        </div>
                        <div ref={ upgradeButtonRef } className='upgradeButton'>
                            <button className='upgrade' onClick={ upgradeTower }>
                                {selected ? `Upgrade ($${selected.upgradeCost})` : 'Upgrade'}
                            </button>
                        </div>
                        <div className='message'>
                            {message}
                        </div>
                        <div className='play-pause'>
                            {show ?
                                (<button className='play' onClick={function (e) { setGameState('playing'); setShow(!show) }}>Play</button>):
                                (<button className='pause' onClick={function (e) { setGameState('paused'); setShow(!show) }}>Pause</button>)}
                        </div>
                    </div>
                </div>
            </div>
            <Popup state={gameState} />
            <PauseMenu show={menuOpen} onResume={resumeFromMenu} />
            <div className="container game-footer">
                <Link to='/scores' >
                    <Button variant="outline-light" size="sm">Leaderboard</Button>
                </Link>
            </div>
        </div>
    );
}

export default GamePage;