import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from 'react-bootstrap/Button';

import Canvas from '../objects/Canvas';
import TowerIcon from '../objects/TowerIcon';
import { Block } from '../objects/block';
import { Enemy } from '../objects/enemy';
import { Tower, META as TOWER_META, COSMETIC } from '../objects/tower';
import { CATEGORY } from '../objects/towerCategory';
import { TOWER_DEFS_V3, TOWER_TYPES_V3 } from '../objects/towerDefsV3';
import { maps } from '../data/maps';
import { mapTheme } from '../utils/mapTheme';
import { getDifficulty } from '../utils/difficulty';
import { GAME_MODES, getGameMode, setGameMode, setGameModeEnabled, applyGameModeToEnemy } from '../utils/gameModes';
import { getMetaBonuses, awardRunCores } from '../utils/metaProgression';
import {
    TOWER_UNLOCK_WAVE_V3, isTowerUnlockedV3, unlockTowerV3,
    recordMapWaveCompletionV3,
} from '../utils/progressionV3';
import {
    isMapUnlockedV31, recordMapResultV31, getMapStars,
    getFavoriteTowers, toggleFavoriteTower,
} from '../utils/progressionV31';
import {
    SHOP_ROLES, getTowerRole, getSpecializationChoices,
    applyTowerSpecialization, refreshTowerSpecialization,
} from '../utils/towerSpecializationsV31';
import { getMapMechanic, isBlockedCell, applyMapBonusToTower, drawMapMechanicOverlay, isFogWave, getEnemySpeedMultiplier, getCrystalKillBonus } from '../utils/mapMechanicsV31';
import { buildWavePlan, applyPlannedTrait, summarizeWavePlan } from '../utils/waveDirectorV31';
import { applyBossArchetype, tickBossAbility } from '../utils/bossesV31';
import { stepTowerCombatV31, stepEnemyEffectsV31, enemyMovementMultiplierV31, stepTracersV31, drawTracersV31, towerRangeV31 } from '../utils/combatV31';
import { getDailyChallenge } from '../utils/dailyChallengeV31';
import { saveRunV31, loadRunV31, clearRunV31 } from '../utils/runSaveV31';
import { awardMasteryFromDamage, getTowerMasteryLevel } from '../utils/towerMasteryV31';
import { getPlayerName, saveHighScore, startGameSession } from '../utils/highscores';
import { recordStat } from '../utils/achievements';
import { resetRunStats, recordTowerPlaced, snapshotRunStats } from '../utils/runStats';
import { drawDamageNumbers, resetDamageNumbers } from '../utils/damageNumbers';
import { spawnBurst, updateAndDrawParticles, resetParticles } from '../utils/particles';
import { startMapMusic, stopMusic, setMusicEnabled } from '../utils/music';
import { setSfxEnabled, playBuyTower, playEnemyDeath, playUpgradeTower, playUiClick, playUnlockTower, playWaveCleared } from '../utils/sfx';
import './GamePageV31.css';

const STEP = 1 / 60;
const SPEEDS = [0.5, 1, 2, 3, 5, 10];
const RUN_PERKS = [
    { id: 'damage', name: 'Overcharge', desc: '+12% tower damage this run.' },
    { id: 'fire', name: 'Rapid Cycling', desc: '+10% tower fire rate this run.' },
    { id: 'range', name: 'Long Optics', desc: '+12% global tower range this run.' },
    { id: 'income', name: 'War Bonds', desc: '+20% passive income this run.' },
    { id: 'lives', name: 'Field Repairs', desc: '+2 lives immediately.' },
    { id: 'crystals', name: 'Crystal Cache', desc: '+12 Crystals immediately.' },
];

function draftRoster(seed = 'draft') {
    let h = 2166136261;
    for (const char of seed) { h ^= char.charCodeAt(0); h = Math.imul(h, 16777619); }
    const scored = TOWER_TYPES_V3.map(type => ({ type, score: Math.imul((h ^ type) >>> 0, 2654435761) >>> 0 }));
    const selected = scored.sort((a, b) => a.score - b.score).slice(0, 6).map(v => v.type);
    [21, 22].forEach(type => { if (!selected.includes(type)) selected.push(type); });
    return new Set(selected);
}

function buildRunLabel(mapName, difficultyKey, modeKey, ranked, daily) {
    return `${mapName} | d:${difficultyKey} | m:${modeKey}${ranked ? ' | ranked' : ''}${daily ? ' | daily' : ''}`;
}

function serializeTower(tower) {
    return {
        x: tower.x, y: tower.y, type: tower.type, level: tower.level,
        specialization: tower.specialization || null,
        mapBonusLabel: tower.mapBonusLabel || null,
    };
}

function advanceAlongPath(enemy, path, distance) {
    let remaining = Math.max(0, distance);
    while (remaining > 0 && enemy.waypoint < path.length) {
        const target = path[enemy.waypoint];
        const dx = target.x - enemy.x, dy = target.y - enemy.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= 0.001) { enemy.waypoint += 1; continue; }
        if (dist <= remaining) {
            enemy.x = target.x; enemy.y = target.y;
            enemy.distance += dist; remaining -= dist; enemy.waypoint += 1;
        } else {
            const ratio = remaining / dist;
            enemy.x += dx * ratio; enemy.y += dy * ratio;
            enemy.distance += remaining; remaining = 0;
        }
    }
    enemy.mid.x = enemy.x + enemy.width / 2;
    enemy.mid.y = enemy.y + enemy.height / 2;
    if (enemy.waypoint >= path.length) enemy.end = true;
}

