import { gameSpeed } from '../utils/gameSpeed';
import { mapTheme } from '../utils/mapTheme';
import circleImg from "./circle.png";
import type1Image from '../assets/images/Type1.png';
import type2Image from '../assets/images/Type2.png';
import type3Image from '../assets/images/enemies/Type3.png';
import type4Image from '../assets/images/enemies/Type4.png';
import type5Image from '../assets/images/enemies/Type5.png';

import type1Desert from '../assets/images/enemies/Type1_desert.png';
import type2Desert from '../assets/images/enemies/Type2_desert.png';
import type3Desert from '../assets/images/enemies/Type3_desert.png';
import type4Desert from '../assets/images/enemies/Type4_desert.png';
import type5Desert from '../assets/images/enemies/Type5_desert.png';

import type1Snow from '../assets/images/enemies/Type1_snow.png';
import type2Snow from '../assets/images/enemies/Type2_snow.png';
import type3Snow from '../assets/images/enemies/Type3_snow.png';
import type4Snow from '../assets/images/enemies/Type4_snow.png';
import type5Snow from '../assets/images/enemies/Type5_snow.png';

import type1Volcanic from '../assets/images/enemies/Type1_volcanic.png';
import type2Volcanic from '../assets/images/enemies/Type2_volcanic.png';
import type3Volcanic from '../assets/images/enemies/Type3_volcanic.png';
import type4Volcanic from '../assets/images/enemies/Type4_volcanic.png';
import type5Volcanic from '../assets/images/enemies/Type5_volcanic.png';

function loadImg(src) {
    const img = new Image();
    img.src = src;
    return img;
}

const circle = loadImg(circleImg);

// enemySprites[theme][type] -> HTMLImageElement
const enemySprites = {
    grass: { 1: loadImg(type1Image), 2: loadImg(type2Image), 3: loadImg(type3Image), 4: loadImg(type4Image), 5: loadImg(type5Image) },
    desert: { 1: loadImg(type1Desert), 2: loadImg(type2Desert), 3: loadImg(type3Desert), 4: loadImg(type4Desert), 5: loadImg(type5Desert) },
    snow: { 1: loadImg(type1Snow), 2: loadImg(type2Snow), 3: loadImg(type3Snow), 4: loadImg(type4Snow), 5: loadImg(type5Snow) },
    volcanic: { 1: loadImg(type1Volcanic), 2: loadImg(type2Volcanic), 3: loadImg(type3Volcanic), 4: loadImg(type4Volcanic), 5: loadImg(type5Volcanic) },
};


export function Enemy(x, y, type, waveScale = 1) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 50;
    this.mid = { x: this.x + this.width / 2, y: this.y + this.height / 2 };
    this.type = type;
    this.waypoint = 0;
    this.distance = 0;
    this.end = false;
    this.dead = false;
    if (this.type === 1) {
        this.maxHealth = 150;
        this.health = 150;
        this.speed = .5 + Math.random()/5;
        this.atk = 1;
        this.value = 5;
        this.score = 100;
    }
    else if (this.type === 2) {
        this.maxHealth = 100;
        this.health = 100;
        this.speed = 2 + Math.random() / 5;
        this.atk = 1;
        this.value = 10;
        this.score = 200;
    }
    else if (this.type === 3) {
        this.maxHealth = 500;
        this.health = 500;
        this.speed = .75 + Math.random() / 5;
        this.atk = 5;
        this.value = 50;
        this.score = 1000;
    }
    else if (this.type === 4) {
        // Armored: tanky and shrugs off a flat chunk of every hit.
        this.maxHealth = 350;
        this.health = 350;
        this.speed = .4 + Math.random() / 10;
        this.atk = 2;
        this.value = 15;
        this.score = 300;
        this.armor = 8;
    }
    else if (this.type === 5) {
        // Boss: huge health pool, scaled further per boss tier by the caller.
        this.maxHealth = 3000;
        this.health = 3000;
        this.speed = .35;
        this.atk = 10;
        this.value = 150;
        this.score = 2500;
        this.width = 70;
        this.height = 70;
    }
    this.mid = { x: this.x + this.width / 2, y: this.y + this.height / 2 };

    // Wave-based difficulty scaling (skipped for bosses, which already get
    // their own tier-based scaling from the caller). HP scales at the full
    // rate so late waves stay a real threat; money/score scale at a slower
    // rate so the economy doesn't spiral alongside it.
    if (waveScale !== 1 && this.type !== 5) {
        this.maxHealth = Math.round(this.maxHealth * waveScale);
        this.health = this.maxHealth;
        this.value = Math.round(this.value * (1 + (waveScale - 1) * 0.6));
        this.score = Math.round(this.score * waveScale);
    }

    // Slow effects (from the Slower tower) multiply this instead of the
    // raw speed, and are bounded - see hit() below - so repeated hits
    // can't compound a target down toward a standstill.
    this.baseSpeed = this.speed;
    this.slowMultiplier = 1;
}

