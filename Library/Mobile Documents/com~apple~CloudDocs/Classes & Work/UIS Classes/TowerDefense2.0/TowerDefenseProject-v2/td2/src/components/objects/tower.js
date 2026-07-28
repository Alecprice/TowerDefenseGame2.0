import { Projectile } from './projectile';
import { gameSpeed } from '../utils/gameSpeed';
import { playTowerFire, playUpgradeTower } from '../utils/sfx';

import tower1_lvl1 from '../assets/images/towers/tower1_lvl1.png';
import tower1_lvl2 from '../assets/images/towers/tower1_lvl2.png';
import tower1_lvl3 from '../assets/images/towers/tower1_lvl3.png';
import tower2_lvl1 from '../assets/images/towers/tower2_lvl1.png';
import tower2_lvl2 from '../assets/images/towers/tower2_lvl2.png';
import tower2_lvl3 from '../assets/images/towers/tower2_lvl3.png';
import tower3_lvl1 from '../assets/images/towers/tower3_lvl1.png';
import tower3_lvl2 from '../assets/images/towers/tower3_lvl2.png';
import tower3_lvl3 from '../assets/images/towers/tower3_lvl3.png';
import tower4_lvl1 from '../assets/images/towers/tower4_lvl1.png';
import tower4_lvl2 from '../assets/images/towers/tower4_lvl2.png';
import tower4_lvl3 from '../assets/images/towers/tower4_lvl3.png';

function loadImg(src) {
    const img = new Image();
    img.src = src;
    return img;
}

// towerSprites[type][level] -> HTMLImageElement
const towerSprites = {
    1: { 1: loadImg(tower1_lvl1), 2: loadImg(tower1_lvl2), 3: loadImg(tower1_lvl3) },
    2: { 1: loadImg(tower2_lvl1), 2: loadImg(tower2_lvl2), 3: loadImg(tower2_lvl3) },
    3: { 1: loadImg(tower3_lvl1), 2: loadImg(tower3_lvl2), 3: loadImg(tower3_lvl3) },
    4: { 1: loadImg(tower4_lvl1), 2: loadImg(tower4_lvl2), 3: loadImg(tower4_lvl3) },
};

export function Tower(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = 50;
    this.height = 50;
    this.mid = { x: this.x + this.width / 2, y: this.y + this.height / 2 };
    this.timer = Date.now();
    this.fire = true;
    this.sold = false;
    this.level = 1;
    this.maxLevel = 3;
    if (this.type === 1) {
        this.range = 150;
        this.fireRate = 1;
        this.projectile = 1;
        this.price = 10;
    }
    else if (this.type === 2) {
        this.range = 110;
        this.fireRate = 1;
        this.projectile = 2;
        this.price = 20;
    }
    else if (this.type === 3) {
        this.range = 120;
        this.fireRate = 1;
        this.projectile = 3;
        this.price = 30;
    }
    else if (this.type === 4) {
        this.range = 110;
        this.fireRate = 1;
        this.projectile = 2;
        this.price = 40;
    }
    this.baseRange = this.range;
    this.baseFireRate = this.fireRate;
    this.dmgMultiplier = 1;
    this.upgradeCost = Math.round(this.price * 0.75);
}

Tower.prototype = {
    draw: function (ctx) {
        if (this.upgradeGlowUntil && Date.now() < this.upgradeGlowUntil) {
            const remaining = this.upgradeGlowUntil - Date.now();
            const totalDuration = 1200 * this.level;
            const fade = Math.min(1, remaining / totalDuration);
            const pulse = 0.75 + 0.25 * Math.sin(Date.now() / 90);
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.mid.x, this.mid.y, (this.height / 2 + 10) * pulse, 0, Math.PI * 2, true);
            ctx.fillStyle = `rgba(${this.upgradeGlowColor}, ${0.45 * fade})`;
            ctx.shadowColor = `rgba(${this.upgradeGlowColor}, ${0.9 * fade})`;
            ctx.shadowBlur = 18 * fade;
            ctx.fill();
            ctx.restore();
        }

        const sprite = towerSprites[this.type] && towerSprites[this.type][this.level];
        if (sprite) {
            ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
            return;
        }
        // Fallback in case a sprite failed to load - keeps the game playable.
        if (this.type === 1) {
            ctx.fillStyle = 'red';
        }
        else if (this.type === 2) {
            ctx.fillStyle = 'blue';
        }
        else if (this.type === 3) {
            ctx.fillStyle = 'yellow';
        }
        else {
            ctx.fillStyle = 'green';
        }
        ctx.beginPath();
        ctx.arc(this.mid.x, this.mid.y, this.height/2, 0, Math.PI * 2, true);
        ctx.fill();
    },
    drawRange: function (ctx) {
        ctx.beginPath();
        ctx.strokeStyle = 'white';
        ctx.arc(this.mid.x, this.mid.y, this.range, 0, Math.PI * 2, true);
        ctx.stroke();
    },
    inRange: function (enemy) {
        return (this.mid.x - enemy.mid.x) * (this.mid.x - enemy.mid.x) + (this.mid.y - enemy.mid.y) * (this.mid.y - enemy.mid.y) < this.range * this.range
    },
    shoot: function (bullets, enemies) {
        if (this.fire && enemies.length > 0) {
            if (this.type === 3) {
                for (let i = 0; i < enemies.length; i++) {
                    bullets.push(new Projectile(this.mid.x, this.mid.y, this.projectile, enemies[i], this.dmgMultiplier));
                }
            }
            let sortDist = enemies.sort((a, b) => b.distance - a.distance);
            let enemy = sortDist[0];
            if (this.type === 2) {
                enemy = sortDist.sort((a, b) => b.speed - a.speed)[0];
            }
            if (this.type !== 3) {
                bullets.push(new Projectile(this.mid.x, this.mid.y, this.projectile, enemy, this.dmgMultiplier));
            }
            playTowerFire(this.type);
            this.fire = false;
            this.timer = Date.now();
        } else if ((Date.now() - this.timer) / 1000 * gameSpeed.value >= this.fireRate) {
            this.fire = true;
        }
    },
    canUpgrade: function () {
        return this.level < this.maxLevel;
    },
    upgrade: function () {
        if (!this.canUpgrade()) return;
        this.level++;
        this.range = this.baseRange * (1 + 0.15 * (this.level - 1));
        this.fireRate = this.baseFireRate * (1 - 0.15 * (this.level - 1));
        this.dmgMultiplier = 1 + 0.5 * (this.level - 1);
        this.upgradeCost = Math.round(this.price * 0.75 * this.level);

        // Temporary glow aura: color changes per level, and duration scales
        // with level so each successive upgrade's aura lingers longer.
        const UPGRADE_GLOW_COLORS = { 2: '80, 200, 255', 3: '255, 170, 40' };
        this.upgradeGlowColor = UPGRADE_GLOW_COLORS[this.level] || '255, 255, 255';
        this.upgradeGlowUntil = Date.now() + 1200 * this.level;

        playUpgradeTower();
    },
    sell: function () {
        this.sold = true;
        // Refund scales with level so upgrading isn't a pure loss if you sell later.
        return Math.round((this.price / 2) * (1 + 0.25 * (this.level - 1)));
    }
}
