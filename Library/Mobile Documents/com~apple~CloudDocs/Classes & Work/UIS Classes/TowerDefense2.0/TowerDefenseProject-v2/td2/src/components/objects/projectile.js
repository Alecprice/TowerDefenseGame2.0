
import { gameSpeed } from '../utils/gameSpeed';
import circleImg from "./circle.png";
import boltImg from '../assets/images/projectiles/proj1_bolt.png';
import iceImg from '../assets/images/projectiles/proj2_ice.png';
import sparkImg from '../assets/images/projectiles/proj3_spark.png';
const circle = new Image();
circle.src = circleImg;
const bolt = new Image();
bolt.src = boltImg;
const ice = new Image();
ice.src = iceImg;
const spark = new Image();
spark.src = sparkImg;

const projectileSprites = { 1: bolt, 2: ice, 3: spark };

export function Projectile(x, y, type, target, dmgMultiplier = 1) {
    this.x = x;
    this.y = y;
    this.width = 5;
    this.height = 5;
    this.type = type;
    this.target = target;
    this.end = false;
    if (this.type === 1) {
        this.speed = 5;
        this.pwr = 50
    }
    else if (this.type === 2) {
        this.speed = 5;
        this.pwr = 10;
        this.slow = true;
    }
    else if(this.type === 3) {
        this.speed = 5;
        this.pwr = 20;
    }
    this.pwr = Math.round(this.pwr * dmgMultiplier);
}

Projectile.prototype = {
    draw: function (ctx) {
        const sprite = projectileSprites[this.type] || circle;
        ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
    },
    move: function () {
        if (this.target && !this.end) {
            let distX = this.target.mid.x - this.x;
            let distY = this.target.mid.y - this.y;
            let angle = Math.atan2(distY, distX);
            const step = this.speed * gameSpeed.value;

            this.x += step * Math.cos(angle);
            this.y += step * Math.sin(angle);
            if ((distX < 0 ? -distX : distX) + (distY < 0 ? -distY : distY) < step) {
                this.target.hit(this);
                this.end = true;
            }
        }
        else {
            this.end = true;
        }
    },

}