function choosePerks(wave) {
    const start = Math.floor(wave / 5) % RUN_PERKS.length;
    return [0, 2, 4].map(offset => RUN_PERKS[(start + offset) % RUN_PERKS.length]);
}

const GamePageV31 = () => {
    const [searchParams] = useSearchParams();
    const resumeRequested = searchParams.get('resume') === '1';
    const savedRunRef = useRef(resumeRequested ? loadRunV31() : null);
    const dailyRequested = searchParams.get('daily') === '1';
    const daily = useMemo(() => dailyRequested ? getDailyChallenge() : null, [dailyRequested]);
    const savedRun = savedRunRef.current;

    const rawMap = Number.parseInt(searchParams.get('map'), 10) || 0;
    const mapIndex = Math.max(0, Math.min(maps.length - 1, savedRun?.mapIndex ?? daily?.mapIndex ?? rawMap));
    const map = maps[mapIndex];
    const difficultyKey = savedRun?.difficultyKey || daily?.difficultyKey || searchParams.get('difficulty') || 'basic';
    const difficulty = getDifficulty(difficultyKey);
    const modeKey = savedRun?.modeKey || daily?.modeKey || searchParams.get('rules') || 'classic';
    const mode = getGameMode(modeKey);
    const ranked = Boolean(savedRun?.ranked || dailyRequested || searchParams.get('ranked') === '1');
    const seed = savedRun?.seed || daily?.seed || searchParams.get('seed') || 'standard';
    const competitive = ranked || dailyRequested;
    const mechanic = useMemo(() => getMapMechanic(mapIndex, map), [mapIndex, map]);
    const draftTypes = useMemo(() => modeKey === 'draft' ? draftRoster(seed) : null, [modeKey, seed]);

    const simRef = useRef(null);
    const speedRef = useRef(1);
    const buildTypeRef = useRef(null);
    const hoverCellRef = useRef(null);
    const sessionIdRef = useRef(null);
    const baseMetaRef = useRef(null);
    const runEndedRef = useRef(false);
    const resumeAfterModalRef = useRef(false);

    const [gameState, setGameState] = useState('paused');
    const [speed, setSpeed] = useState(1);
    const [soundOn, setSoundOn] = useState(true);
    const [hud, setHud] = useState({ wave: 0, score: 0, money: 0, crystals: 0, lives: 10, boss: null });
    const [message, setMessage] = useState('Select a tower, then tap a build tile.');
    const [shopRole, setShopRole] = useState('all');
    const [selectedBuildType, setSelectedBuildType] = useState(null);
    const [selectedTowerUid, setSelectedTowerUid] = useState(null);
    const [favorites, setFavorites] = useState(() => getFavoriteTowers());
    const [shopRevision, setShopRevision] = useState(0);
    const [specializationPrompt, setSpecializationPrompt] = useState(null);
    const [perkChoices, setPerkChoices] = useState(null);
    const [endSummary, setEndSummary] = useState(null);

    buildTypeRef.current = selectedBuildType;
    speedRef.current = speed;

    const syncHud = () => {
        const sim = simRef.current;
        if (!sim) return;
        const boss = sim.enemies.find(enemy => enemy.type === 5 && !enemy.dead);
        setHud({
            wave: sim.wave,
            score: Math.round(sim.score),
            money: Math.floor(sim.money),
            crystals: Math.floor(sim.crystals),
            lives: Math.max(0, Math.ceil(sim.lives)),
            boss: boss ? { name: boss.bossName || 'Boss', pct: Math.max(0, Math.min(1, boss.health / boss.maxHealth)), color: boss.bossColor || '#ff595e' } : null,
        });
    };

    useEffect(() => {
        setGameModeEnabled(true);
        setGameMode(modeKey);
        mapTheme.value = map.theme || 'grass';
        resetRunStats(); resetDamageNumbers(); resetParticles();
        runEndedRef.current = false;
        setEndSummary(null);

        const meta = competitive ? {
            startGoldBonus: 0, startLivesBonus: 0, dmgMult: 1, fireRateMult: 1, bankMult: 1, paletteHueShift: 0,
        } : getMetaBonuses();
        baseMetaRef.current = meta;
        TOWER_META.dmgMult = meta.dmgMult;
        TOWER_META.fireRateMult = meta.fireRateMult;
        TOWER_META.bankMult = meta.bankMult;
        COSMETIC.hueShift = meta.paletteHueShift;

        const initialLives = modeKey === 'onelife' ? 1 : 10 + meta.startLivesBonus;
        const initialMoney = Math.round((20 + meta.startGoldBonus) * difficulty.startMoneyMult);
        const restored = savedRun || {};
        const blocks = [];
        for (let y = 0; y < 12; y++) for (let x = 0; x < 18; x++) blocks.push(new Block(x * 50, y * 50, map.grid[y][x]));
        const towers = (restored.towers || []).map(saved => {
            const tower = new Tower(saved.x, saved.y, saved.type, TOWER_DEFS_V3);
            tower.uid = `${Date.now()}-${Math.random()}`;
            tower.level = Math.max(1, Math.min(saved.level || 1, tower.maxLevel));
            tower._refreshStats();
            if (saved.specialization) applyTowerSpecialization(tower, saved.specialization);
            applyMapBonusToTower(tower, mechanic, { x: Math.round(saved.x / 50), y: Math.round(saved.y / 50) });
            return tower;
        });

        simRef.current = {
            blocks, towers, enemies: [], tracers: [], wave: restored.wave || 0,
            score: restored.score || 0, money: restored.money ?? initialMoney,
            crystals: restored.crystals || 0, lives: restored.lives ?? initialLives,
            kills: restored.kills || 0, livesLost: restored.livesLost || 0,
            waveActive: false, plan: null, spawnIndex: 0, spawnTimer: 0, intermission: 0.8,
            accumulator: 0, lastFrame: 0, hudTimer: 0, moneyFrac: 0, crystalFrac: 0,
            runDmgMult: restored.runDmgMult || 1, runFireMult: restored.runFireMult || 1,
            globalRangeMult: restored.globalRangeMult || 1, runIncomeMult: restored.runIncomeMult || 1,
            bossArchetypes: new Set(restored.bossArchetypes || []), dailyCompleted: Boolean(restored.dailyCompleted),
            ended: false,
        };
        TOWER_META.dmgMult = meta.dmgMult * simRef.current.runDmgMult;
        TOWER_META.fireRateMult = meta.fireRateMult * simRef.current.runFireMult;
        syncHud();
        setGameState('paused');
        setMessage(savedRun ? `Resumed after wave ${savedRun.wave}. Your in-progress wave restarts safely.` : `${mechanic.name}: ${mechanic.desc}`);

        const runLabel = buildRunLabel(map.name, difficulty.key, modeKey, ranked, dailyRequested);
        if (!savedRun) startGameSession(runLabel, 'v3').then(id => { sessionIdRef.current = id; });
        else sessionIdRef.current = null; // resumed runs stay local; server-clock validation cannot safely resume an old session.

        return () => {
            stopMusic();
            setGameModeEnabled(false);
        };
    }, [mapIndex, difficulty.key, modeKey, ranked, dailyRequested, seed]);

    const runLabel = buildRunLabel(map.name, difficulty.key, modeKey, ranked, dailyRequested);

    const saveBoundary = () => {
        const sim = simRef.current;
        if (!sim || sim.ended) return;
        saveRunV31({
            mapIndex, mapName: map.name, wave: sim.wave, score: sim.score, money: sim.money,
            crystals: sim.crystals, lives: sim.lives, kills: sim.kills, livesLost: sim.livesLost,
            difficultyKey: difficulty.key, modeKey, ranked, daily: dailyRequested, seed,
            runDmgMult: sim.runDmgMult, runFireMult: sim.runFireMult,
            globalRangeMult: sim.globalRangeMult, runIncomeMult: sim.runIncomeMult,
            bossArchetypes: [...sim.bossArchetypes], dailyCompleted: sim.dailyCompleted,
            towers: sim.towers.filter(t => !t.sold).map(serializeTower),
        });
    };

    const announce = text => { if (text) setMessage(text); };

    const spawnEnemy = (specOrType, override = {}) => {
        const sim = simRef.current;
        if (!sim) return null;
        const spec = typeof specOrType === 'number' ? { type: specOrType } : specOrType;
        const profile = map.enemyProfile || { speedMult: 1, healthMult: 1 };
        const waveScale = (1 + Math.max(0, sim.wave - 1) * 0.05) * (profile.healthMult || 1) * difficulty.mult;
        const enemy = new Enemy(
            override.x ?? map.waypoints[0].x - 60,
            override.y ?? map.waypoints[0].y,
            spec.type, spec.type === 5 ? 1 : waveScale, difficulty.mult,
        );
        enemy.speed *= (profile.speedMult || 1) * getEnemySpeedMultiplier(mechanic, sim.wave);
        enemy.baseSpeed = enemy.speed;
        if (!override.skipMode) applyGameModeToEnemy(enemy);
        applyPlannedTrait(enemy, spec);
        if (override.waypoint != null) enemy.waypoint = override.waypoint;
        if (override.distance != null) enemy.distance = override.distance;
        if (override.bossEscort) enemy.bossEscort = true;
        if (spec.type === 5) {
            const tier = Math.max(1, Math.floor(sim.wave / (modeKey === 'bossrush' ? 3 : 5)));
            enemy.maxHealth = Math.round(enemy.maxHealth * tier * (profile.healthMult || 1) * difficulty.mult);
            enemy.health = enemy.maxHealth;
            enemy.value = Math.round(enemy.value * tier);
            enemy.score = Math.round(enemy.score * tier);
            const archetype = applyBossArchetype(enemy, sim.wave);
            sim.bossArchetypes.add(archetype.key);
            announce(`⚠ ${archetype.name}: ${archetype.desc}`);
        }
        enemy.teleportRemaining = 1.6 + Math.random() * 0.8;
        sim.enemies.push(enemy);
        return enemy;
    };

    const startWave = () => {
        const sim = simRef.current;
        if (!sim || sim.ended) return;
        sim.wave += 1;
        sim.plan = buildWavePlan({ wave: sim.wave, map, mapIndex, difficulty, modeKey, mechanic, seed });
        sim.spawnIndex = 0;
        sim.spawnTimer = 0.65;
        sim.waveActive = true;
        if (sim.plan.theme) announce(sim.plan.theme.name);
        syncHud();
    };

    const completeWave = () => {
        const sim = simRef.current;
        if (!sim || !sim.waveActive) return;
        sim.waveActive = false;
        sim.plan = null;
        sim.intermission = 1.2;
        playWaveCleared();
        recordMapWaveCompletionV3(mapIndex, sim.wave);

        Object.entries(TOWER_UNLOCK_WAVE_V3).forEach(([typeText, unlockWave]) => {
            const type = Number(typeText);
            if (sim.wave === unlockWave && !isTowerUnlockedV3(type)) {
                unlockTowerV3(type); playUnlockTower(); setShopRevision(v => v + 1);
                announce(`${TOWER_DEFS_V3[type]?.name || 'Tower'} unlocked!`);
            }
        });

        sim.towers.forEach(tower => {
            if (tower.wavePayout) {
                if (tower.def.category === CATEGORY.CRYSTAL) sim.crystals += tower.wavePayout;
                else sim.money += tower.wavePayout;
            }
        });

        if (daily && sim.wave >= daily.objectiveWave && !sim.dailyCompleted) {
            sim.dailyCompleted = true;
            announce(`Daily objective complete: reached wave ${daily.objectiveWave}!`);
        }

        saveBoundary();
        if (modeKey === 'roguelite' && sim.wave % 5 === 0) {
            resumeAfterModalRef.current = true;
            setGameState('paused');
            setPerkChoices(choosePerks(sim.wave));
        }
        syncHud();
    };

    const endRun = () => {
        const sim = simRef.current;
        if (!sim || sim.ended || runEndedRef.current) return;
        sim.ended = true; runEndedRef.current = true;
        setGameState('end'); stopMusic(); clearRunV31();
        const runStats = snapshotRunStats();
        const masteryAwards = awardMasteryFromDamage(runStats.damageByType);
        const stars = recordMapResultV31(mapIndex, {
            wave: sim.wave, difficultyKey: difficulty.key, modeKey, ranked,
            daily: dailyRequested && sim.dailyCompleted, livesLost: sim.livesLost,
            bossArchetypes: [...sim.bossArchetypes],
        });
        const cores = awardRunCores(sim.wave, sim.score);
        recordStat('bestWaveAnyMap', sim.wave, 'max');
        recordStat('mapsUnlocked', maps.filter((_, index) => isMapUnlockedV31(index)).length, 'max');
        recordStat('v31TowersUnlocked', TOWER_TYPES_V3.filter(type => isTowerUnlockedV3(type)).length, 'max');
        recordStat('threeStarMaps', maps.filter((_, index) => getMapStars(index) >= 3).length, 'max');
        recordStat('modesPlayedV31', 1, 'add');
        if (ranked) recordStat('rankedBestWave', sim.wave, 'max');
        if (dailyRequested && sim.dailyCompleted) recordStat('dailyCompletions', 1, 'add');
        if (sim.bossArchetypes.size) recordStat('bossArchetypesDefeated', sim.bossArchetypes.size, 'max');
        saveHighScore(sessionIdRef.current, getPlayerName(), Math.round(sim.score), sim.wave, runLabel, 'v3');
        setEndSummary({ cores, stars, runStats, masteryAwards, wave: sim.wave, score: Math.round(sim.score), dailyComplete: sim.dailyCompleted });
        syncHud();
    };

    const applySupportAndIncome = dt => {
        const sim = simRef.current;
        const rangeMult = (isFogWave(mechanic, sim.wave) ? 0.82 : 1) * sim.globalRangeMult;
        for (const tower of sim.towers) tower.auraBonus = { range: 0, dmg: 0, fireRate: 0 };
        for (const support of sim.towers) {
            if (support.sold || support.disabledRemaining > 0 || support.def.category !== CATEGORY.SUPPORT) continue;
            const auraRange = (support.auraRange || 0) * rangeMult;
            if (support.slowFloor != null) {
                for (const enemy of sim.enemies) {
                    const dx = support.mid.x - enemy.mid.x, dy = support.mid.y - enemy.mid.y;
                    if (dx * dx + dy * dy <= auraRange * auraRange) {
                        enemy.v31SlowFloor = Math.min(enemy.v31SlowFloor ?? 1, support.slowFloor);
                        enemy.v31SlowRemaining = 0.2;
                    }
                }
                continue;
            }
            for (const tower of sim.towers) {
                if (tower === support || tower.def.category === CATEGORY.SUPPORT) continue;
                const dx = support.mid.x - tower.mid.x, dy = support.mid.y - tower.mid.y;
                if (dx * dx + dy * dy <= auraRange * auraRange) {
                    tower.auraBonus.range += support.rangeBonus || 0;
                    tower.auraBonus.dmg += support.dmgBonus || 0;
                    tower.auraBonus.fireRate += support.fireRateBonus || 0;
                }
            }
        }

        if (modeKey !== 'noeconomy') {
            for (const tower of sim.towers) {
                if (tower.sold || tower.disabledRemaining > 0) continue;
                if (tower.def.category === CATEGORY.BANK) sim.moneyFrac += tower.effectiveIncome() * sim.runIncomeMult * dt;
                if (tower.def.category === CATEGORY.CRYSTAL) sim.crystalFrac += tower.effectiveIncome() * sim.runIncomeMult * dt;
            }
            if (sim.moneyFrac >= 1) { const whole = Math.floor(sim.moneyFrac); sim.money += whole; sim.moneyFrac -= whole; }
            if (sim.crystalFrac >= 1) { const whole = Math.floor(sim.crystalFrac); sim.crystals += whole; sim.crystalFrac -= whole; }
        }
        return rangeMult;
    };

    const resolveEnemy = (enemy, index) => {
        const sim = simRef.current;
        if (enemy.end) {
            sim.lives -= enemy.atk; sim.livesLost += enemy.atk;
            sim.enemies.splice(index, 1);
            if (sim.lives <= 0) endRun();
            return;
        }
        if (!enemy.dead) return;
        sim.score += enemy.score || 0;
        sim.money += enemy.value || 0;
        sim.kills += 1;
        sim.crystals += getCrystalKillBonus(mechanic, sim.kills);
        if (modeKey === 'noeconomy' && sim.kills % 3 === 0) sim.crystals += 1;

        if (enemy.type === 5) {
            recordStat('bossKills', 1, 'add');
            spawnBurst(enemy.mid.x, enemy.mid.y, { count: 30, color: enemy.bossColor || '#ff595e', speed: 6, life: 700 });
        }
        if (enemy.splitter) {
            for (let childIndex = 0; childIndex < 2; childIndex++) {
                const child = spawnEnemy(1, {
                    x: enemy.x + (childIndex ? 10 : -10), y: enemy.y,
                    waypoint: enemy.waypoint, distance: enemy.distance, skipMode: true,
                });
                child.maxHealth = Math.max(1, Math.round(enemy.maxHealth * 0.3));
                child.health = child.maxHealth;
                child.value = Math.max(1, Math.round((enemy.value || 1) * 0.35));
                child.score = Math.max(1, Math.round((enemy.score || 1) * 0.35));
                child.splitter = false; child.isSplitChild = true;
            }
        }
        playEnemyDeath(enemy.type === 5);
        sim.enemies.splice(index, 1);
    };

    const stepSimulation = dt => {
        const sim = simRef.current;
        if (!sim || sim.ended) return;

        if (!sim.waveActive) {
            sim.intermission -= dt;
            if (sim.intermission <= 0) startWave();
        } else if (sim.plan) {
            sim.spawnTimer -= dt;
            if (sim.spawnIndex < sim.plan.entries.length && sim.spawnTimer <= 0) {
                spawnEnemy(sim.plan.entries[sim.spawnIndex]);
                sim.spawnIndex += 1;
                sim.spawnTimer += sim.plan.spawnInterval;
            }
        }

        const rangeMult = applySupportAndIncome(dt);
        for (const tower of sim.towers) stepTowerCombatV31(tower, sim.enemies, dt, sim.tracers, rangeMult);

        const bosses = sim.enemies.filter(enemy => enemy.type === 5 && !enemy.dead);
        bosses.forEach(boss => tickBossAbility({
            boss, dt, enemies: sim.enemies, towers: sim.towers,
            spawnEnemy: (type, override) => spawnEnemy(type, { ...override, skipMode: true }), announce,
        }));

        for (let i = sim.enemies.length - 1; i >= 0; i--) {
            const enemy = sim.enemies[i];
            stepEnemyEffectsV31(enemy, dt);
            if (!enemy.dead && !enemy.end) {
                if (enemy.type === 7) {
                    enemy.teleportRemaining -= dt;
                    if (enemy.teleportRemaining <= 0) {
                        enemy.teleportRemaining = 2.2;
                        advanceAlongPath(enemy, map.waypoints, 70);
                    }
                }
                if (!enemy.end) {
                    const speedPerSecond = enemy.speed * 60 * enemyMovementMultiplierV31(enemy);
                    advanceAlongPath(enemy, map.waypoints, speedPerSecond * dt);
                }
            }
            resolveEnemy(enemy, i);
        }
        stepTracersV31(sim.tracers, dt);

        if (sim.waveActive && sim.plan && sim.spawnIndex >= sim.plan.entries.length && sim.enemies.length === 0) completeWave();

        sim.hudTimer -= dt;
        if (sim.hudTimer <= 0) { sim.hudTimer = 0.15; syncHud(); }
    };

    const drawWorld = ctx => {
        const sim = simRef.current;
        if (!sim) return;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        sim.blocks.forEach(block => block.draw(ctx));
        drawMapMechanicOverlay(ctx, mechanic, sim.wave);

        const hover = hoverCellRef.current;
        if (hover && buildTypeRef.current && map.grid?.[hover.y]?.[hover.x] === 0 && !isBlockedCell(mechanic, hover.x, hover.y)) {
            const def = TOWER_DEFS_V3[buildTypeRef.current];
            const level = def?.levels?.[0];
            if (level) {
                const range = def.category === CATEGORY.SUPPORT ? level.auraRange : level.range;
                if (range) {
                    ctx.save(); ctx.fillStyle = 'rgba(76,201,240,.08)'; ctx.strokeStyle = 'rgba(76,201,240,.6)';
                    ctx.beginPath(); ctx.arc(hover.x * 50 + 25, hover.y * 50 + 25, range, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
                }
            }
        }

        sim.towers.forEach(tower => {
            tower.draw(ctx);
            if (tower.disabledRemaining > 0) {
                ctx.save(); ctx.strokeStyle = '#ff595e'; ctx.lineWidth = 4;
                ctx.beginPath(); ctx.moveTo(tower.x + 8, tower.y + 8); ctx.lineTo(tower.x + 42, tower.y + 42);
                ctx.moveTo(tower.x + 42, tower.y + 8); ctx.lineTo(tower.x + 8, tower.y + 42); ctx.stroke(); ctx.restore();
            }
        });
        const selected = sim.towers.find(tower => tower.uid === selectedTowerUid);
        if (selected) {
            const range = towerRangeV31(selected, (isFogWave(mechanic, sim.wave) ? 0.82 : 1) * sim.globalRangeMult);
            if (range !== Infinity) {
                ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.fillStyle = 'rgba(255,255,255,.06)';
                ctx.beginPath(); ctx.arc(selected.mid.x, selected.mid.y, range, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
            }
        }

        sim.enemies.forEach(enemy => {
            enemy.draw(ctx); enemy.drawHealth(ctx);
            if (enemy.waveTrait && enemy.type !== 5) {
                ctx.save(); ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
                ctx.fillText(enemy.waveTrait === 'miniboss' ? 'ELITE' : enemy.waveTrait.toUpperCase().slice(0, 4), enemy.mid.x, enemy.y - 13); ctx.restore();
            }
        });
        drawTracersV31(ctx, sim.tracers);
        drawDamageNumbers(ctx);
        updateAndDrawParticles(ctx);
    };

    const draw = ctx => {
        const sim = simRef.current;
        if (!sim) return;
        const now = performance.now();
        if (!sim.lastFrame) sim.lastFrame = now;
        const elapsed = Math.min(0.12, Math.max(0, (now - sim.lastFrame) / 1000));
        sim.lastFrame = now;
        if (gameState === 'playing' && !perkChoices && !specializationPrompt && !sim.ended) {
            sim.accumulator += elapsed * speedRef.current;
            let steps = 0;
            while (sim.accumulator >= STEP && steps < 40) {
                stepSimulation(STEP); sim.accumulator -= STEP; steps += 1;
            }
            if (steps >= 40) sim.accumulator = 0;
        } else sim.accumulator = 0;
        drawWorld(ctx);
    };

    const boardEvents = canvas => {
        const pointer = event => {
            const rect = canvas.getBoundingClientRect();
            const x = (event.clientX - rect.left) * canvas.width / rect.width;
            const y = (event.clientY - rect.top) * canvas.height / rect.height;
            return { x, y, cellX: Math.floor(x / 50), cellY: Math.floor(y / 50) };
        };
        const onMove = event => {
            const p = pointer(event);
            hoverCellRef.current = p.cellX >= 0 && p.cellX < 18 && p.cellY >= 0 && p.cellY < 12 ? { x: p.cellX, y: p.cellY } : null;
        };
        const onLeave = () => { hoverCellRef.current = null; };
        const onDown = event => {
            event.preventDefault();
            const sim = simRef.current;
            if (!sim || gameState === 'end') return;
            const p = pointer(event);
            if (p.cellX < 0 || p.cellX >= 18 || p.cellY < 0 || p.cellY >= 12) return;
            const existing = sim.towers.find(t => !t.sold && Math.round(t.x / 50) === p.cellX && Math.round(t.y / 50) === p.cellY);
            if (existing) {
                setSelectedTowerUid(existing.uid); setSelectedBuildType(null); buildTypeRef.current = null;
                return;
            }
            const type = buildTypeRef.current;
            if (!type) return;
            if (map.grid[p.cellY][p.cellX] !== 0 || isBlockedCell(mechanic, p.cellX, p.cellY)) {
                announce('That tile cannot hold a tower.'); return;
            }
            const def = TOWER_DEFS_V3[type];
            if (!def) return;
            const allowed = modeKey === 'draft' ? draftTypes?.has(type) : isTowerUnlockedV3(type);
            if (!allowed) { announce('That tower is still locked.'); return; }
            if (modeKey === 'noeconomy' && [CATEGORY.BANK, CATEGORY.CRYSTAL].includes(def.category)) { announce('Economy towers are disabled in this mode.'); return; }
            const price = def.levels[0].price;
            if (sim.money < price) { announce('Not enough Money.'); return; }
            const tower = new Tower(p.cellX * 50, p.cellY * 50, type, TOWER_DEFS_V3);
            tower.uid = `${Date.now()}-${Math.random()}`;
            applyMapBonusToTower(tower, mechanic, { x: p.cellX, y: p.cellY });
            sim.money -= price; sim.towers.push(tower); recordTowerPlaced(type); playBuyTower();
            announce(`${def.name} placed${tower.mapBonusLabel ? ` on ${tower.mapBonusLabel}` : ''}.`); syncHud();
        };
        canvas.addEventListener('pointermove', onMove, { passive: true });
        canvas.addEventListener('pointerleave', onLeave);
        canvas.addEventListener('pointerdown', onDown, { passive: false });
        return () => {
            canvas.removeEventListener('pointermove', onMove);
            canvas.removeEventListener('pointerleave', onLeave);
            canvas.removeEventListener('pointerdown', onDown);
        };
    };

    const selectedTower = simRef.current?.towers.find(tower => tower.uid === selectedTowerUid) || null;

    const upgradeSelected = () => {
        const sim = simRef.current, tower = selectedTower;
        if (!sim || !tower || !tower.canUpgrade()) return;
        const cost = tower.upgradeCost;
        if (sim.crystals < cost) { announce('Not enough Crystals.'); return; }
        sim.crystals -= cost; tower.upgrade(); playUpgradeTower();
        refreshTowerSpecialization(tower);
        recordStat('crystalsSpentUpgrading', cost, 'add');
        if (tower.level === 3 && !tower.specialization) {
            resumeAfterModalRef.current = gameState === 'playing';
            setGameState('paused');
            setSpecializationPrompt({ uid: tower.uid, choices: getSpecializationChoices(tower) });
        }
        syncHud();
    };

    const chooseSpecialization = id => {
        const tower = simRef.current?.towers.find(t => t.uid === specializationPrompt?.uid);
        if (tower) applyTowerSpecialization(tower, id);
        setSpecializationPrompt(null);
        if (resumeAfterModalRef.current) setGameState('playing');
        syncHud();
    };

    const sellSelected = () => {
        const sim = simRef.current, tower = selectedTower;
        if (!sim || !tower) return;
        const refund = Math.round(tower.getSellValue() * difficulty.refundMult);
        sim.money += refund; tower.sold = true;
        sim.towers = sim.towers.filter(t => t !== tower); setSelectedTowerUid(null); syncHud();
    };

    const choosePerk = id => {
        const sim = simRef.current;
        if (!sim) return;
        if (id === 'damage') { sim.runDmgMult *= 1.12; TOWER_META.dmgMult = baseMetaRef.current.dmgMult * sim.runDmgMult; }
        if (id === 'fire') { sim.runFireMult *= 1.10; TOWER_META.fireRateMult = baseMetaRef.current.fireRateMult * sim.runFireMult; }
        if (id === 'range') sim.globalRangeMult *= 1.12;
        if (id === 'income') sim.runIncomeMult *= 1.20;
        if (id === 'lives') sim.lives += 2;
        if (id === 'crystals') sim.crystals += 12;
        setPerkChoices(null); syncHud(); saveBoundary();
        if (resumeAfterModalRef.current) setGameState('playing');
    };

    const toggleSpeed = () => {
        const index = SPEEDS.indexOf(speed);
        setSpeed(SPEEDS[(index + 1) % SPEEDS.length]);
    };

    const toggleSound = () => {
        const next = !soundOn; setSoundOn(next); setSfxEnabled(next); setMusicEnabled(next);
        if (next && gameState === 'playing') startMapMusic(mapIndex); else if (!next) stopMusic();
    };

    const previewPlan = useMemo(() => buildWavePlan({
        wave: hud.wave + 1, map, mapIndex, difficulty, modeKey, mechanic, seed,
    }), [hud.wave, map, mapIndex, difficulty.key, modeKey, mechanic, seed]);
    const preview = summarizeWavePlan(previewPlan).slice(0, 9);

    const visibleTowerTypes = TOWER_TYPES_V3.filter(type => {
        const def = TOWER_DEFS_V3[type];
        if (!def) return false;
        if (modeKey === 'draft' && !draftTypes?.has(type)) return false;
        if (modeKey === 'noeconomy' && [CATEGORY.BANK, CATEGORY.CRYSTAL].includes(def.category)) return false;
        if (shopRole === 'favorites') return favorites.includes(type);
        return shopRole === 'all' || getTowerRole(def) === shopRole;
    });

    if (!isMapUnlockedV31(mapIndex) && !dailyRequested && !savedRun) {
        return <div className="v31-locked"><h1>Map Locked</h1><p>Earn more stars in earlier regions to unlock this map.</p><Link to="/play3"><Button variant="outline-light">Back to Maps</Button></Link></div>;
    }

    return (
        <div className="v31-screen">
            <header className="v31-header">
                <div>
                    <h1 className="v31-title">{map.name}</h1>
                    <div className="v31-subtitle">3.1 · {difficulty.name} · {mode?.name || modeKey}{ranked ? ' · Ranked' : ''}{daily ? ` · Daily ${daily.dateKey}` : ''}</div>
                </div>
                <div className="v31-hud">
                    <span>Wave <b>{hud.wave}</b></span><span>Score <b>{hud.score.toLocaleString()}</b></span>
                    <span className="money">${hud.money}</span><span className="crystal">💎 {hud.crystals}</span><span>❤️ {hud.lives}</span>
                </div>
                <div className="v31-controls">
                    <button onClick={() => { playUiClick(); if (gameState === 'playing') setGameState('paused'); else if (gameState !== 'end') { setGameState('playing'); if (soundOn) startMapMusic(mapIndex); } }}>{gameState === 'playing' ? 'Pause' : 'Play'}</button>
                    <button onClick={() => { playUiClick(); toggleSpeed(); }}>{speed}x</button>
                    <button onClick={() => { playUiClick(); toggleSound(); }}>{soundOn ? '🔊' : '🔇'}</button>
                    <button onClick={() => { saveBoundary(); announce('Run saved at the last completed wave.'); }}>Save</button>
                    <Link to="/play3"><button>Maps</button></Link>
                </div>
            </header>

            <div className="v31-info-row">
                <div className="v31-mechanic"><b>{mechanic.name}</b> — {mechanic.desc}</div>
                <div className="v31-message">{message}</div>
            </div>

            <div className="v31-preview">
                <span className="v31-preview-label">Wave {hud.wave + 1}:</span>
                {preview.map(item => <span className="v31-preview-chip" key={item.label}>{item.label} ×{item.count}</span>)}
            </div>

            {hud.boss && <div className="v31-boss"><span style={{ color: hud.boss.color }}>{hud.boss.name}</span><div><i style={{ width: `${hud.boss.pct * 100}%`, background: hud.boss.color }} /></div></div>}

            <main className="v31-layout">
                <section className="v31-board-wrap">
                    <Canvas draw={draw} events={boardEvents} width="900" height="600" />
                </section>

                <aside className="v31-sidebar">
                    <div className="v31-shop-tabs">
                        {SHOP_ROLES.map(role => <button key={role.key} className={shopRole === role.key ? 'active' : ''} onClick={() => setShopRole(role.key)}>{role.label}</button>)}
                    </div>
                    <div className="v31-shop-grid" key={shopRevision}>
                        {visibleTowerTypes.map(type => {
                            const def = TOWER_DEFS_V3[type];
                            const locked = modeKey !== 'draft' && !isTowerUnlockedV3(type);
                            const cost = def.levels[0].price;
                            const fav = favorites.includes(type);
                            return <div key={type} className={`v31-tower-card ${selectedBuildType === type ? 'selected' : ''} ${locked ? 'locked' : ''} ${hud.money < cost ? 'poor' : ''}`}>
                                <button className="v31-favorite" onClick={event => { event.stopPropagation(); setFavorites(toggleFavoriteTower(type)); }}>{fav ? '★' : '☆'}</button>
                                <button className="v31-tower-select" disabled={locked} onClick={() => { setSelectedTowerUid(null); setSelectedBuildType(selectedBuildType === type ? null : type); }}>
                                    <TowerIcon type={type} size={38} defsTable={TOWER_DEFS_V3} />
                                    <span>{def.name}</span><small>${cost} · M{getTowerMasteryLevel(type)}</small>
                                    {locked && <em>Wave {TOWER_UNLOCK_WAVE_V3[type] || '?'}</em>}
                                </button>
                            </div>;
                        })}
                    </div>

                    {selectedTower && <div className="v31-selected-panel">
                        <h3>{selectedTower.def.name}</h3>
                        <div>Level {selectedTower.level}/{selectedTower.maxLevel}{selectedTower.specialization ? ` · ${getSpecializationChoices(selectedTower).find(c => c.id === selectedTower.specialization)?.name || selectedTower.specialization}` : ''}</div>
                        <div className="v31-stats">
                            {selectedTower.dmg != null && <span>DMG {Math.round(selectedTower.effectiveDmg())}</span>}
                            {selectedTower.range != null && <span>RNG {Math.round(selectedTower.effectiveRange())}</span>}
                            {selectedTower.fireRate != null && <span>RATE {selectedTower.effectiveFireRate().toFixed(2)}s</span>}
                            {selectedTower.incomePerSecond != null && <span>INC {selectedTower.effectiveIncome().toFixed(1)}/s</span>}
                            {selectedTower.mapBonusLabel && <span>▲ {selectedTower.mapBonusLabel}</span>}
                        </div>
                        <div className="v31-selected-actions">
                            <button disabled={!selectedTower.canUpgrade() || hud.crystals < selectedTower.upgradeCost} onClick={upgradeSelected}>{selectedTower.canUpgrade() ? `Upgrade 💎${selectedTower.upgradeCost}` : 'Max Level'}</button>
                            <button onClick={sellSelected}>Sell ${Math.round(selectedTower.getSellValue() * difficulty.refundMult)}</button>
                        </div>
                    </div>}
                </aside>
            </main>

            {specializationPrompt && <div className="v31-modal"><div className="v31-modal-card"><h2>Choose Specialization</h2><p>This branch is permanent for this placed tower.</p><div className="v31-choice-grid">{specializationPrompt.choices.map(choice => <button key={choice.id} onClick={() => chooseSpecialization(choice.id)}><b>{choice.name}</b><span>{choice.desc}</span></button>)}</div></div></div>}

            {perkChoices && <div className="v31-modal"><div className="v31-modal-card"><h2>Roguelite Upgrade</h2><p>Choose one permanent bonus for the rest of this run.</p><div className="v31-choice-grid">{perkChoices.map(choice => <button key={choice.id} onClick={() => choosePerk(choice.id)}><b>{choice.name}</b><span>{choice.desc}</span></button>)}</div></div></div>}

            {endSummary && <div className="v31-modal"><div className="v31-modal-card v31-gameover"><h2>Run Complete</h2>
                <p>Wave <b>{endSummary.wave}</b> · Score <b>{endSummary.score.toLocaleString()}</b></p>
                <p>+{endSummary.cores} Cores · Map Stars: {'★'.repeat(endSummary.stars.totalStars)}{'☆'.repeat(3 - endSummary.stars.totalStars)}</p>
                {daily && <p>{endSummary.dailyComplete ? '✓ Daily challenge completed' : `Daily objective: reach wave ${daily.objectiveWave}`}</p>}
                {endSummary.masteryAwards.some(a => a.leveledUp) && <p>Mastery leveled up: {endSummary.masteryAwards.filter(a => a.leveledUp).length} tower(s)</p>}
                <div className="v31-gameover-actions"><Link to="/play3"><Button variant="outline-light">Maps</Button></Link><Link to="/upgrades"><Button variant="outline-light">Spend Cores</Button></Link><Link to="/scores"><Button variant="outline-light">Leaderboard</Button></Link></div>
            </div></div>}
        </div>
    );
};

export default GamePageV31;