Enemy.prototype = {
    draw: function (ctx) {
        const set = enemySprites[mapTheme.value] || enemySprites.grass;
        const sprite = set[this.type];
        if (sprite) {
            ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
        }
        else {
            ctx.drawImage(circle, this.x, this.y);
        }
        this.drawStatusEffects(ctx);
    },
    // Poison and slow are otherwise invisible except through their effects
    // (health draining, movement lagging) - draw a small ring so the
    // player can see at a glance which enemies are debuffed.
    drawStatusEffects: function (ctx) {
        const now = Date.now();
        const isPoisoned = this.poison && now < this.poison.expiresAt;
        const isSlowed = this.slowUntil && now < this.slowUntil;
        if (!isPoisoned && !isSlowed) return;

        ctx.save();
        ctx.lineWidth = 2;
        if (isPoisoned) {
            const pulse = 0.5 + 0.5 * Math.sin(now / 150);
            ctx.strokeStyle = `rgba(124, 181, 24, ${0.55 + 0.35 * pulse})`;
            ctx.beginPath();
            ctx.arc(this.mid.x, this.mid.y, this.width / 2 + 3, 0, Math.PI * 2);
            ctx.stroke();
        }
        if (isSlowed) {
            ctx.strokeStyle = 'rgba(72, 202, 228, 0.85)';
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(this.mid.x, this.mid.y, this.width / 2 + (isPoisoned ? 8 : 3), 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        ctx.restore();
    },
    drawHealth: function (ctx) {
        /*ctx.fillStyle = 'black';
        ctx.fillRect(this.x, this.y, this.width, this.height / 8);*/
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y, this.width * (this.health / this.maxHealth), this.height / 8);
    },
    move: function (path) {
        if (!this.end) {
            let distX = path[this.waypoint].x - this.x;
            let distY = path[this.waypoint].y - this.y;
            let angle = Math.atan2(distY, distX);
            const step = this.speed * gameSpeed.value;

            this.x += step * Math.cos(angle);
            this.y += step * Math.sin(angle);
            this.mid.x = this.x + this.width / 2;
            this.mid.y = this.y + this.height / 2;
            this.distance += step;

            if ((distX < 0 ? -distX : distX) + (distY < 0 ? -distY : distY) < step) {
                this.waypoint++;
            }
        }
        //if (Math.round(this.x) === path[this.waypoint].x && Math.round(this.y) === path[this.waypoint].y) {
        if (this.waypoint >= path.length) {
            this.end = true;
        }
    },
    /*
    hit: function (bullets) {
        for (let i = 0; i < bullets.length; i++) {
            if (collision(this, bullets[i])) {
                this.health -= bullets[i].pwr;
                if (bullets[i].slow) {
                }
                    this.speed -= .25;
                bullets.splice(i, 1);
                i--;
            }
        }
        if (this.health <= 0) {
            this.dead = true;
        }
       
    }*/
    hit: function (damage) {
        const dealt = this.armor ? Math.max(1, damage - this.armor) : damage;
        this.health -= dealt;
        if (this.health <= 0) {
            this.dead = true;
        }
    },
    // Poison never stacks: a fresh hit just refreshes the timer and takes
    // the stronger of the current/incoming DPS, rather than adding a
    // second independent DOT on top.
    applyPoison: function (dps, durationMs) {
        if (!dps) return;
        const now = Date.now();
        const currentDps = (this.poison && now < this.poison.expiresAt) ? this.poison.dps : 0;
        this.poison = {
            dps: Math.max(currentDps, dps),
            expiresAt: now + durationMs,
        };
    },
    // Bounded slow: floors at `floor` (a fraction of base speed) instead of
    // compounding toward zero the more times it's hit.
    applySlow: function (floor) {
        if (!floor) return;
        this.slowMultiplier = Math.min(this.slowMultiplier, floor);
        this.speed = this.baseSpeed * this.slowMultiplier;
        this.slowUntil = Date.now() + 1500;
    },
    // Called once per frame from the game loop (independent of being hit
    // this frame) to apply poison ticks and let an expired slow wear off.
    tick: function (dtSeconds) {
        const now = Date.now();
        if (this.poison && now < this.poison.expiresAt) {
            this.health -= this.poison.dps * dtSeconds;
            if (this.health <= 0) this.dead = true;
        } else if (this.poison) {
            this.poison = null;
        }
        if (this.slowUntil && now > this.slowUntil) {
            this.slowMultiplier = 1;
            this.speed = this.baseSpeed;
            this.slowUntil = null;
        }
    }
}
