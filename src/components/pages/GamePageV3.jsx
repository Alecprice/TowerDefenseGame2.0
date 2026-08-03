import React, { useRef, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from 'react-bootstrap/Button';

import Canvas from '../objects/Canvas';
import Draggable, { dragState } from '../objects/Draggable';
import { Enemy } from "../objects/enemy";
import { Block } from '../objects/block';
import { Tower, CATEGORY, META as TOWER_META, COSMETIC } from '../objects/tower';
import { TOWER_DEFS_V3, TOWER_TYPES_V3 } from '../objects/towerDefsV3';
import { collision, convertToRoman } from '../utils/utils';
import { maps } from '../data/maps';
import { getPlayerName, saveHighScore, startGameSession } from '../utils/highscores';
import {
    unlockTowerV3 as unlockTower, recordMapWaveCompletionV3 as recordMapWaveCompletion,
    isMapUnlockedV3 as isMapUnlocked, getMapWavesCompletedV3 as getMapWavesCompleted,
    isTowerUnlockedV3 as isTowerUnlocked, TOWER_UNLOCK_WAVE_V3 as TOWER_UNLOCK_WAVE,
    tutorialHasBeenShownV3
} from '../utils/progressionV3';
import { getMetaBonuses, awardRunCores } from '../utils/metaProgression';
import { getDifficulty } from '../utils/difficulty';
import { recordStat } from '../utils/achievements';
import { drawDamageNumbers, resetDamageNumbers } from '../utils/damageNumbers';
import { spawnBurst, updateAndDrawParticles, resetParticles } from '../utils/particles';
import { resetRunStats, recordTowerPlaced, snapshotRunStats } from '../utils/runStats';
import { startMapMusic, stopMusic, setMusicEnabled } from '../utils/music';
import { setSfxEnabled } from '../utils/sfx';
import Timer from '../objects/timer';
import Popup from '../objects/Popup';
import PauseMenu from '../objects/PauseMenu';
import TutorialV3 from '../objects/TutorialV3';
import { gameSpeed } from '../utils/gameSpeed';
import { mapTheme } from '../utils/mapTheme';
import { playEnemyDeath, playBuyTower, playUnlockTower, playUiClick, playShieldBlock, playSplitterPop, playWaveCleared } from '../utils/sfx';

// Game 3.0's own tower/type aliases so the rest of this file (copied
// from GamePage.jsx and adapted) can keep using the same variable names
// as the original while actually pointing at the V3 roster.
const TOWER_DEFS = TOWER_DEFS_V3;
const TOWER_TYPES = TOWER_TYPES_V3;


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

// Pure function of the wave number - mirrors the spawn-chance gates in
// the draw() loop below (values.wave > N thresholds), so the preview
// strip always describes what's actually possible next, not a
// hand-maintained duplicate list that could drift out of sync.
function buildUpcomingBadges(nextWave) {
    const badges = [{ label: 'Grunt', className: 'badge-grunt' }];
    if (nextWave > 3) badges.push({ label: 'Runner', className: 'badge-runner' });
    if (nextWave > 5) badges.push({ label: 'Armored', className: 'badge-armored' });
    if (nextWave > 8) badges.push({ label: 'Tank', className: 'badge-tank' });
    if (nextWave > 18) badges.push({ label: 'Flyer', className: 'badge-flyer' });
    if (nextWave > 22) badges.push({ label: 'Teleporter', className: 'badge-teleporter' });
    if (nextWave > 0 && nextWave % 5 === 0) badges.push({ label: '⚠ BOSS', className: 'badge-boss' });
    return badges;
}

const GamePage = (props) => {
    const [searchParams] = useSearchParams();
    const mapIndex = Math.min(maps.length - 1, Math.max(0, parseInt(searchParams.get('map'), 10) || 0));
    const map = maps[mapIndex];
    const difficulty = getDifficulty(searchParams.get('difficulty'));

    const [gameState, setGameState] = useState('start');
    const [show, setShow] = useState(true);
    const [message, setMessage] = useState('');
    const [showTutorial, setShowTutorial] = useState(!tutorialHasBeenShownV3());
    const [mapUnlocked, setMapUnlocked] = useState(isMapUnlocked(mapIndex));
    const [menuOpen, setMenuOpen] = useState(false);
    const wasPlayingRef = useRef(false);
    const metaBonuses = useRef(getMetaBonuses()).current;
    const [values, setValues] = useState({
        score: 0,
        money: Math.round((20 + metaBonuses.startGoldBonus) * difficulty.startMoneyMult),
        crystals: 0,
        wave: 0,
        enemyTotal: 0,
        enemySpawned: 0,
        lives: 10 + metaBonuses.startLivesBonus
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
    const coresAwardedRef = useRef(false);
    const achievementsRecordedRef = useRef(false);
    const runLabelRef = useRef(map.name);
    const [coresEarned, setCoresEarned] = useState(0);
    const [runSummary, setRunSummary] = useState(null);
    const sessionIdRef = useRef(null);
    const lastFrameTimeRef = useRef(Date.now());
    const bankAccumRef = useRef(0);
    const crystalAccumRef = useRef(0);
    // Achievement tracking for this run - see the game-over effect below,
    // where these get folded into the persistent lifetime stats in
    // achievements.js. Plain refs, not state: none of this needs to
    // trigger a re-render mid-run, only gets read once at game-over.
    const noLivesLostRef = useRef(true);
    const flawlessCountedRef = useRef(false);
    const maxSupportOnBoardRef = useRef(0);
    // Direct DOM refs for the boss HP bar - updated straight from the
    // draw loop (every animation frame) rather than through React state,
    // same reasoning as the tower range-circle preview: a boss's health
    // changes far too often for a state-triggered re-render per hit.
    const bossBarWrapRef = useRef(null);
    const bossBarFillRef = useRef(null);
    // Screen shake on boss death: a short-lived offset applied to the
    // whole canvas draw via ctx.translate() at the top of draw() and
    // undone at the end - see the shake block there.
    const shakeUntilRef = useRef(0);
    const shakeMagnitudeRef = useRef(0);
    // Wave-cleared banner: a plain DOM ref toggled directly (not React
    // state) so re-triggering its CSS animation on the very next wave
    // doesn't need a render cycle to restart.
    const waveBannerRef = useRef(null);

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
        coresAwardedRef.current = false;
        achievementsRecordedRef.current = false;
        setRunSummary(null);
        sessionIdRef.current = null;
        TOWER_META.dmgMult = metaBonuses.dmgMult;
        TOWER_META.fireRateMult = metaBonuses.fireRateMult;
        TOWER_META.bankMult = metaBonuses.bankMult;
        COSMETIC.hueShift = metaBonuses.paletteHueShift;
        noLivesLostRef.current = true;
        flawlessCountedRef.current = false;
        maxSupportOnBoardRef.current = 0;
        resetDamageNumbers();
        resetParticles();
        resetRunStats();
        shakeUntilRef.current = 0;
        const runLabel = difficulty.key === 'easy' ? map.name : `${map.name} (${difficulty.name})`;
        runLabelRef.current = runLabel;
        // Anchors a server-side clock for this round, used to sanity-check
        // the score/wave when it's submitted at the end (see highscores.js).
        // Difficulty is threaded through as a suffix on the map name sent
        // to Supabase, rather than a schema change - session creation and
        // score submission both use this same string, so submit-score's
        // "map mismatch" check still lines up.
        startGameSession(runLabel, 'v3').then(id => { sessionIdRef.current = id; });
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
            saveHighScore(sessionIdRef.current, getPlayerName(), values.score, values.wave, runLabelRef.current, 'v3');
        }
        if (gameState === 'end' && !coresAwardedRef.current) {
            coresAwardedRef.current = true;
            setCoresEarned(awardRunCores(values.wave, values.score));
        }
        if (gameState === 'end' && !achievementsRecordedRef.current) {
            achievementsRecordedRef.current = true;
            setRunSummary(snapshotRunStats());
            recordStat('bestWaveAnyMap', values.wave, 'max');
            recordStat('maxSupportTowersAtOnce', maxSupportOnBoardRef.current, 'max');
            if (difficulty.key === 'challenge') {
                recordStat('challengeBestWave', values.wave, 'max');
            }
            // "Architect" (towersUnlocked achievement) is calibrated to
            // the original game's 15-tower roster - Game 3.0 has 22, so
            // recording progress against it here would let it fire
            // early/inconsistently. Deliberately not recorded from this
            // page. mapsUnlocked is fine to keep sharing: both rulesets
            // draw from the same 50-map pool, so "50 unlocked" means the
            // same thing either way.
            const mapsUnlockedCount = maps.filter((_, i) => isMapUnlocked(i)).length;
            recordStat('mapsUnlocked', mapsUnlockedCount, 'max');
        }
    }, [gameState, values.score, values.wave, map.name, difficulty.key]);

    useEffect(() => {
        return () => stopMusic();
    }, []);

    const draw = (ctx) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        ctx.save();
        if (Date.now() < shakeUntilRef.current) {
            const remaining = (shakeUntilRef.current - Date.now()) / 400; // fades out with the 400ms duration used below
            const mag = shakeMagnitudeRef.current * Math.max(0, remaining);
            ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
        }
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
                if (values.wave > 0) {
                    // values.wave is the wave that just finished (0 means
                    // this is the very first wave starting, not a real
                    // clear) - bannerRef is a plain DOM toggle so the
                    // animation restarts cleanly even back-to-back.
                    playWaveCleared();
                    if (waveBannerRef.current) {
                        waveBannerRef.current.textContent = `Wave ${values.wave} Cleared!`;
                        waveBannerRef.current.classList.remove('wave-banner-show');
                        void waveBannerRef.current.offsetWidth; // restart the CSS animation
                        waveBannerRef.current.classList.add('wave-banner-show');
                    }
                }
                if (updatedWave === 6 && noLivesLostRef.current && !flawlessCountedRef.current) {
                    // Wave 5 just finished (we're about to start wave 6)
                    // with no life lost yet this run - count it once.
                    flawlessCountedRef.current = true;
                    recordStat('flawlessFiveWaveRuns', 1, 'add');
                }
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
                    if (values.wave > 5 && Math.random() < Math.min(0.9, profile.armoredChance * difficulty.mult)) {
                        type = 4; // Armored - resists a flat chunk of every hit
                    }
                    if (values.wave > 8 && Math.random() < Math.min(0.9, profile.tankChance * difficulty.mult)) {
                        type = 3; // Tank - high HP, high value/score
                    }
                    if (values.wave > 18 && Math.random() < Math.min(0.3, 0.10 * difficulty.mult)) {
                        type = 6; // Flyer - immune to Frost Tower's slow entirely
                    }
                    if (values.wave > 22 && Math.random() < Math.min(0.25, 0.08 * difficulty.mult)) {
                        type = 7; // Teleporter - periodically blinks forward along the path
                    }
                    if (values.wave > 13 && Math.random() < Math.min(0.3, 0.12 * difficulty.mult)) {
                        type = 8; // Regenerator - heals back up unless kept under fire
                    }
                    if (values.wave > 20 && Math.random() < Math.min(0.25, 0.09 * difficulty.mult)) {
                        type = 9; // Juggernaut - resists splash damage
                    }
                    // +5% HP per wave past the first, so difficulty keeps
                    // climbing even on maps/waves where tower upgrades have
                    // made short work of the base enemy stats. Combined
                    // with the map's own healthMult for per-map flavor, and
                    // the selected difficulty tier's multiplier on top.
                    const waveScale = (1 + (values.wave - 1) * 0.05) * profile.healthMult * difficulty.mult;
                    const enemy = new Enemy(map.waypoints[0].x - 60, map.waypoints[0].y, type, waveScale, difficulty.mult);
                    enemy.speed *= profile.speedMult;
                    enemy.baseSpeed = enemy.speed;
                    // Two more late-game spawn mechanics, layered on top of
                    // armored/tank the same way those are: gated behind a
                    // wave threshold, chance scaled (and capped) by the
                    // difficulty multiplier.
                    if (values.wave > 10 && Math.random() < Math.min(0.5, 0.10 * difficulty.mult)) {
                        // Shielded: absorbs the next chunk of damage before
                        // any of it touches real health - see Enemy.hit().
                        enemy.shieldHP = Math.round(enemy.maxHealth * 0.35);
                    }
                    if (values.wave > 14 && Math.random() < Math.min(0.35, 0.08 * difficulty.mult)) {
                        // Splitter: on death (not on reaching the end),
                        // breaks into two weaker Grunts instead of just
                        // disappearing - see the death-handling block below.
                        enemy.splitter = true;
                    }
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
                    const boss = new Enemy(map.waypoints[0].x - 60, map.waypoints[0].y, 5, 1, difficulty.mult);
                    const bossTier = values.wave / 5;
                    boss.maxHealth *= bossTier * profile.healthMult * difficulty.mult;
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
                // Blight Totem is a debuff support (see below, after this
                // loop) rather than a buff one - it has no
                // rangeBonus/dmgBonus/fireRateBonus fields at all, so it
                // has to be skipped here or it'd add `undefined` into
                // every nearby tower's auraBonus and NaN the whole thing.
                if (beacon.rangeBonus === undefined) continue;
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

            // Blight Totem: the debuff counterpart to the buff loop above.
            // Deals zero damage itself - it just keeps re-applying
            // applySlow() to every enemy in range, every frame. Since
            // applySlow() already just refreshes a 1.5s timer (see
            // enemy.js), an enemy that walks out of range simply stops
            // getting refreshed and the slow wears off naturally a
            // moment later - no separate "remove debuff" bookkeeping
            // needed here.
            for (let t = 0; t < towers.length; t++) {
                const totem = towers[t];
                if (totem.def.category !== CATEGORY.SUPPORT || totem.slowFloor === undefined) continue;
                for (let e = 0; e < enemies.length; e++) {
                    const enemy = enemies[e];
                    const dx = totem.mid.x - enemy.mid.x, dy = totem.mid.y - enemy.mid.y;
                    if (dx * dx + dy * dy <= totem.auraRange * totem.auraRange) {
                        enemy.applySlow(totem.slowFloor);
                    }
                }
            }

            // Support Squad achievement tracking - just a running max of
            // how many support towers were on the board at once.
            const supportCount = towers.reduce((n, t) => n + (t.def.category === CATEGORY.SUPPORT ? 1 : 0), 0);
            if (supportCount > maxSupportOnBoardRef.current) maxSupportOnBoardRef.current = supportCount;

            // Gold Mine generates Money; Crystal Forge generates Crystals -
            // two separate currencies, two separate towers, two separate
            // accumulators (see bankAccumRef/crystalAccumRef above).
            // Money buys new towers; Crystals is what upgrading any tower
            // costs (see upgradeTower() below) - the whole point of the
            // dual-currency economy is that neither resource alone is
            // enough to both expand and strengthen your board.
            let incomePerSecond = 0;
            let crystalsPerSecond = 0;
            for (let t = 0; t < towers.length; t++) {
                if (towers[t].def.category === CATEGORY.BANK) incomePerSecond += towers[t].effectiveIncome();
                if (towers[t].def.category === CATEGORY.CRYSTAL) crystalsPerSecond += towers[t].effectiveIncome();
            }
            if (incomePerSecond > 0) {
                bankAccumRef.current += incomePerSecond * dt;
            }
            if (crystalsPerSecond > 0) {
                crystalAccumRef.current += crystalsPerSecond * dt;
            }
            if (bankAccumRef.current >= 1 || crystalAccumRef.current >= 1) {
                const wholeMoney = Math.floor(bankAccumRef.current);
                const wholeCrystals = Math.floor(crystalAccumRef.current);
                bankAccumRef.current -= wholeMoney;
                crystalAccumRef.current -= wholeCrystals;
                setValues(previousState => ({
                    ...previousState,
                    money: previousState.money + wholeMoney,
                    crystals: previousState.crystals + wholeCrystals,
                }));
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
        if (dragState.active && dragState.type && gameState === 'playing') {
            const hoveredBlock = grid.find(b => b.hover);
            if (hoveredBlock && hoveredBlock.type !== 1 && !hoveredBlock.tower) {
                const def = TOWER_DEFS[dragState.type];
                const lvl = def.levels[0];
                const previewRange = def.category === CATEGORY.SUPPORT ? lvl.auraRange : (lvl.range || 0);
                const cx = hoveredBlock.x + 25, cy = hoveredBlock.y + 25;
                ctx.save();
                if (def.global || previewRange > 1000) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
                    ctx.setLineDash([8, 6]);
                    ctx.lineWidth = 2;
                    ctx.strokeRect(4, 4, ctx.canvas.width - 8, ctx.canvas.height - 8);
                } else {
                    ctx.beginPath();
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
                    ctx.arc(cx, cy, previewRange, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
                ctx.restore();
            }
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
                        noLivesLostRef.current = false;
                        setValues(previousState => { return { ...previousState, enemyTotal: updatedEnemyTotal, lives: updatedLives } });
                        //console.log(lives);
                    }
                    else if (enemies[e].dead) {
                        let updatedScore = values.score + enemies[e].score;
                        let updatedMoney = values.money + enemies[e].value;
                        let updatedEnemyTotal = values.enemyTotal - 1;
                        if (enemies[e].type === 5) {
                            recordStat('bossKills', 1, 'add');
                            shakeUntilRef.current = Date.now() + 400;
                            shakeMagnitudeRef.current = 10;
                            spawnBurst(enemies[e].mid.x, enemies[e].mid.y, { count: 32, color: '#ff595e', speed: 6.5, life: 800 });
                        }
                        if (enemies[e].isSplitChild) {
                            recordStat('splitKills', 1, 'add');
                        }
                        if (enemies[e].splitter) {
                            playSplitterPop();
                            spawnBurst(enemies[e].mid.x, enemies[e].mid.y, { count: 10, color: '#a78bfa', speed: 3, life: 400 });
                            // Break into two weaker Grunts continuing from
                            // the same point on the path, instead of just
                            // disappearing. They're marked isSplitChild
                            // (for the achievement above) and NOT
                            // themselves splitters, so this can't chain.
                            const parent = enemies[e];
                            for (let s = 0; s < 2; s++) {
                                const child = new Enemy(parent.x + (s === 0 ? -10 : 10), parent.y, 1, 1, difficulty.mult);
                                child.maxHealth = Math.max(1, Math.round(parent.maxHealth * 0.32));
                                child.health = child.maxHealth;
                                child.value = Math.max(1, Math.round(parent.value * 0.4));
                                child.score = Math.max(1, Math.round(parent.score * 0.4));
                                child.waypoint = parent.waypoint;
                                child.distance = parent.distance;
                                child.speed = parent.speed;
                                child.baseSpeed = parent.baseSpeed;
                                child.mid = { x: child.x + child.width / 2, y: child.y + child.height / 2 };
                                child.isSplitChild = true;
                                enemies.push(child);
                            }
                            // Parent is -1'd below along with every other
                            // death; the 2 children need to be added back
                            // in so the wave-complete check (enemyTotal
                            // hitting 0) still waits for them too.
                            updatedEnemyTotal += 2;
                        }
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

        // Boss HP bar: updated straight through refs every frame (see
        // the comment by bossBarWrapRef's declaration) rather than
        // through React state.
        if (bossBarWrapRef.current) {
            const boss = enemies.find(en => en.type === 5);
            if (boss && gameState === 'playing') {
                bossBarWrapRef.current.style.display = 'flex';
                if (bossBarFillRef.current) {
                    const pct = Math.max(0, Math.min(1, boss.health / boss.maxHealth)) * 100;
                    bossBarFillRef.current.style.width = `${pct}%`;
                }
            } else {
                bossBarWrapRef.current.style.display = 'none';
            }
        }

        drawDamageNumbers(ctx);
        updateAndDrawParticles(ctx);
        ctx.restore();

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
                let tower = new Tower(block.x, block.y, type, TOWER_DEFS);
                if (tower.price <= values.money) {
                    towers.push(tower);
                    block.tower = tower;
                    setValues(previousState => { return {...previousState, money: previousState.money - tower.price } });
                    playBuyTower();
                    recordTowerPlaced(type);
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
            const refund = Math.round(tower.sell() * difficulty.refundMult);
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
            if (cost <= values.crystals) {
                tower.upgrade();
                setValues(previousState => { return { ...previousState, crystals: previousState.crystals - cost } });
                setModalInfo(buildModalInfo(tower));
                recordStat('goldSpentUpgrading', cost, 'add');
            } else {
                setMessage('Not enough Crystals yet - build a Crystal Forge, or defeat more enemies!');
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
        <div className="game-screen">
            <TutorialV3 isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
            <h1 className="game-title">{map.name}</h1>
            <p className="rotate-hint">
                <span className="rotate-hint__icon" aria-hidden="true">📱</span>
                Turn your phone sideways for a full-screen view
            </p>
            <div className="waves-scores-wrapper">
                <div className="wave-label">Wave: {convertToRoman(values.wave)} : [{values.wave}]</div>
                <div className="score-label">Score: {values.score}</div>
                {difficulty.key !== 'easy' && (
                    <div className={`difficulty-label difficulty-${difficulty.key}`}>{difficulty.name}</div>
                )}
                <Timer state={gameState}/>
            </div>
            {gameState === 'playing' && (
                <div className="next-wave-strip">
                    <span className="next-wave-label">Next:</span>
                    {buildUpcomingBadges(values.wave + 1).map(b => (
                        <span key={b.label} className={`next-wave-badge ${b.className}`}>{b.label}</span>
                    ))}
                </div>
            )}
            <div className="boss-bar-wrap" ref={bossBarWrapRef} style={{ display: 'none' }}>
                <div className="boss-bar-label">⚠ BOSS</div>
                <div className="boss-bar-track">
                    <div className="boss-bar-fill" ref={bossBarFillRef}></div>
                </div>
            </div>
            <div className="game">
                <Canvas draw={draw} events={makeEvents} width='900' height='600' />
                <div className="wave-banner" ref={waveBannerRef}></div>
                <div className="panel">
                    <div className='panel-top'>
                        <div className='money'>
                            ${values.money}
                        </div>
                        <div className='money crystals-display'>
                            💎{values.crystals}
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
                                    defsTable={TOWER_DEFS}
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
                                                {`Upgrade (💎${modalInfo.upgradeCost})`}
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
            <Popup state={gameState} wave={values.wave} coresEarned={coresEarned} runSummary={runSummary} />
            <PauseMenu show={menuOpen} onResume={resumeFromMenu} />
        </div>
    );
}

export default GamePage;