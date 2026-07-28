import { collision } from '../utils/utils';
import pathImg from '../assets/images/tiles/path.png';
import buildableImg from '../assets/images/tiles/buildable.png';

const pathTile = new Image();
pathTile.src = pathImg;
const buildableTile = new Image();
buildableTile.src = buildableImg;

export function Block(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = 50;
    this.height = 50;
    this.tower = false;
    this.hover = false;
}

Block.prototype = {
    draw: function (ctx) {
        if (this.type === 0) {
            ctx.drawImage(buildableTile, this.x, this.y, this.width, this.height);
        } else {
            ctx.drawImage(pathTile, this.x, this.y, this.width, this.height);
        }
        if (this.hover && this.type !== 1) {
            ctx.fillStyle = "rgba(255, 255, 255, .5)";
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    },
    mouseIsOver: function (mouse) {
        if (mouse.x && mouse.y && collision(this, mouse)) {
            this.hover = true;
        } else {
            this.hover = false;
        }
    },
    removeSoldTowers: function () {
        if (this.tower && this.tower.sold) {
            this.tower = false;
        }
    }
}