import { Projectile } from './projectile';

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
            this.fire = false;
            this.timer = Date.now();
        } else if ((Date.now() - this.timer) / 1000 >= this.fireRate) {
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
    },
    sell: function () {
        this.sold = true;
        // Refund scales with level so upgrading isn't a pure loss if you sell later.
        return Math.round((this.price / 2) * (1 + 0.25 * (this.level - 1)));
    }
}
