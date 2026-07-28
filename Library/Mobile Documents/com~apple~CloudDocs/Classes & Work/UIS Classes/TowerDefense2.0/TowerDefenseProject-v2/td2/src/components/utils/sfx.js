import { Howl } from 'howler';

import fireStrikerSrc from '../assets/audioClips/fire_striker.wav';
import fireSlowerSrc from '../assets/audioClips/fire_slower.wav';
import fireBlasterSrc from '../assets/audioClips/fire_blaster.wav';
import fireBurnerSrc from '../assets/audioClips/fire_burner.wav';
import enemyDeathSrc from '../assets/audioClips/enemy_death.wav';
import bossDeathSrc from '../assets/audioClips/boss_death.wav';
import buyTowerSrc from '../assets/audioClips/buy_tower.wav';
import unlockTowerSrc from '../assets/audioClips/unlock_tower.wav';
import upgradeTowerSrc from '../assets/audioClips/upgrade_tower.wav';
import uiClickSrc from '../assets/audioClips/ui_click.wav';

// Howler pools/overlaps plays automatically per Howl instance, so rapid
// tower fire or simultaneous enemy deaths won't cut each other off.
const fireSounds = {
    1: new Howl({ src: [fireStrikerSrc] }),
    2: new Howl({ src: [fireSlowerSrc] }),
    3: new Howl({ src: [fireBlasterSrc] }),
    4: new Howl({ src: [fireBurnerSrc] }),
};
const enemyDeathSound = new Howl({ src: [enemyDeathSrc] });
const bossDeathSound = new Howl({ src: [bossDeathSrc] });
const buyTowerSound = new Howl({ src: [buyTowerSrc] });
const unlockTowerSound = new Howl({ src: [unlockTowerSrc] });
const upgradeTowerSound = new Howl({ src: [upgradeTowerSrc] });
const uiClickSound = new Howl({ src: [uiClickSrc], volume: 0.6 });

// Simple global mute the pause/settings menu can toggle. Defaults to on.
let sfxEnabled = true;
export function setSfxEnabled(enabled) {
    sfxEnabled = enabled;
}
export function isSfxEnabled() {
    return sfxEnabled;
}

export function playTowerFire(type) {
    if (!sfxEnabled) return;
    const sound = fireSounds[type];
    if (sound) sound.play();
}

export function playEnemyDeath(isBoss) {
    if (!sfxEnabled) return;
    (isBoss ? bossDeathSound : enemyDeathSound).play();
}

export function playBuyTower() {
    if (!sfxEnabled) return;
    buyTowerSound.play();
}

export function playUnlockTower() {
    if (!sfxEnabled) return;
    unlockTowerSound.play();
}

export function playUpgradeTower() {
    if (!sfxEnabled) return;
    upgradeTowerSound.play();
}

export function playUiClick() {
    if (!sfxEnabled) return;
    uiClickSound.play();
}
