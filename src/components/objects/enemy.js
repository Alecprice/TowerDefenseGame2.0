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


export function Enemy(x, y, type, waveScale = 1, difficultyMult = 1) {
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
    else if (this.type === 6) {
        // Flyer: immune to Frost Tower's slow entirely (see applySlow) -
        // the counter-play is raw damage/range, not crowd control.
        this.maxHealth = 180;
        this.health = 180;
        this.speed = 1.3 + Math.random() / 5;
        this.atk = 1;
        this.value = 12;
        this.score = 220;
        this.immuneToSlow = true;
    }
    else if (this.type === 7) {
        // Teleporter: periodically blinks forward along the path (see
        // move()) - a moderate baseline speed with a dangerous spike
        // every couple seconds that can hop it past a slow-firing
        // tower's next shot entirely.
        this.maxHealth = 220;
        this.health = 220;
        this.speed = .9 + Math.random() / 5;
        this.atk = 2;
        this.value = 18;
        this.score = 260;
        this.nextTeleportAt = Date.now() + 1200 + Math.random() * 800;
    }
    else if (this.type === 8) {
        // Regenerator (Game 3.0 only): heals a slice of its max HP every
        // second, but only once it's gone a couple seconds without being
        // hit - see tick()'s regen handling and hit()'s recentlyHitUntil
        // stamp. Punishes "tag it once and move on" tactics; rewards
        // sustained fire or burst damage.
        this.maxHealth = 260;
        this.health = 260;
        this.speed = .55 + Math.random() / 8;
        this.atk = 2;
        this.value = 16;
        this.score = 240;
        this.regenPerSecond = this.maxHealth * 0.04;
    }
    else if (this.type === 9) {
        // Juggernaut (Game 3.0 only): takes sharply reduced splash
        // damage (splashResistance, read in Projectile.impact()) - a
        // dedicated counter to AOE-heavy builds, meant to reward keeping
        // at least one single-target tower (or Rapid Pierce) around.
        this.maxHealth = 420;
        this.health = 420;
        this.speed = .45 + Math.random() / 10;
        this.atk = 3;
        this.value = 22;
        this.score = 340;
        this.splashResistance = 0.65;
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

    // Difficulty tiers (see difficulty.js) hit attack damage directly,
    // separately from the wave-over-wave health scaling above - a
    // Math.max floor so low-atk types (atk: 1) still visibly step up a
    // point at the higher tiers instead of always rounding back down.
    if (difficultyMult !== 1) {
        this.atk = Math.max(this.atk, Math.round(this.atk * difficultyMult));
    }

    // Slow effects (from the Slower tower) multiply this instead of the
    // raw speed, and are bounded - see hit() below - so repeated hits
    // can't compound a target down toward a standstill.
    this.baseSpeed = this.speed;
    this.slowMultiplier = 1;
}

Enemy.prototype = {
    draw: function (ctx) {
        if (this.type === 6) {
            this.drawFlyer(ctx);
        } else if (this.type === 7) {
            this.drawTeleporter(ctx);
        } else if (this.type === 8) {
            this.drawRegenerator(ctx);
        } else if (this.type === 9) {
            this.drawJuggernaut(ctx);
        } else {
            const set = enemySprites[mapTheme.value] || enemySprites.grass;
            const sprite = set[this.type];
            if (sprite) {
                ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
            }
            else {
                ctx.drawImage(circle, this.x, this.y);
            }
        }
        this.drawStatusEffects(ctx);
    },
    // No sprite assets exist for these two (they were added well after
    // the sprite sheets), so they're drawn procedurally instead - same
    // approach as the towers in tower.js.
    drawFlyer: function (ctx) {
        const bob = Math.sin(Date.now() / 200 + this.x) * 3;
        const cx = this.x + this.width / 2, cy = this.y + this.height / 2 + bob;
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.ellipse(cx - 15, cy, 13, 5, Math.PI / 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 15, cy, 13, 5, -Math.PI / 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#caf0f8';
        ctx.strokeStyle = '#0077b6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 15);
        ctx.lineTo(cx + 9, cy);
        ctx.lineTo(cx, cy + 15);
        ctx.lineTo(cx - 9, cy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    },
    drawTeleporter: function (ctx) {
        const flashing = this.teleportFlashUntil && Date.now() < this.teleportFlashUntil;
        const cx = this.x + this.width / 2, cy = this.y + this.height / 2;
        ctx.save();
        ctx.strokeStyle = 'rgba(123, 44, 191, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 21, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = flashing ? 1 : 0.8;
        ctx.fillStyle = flashing ? '#ffffff' : '#7b2cbf';
        ctx.shadowColor = '#c77dff';
        ctx.shadowBlur = flashing ? 16 : 6;
        ctx.beginPath();
        ctx.arc(cx, cy, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },
    drawRegenerator: function (ctx) {
        const healing = !this.recentlyHitUntil || Date.now() > this.recentlyHitUntil;
        const pulse = healing ? 0.6 + Math.sin(Date.now() / 250) * 0.4 : 0;
        const cx = this.x + this.width / 2, cy = this.y + this.height / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, 17, 0, Math.PI * 2);
        ctx.fillStyle = '#6a994e';
        ctx.strokeStyle = '#386641';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
        // A small "+" that brightens while actively regenerating, fades
        // to nearly invisible while on cooldown from a recent hit - a
        // quick visual tell for whether it's currently healing.
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + pulse * 0.6})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx - 7, cy); ctx.lineTo(cx + 7, cy);
        ctx.moveTo(cx, cy - 7); ctx.lineTo(cx, cy + 7);
        ctx.stroke();
        ctx.restore();
    },
    drawJuggernaut: function (ctx) {
        const cx = this.x + this.width / 2, cy = this.y + this.height / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, 24, 0, Math.PI * 2);
        ctx.fillStyle = '#3d3d3d';
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 3;
        ctx.fill();
        ctx.stroke();
        // Plated rivets around the rim, evoking the splash-resistant
        // armor plating the mechanic is named for.
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(cx + Math.cos(a) * 19, cy + Math.sin(a) * 19, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#8d8d8d';
            ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#5c5c5c';
        ctx.fill();
        ctx.restore();
    },
    // Poison and slow are otherwise invisible except through their effects
    // (health draining, movement lagging) - draw a small ring so the
    // player can see at a glance which enemies are debuffed.
    drawStatusEffects: function (ctx) {
        const now = Date.now();
        const isPoisoned = this.poison && now < this.poison.expiresAt;
        const isSlowed = this.slowUntil && now < this.slowUntil;
        const isShielded = this.shieldHP > 0;
        if (!isPoisoned && !isSlowed && !isShielded) return;

        ctx.save();
        ctx.lineWidth = 2;
        if (isShielded) {
            // A steady, solid double ring - visually distinct from the
            // pulsing poison ring and the dashed slow ring, since a
            // shield is a static "still absorbing" state rather than a
            // ticking or fading effect.
            ctx.strokeStyle = 'rgba(186, 220, 255, 0.9)';
            ctx.beginPath();
            ctx.arc(this.mid.x, this.mid.y, this.width / 2 + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(186, 220, 255, 0.45)';
            ctx.beginPath();
            ctx.arc(this.mid.x, this.mid.y, this.width / 2 + 7, 0, Math.PI * 2);
            ctx.stroke();
        }
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
        // A small floating bar above the enemy rather than a stripe
        // drawn on top of the sprite - it needs to read clearly at a
        // glance during a crowded wave, shrink smoothly as hits land,
        // and disappear the instant the enemy does (this only ever runs
        // for enemies still in the array - see GamePage's death/end
        // cleanup, which splices them out the same frame).
        const pct = Math.max(0, Math.min(1, this.health / this.maxHealth));
        const barW = this.width * 0.8;
        const barH = 5;
        const barX = this.x + (this.width - barW) / 2;
        const barY = this.y - 9;

        ctx.save();
        // Dark track so the bar reads on any background/theme, plus a
        // faint border so it doesn't blend into dark sprites either.
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

        // Green -> yellow -> red as health drops, not just a static red
        // stripe, so remaining health is readable even at a glance/from
        // a distance without reading the exact bar length.
        let fillColor;
        if (pct > 0.6) fillColor = '#4ade80';
        else if (pct > 0.3) fillColor = '#facc15';
        else fillColor = '#ef4444';

        ctx.fillStyle = fillColor;
        ctx.fillRect(barX, barY, barW * pct, barH);

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);
        ctx.restore();
    },
    move: function (path) {
        if (!this.end) {
            // Teleporter: every couple seconds, take one much larger step
            // toward its current waypoint instead of a normal one - the
            // "blink" that makes it dangerous, since it can close most
            // of the gap to a tower (or hop past it) between two shots.
            if (this.type === 7 && this.waypoint < path.length && Date.now() >= this.nextTeleportAt) {
                this.nextTeleportAt = Date.now() + 2200;
                this.teleportFlashUntil = Date.now() + 250;
                const jumpDist = 70;
                let jDistX = path[this.waypoint].x - this.x;
                let jDistY = path[this.waypoint].y - this.y;
                let jAngle = Math.atan2(jDistY, jDistX);
                this.x += jumpDist * Math.cos(jAngle);
                this.y += jumpDist * Math.sin(jAngle);
                this.distance += jumpDist;
                if ((jDistX < 0 ? -jDistX : jDistX) + (jDistY < 0 ? -jDistY : jDistY) < jumpDist) {
                    this.waypoint++;
                }
                this.mid.x = this.x + this.width / 2;
                this.mid.y = this.y + this.height / 2;
            }

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
        let dealt = this.armor ? Math.max(1, damage - this.armor) : damage;
        // Shielded enemies (see GamePage's spawn logic) absorb damage
        // into shieldHP first - the shield has to be fully worn down
        // before any of a hit starts touching real health.
        if (this.shieldHP > 0) {
            const absorbed = Math.min(this.shieldHP, dealt);
            this.shieldHP -= absorbed;
            dealt -= absorbed;
        }
        this.health -= dealt;
        if (dealt > 0) {
            // Only used by Regenerator (type 8, Game 3.0) - see tick() -
            // but stamped on every enemy uniformly rather than gated by
            // type, so it stays correct if a future type wants it too.
            this.recentlyHitUntil = Date.now() + 2000;
        }
        if (this.health <= 0) {
            this.dead = true;
        }
        return dealt; // actual health damage dealt - 0 if a shield fully absorbed the hit
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
        if (!floor || this.immuneToSlow) return;
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
        if (this.regenPerSecond && !this.dead && (!this.recentlyHitUntil || now > this.recentlyHitUntil)) {
            this.health = Math.min(this.maxHealth, this.health + this.regenPerSecond * dtSeconds);
        }
    }
}
