import { collision } from '../utils/utils';
import { mapTheme } from '../utils/mapTheme';

import pathGrass from '../assets/images/tiles/path.png';
import buildableGrass from '../assets/images/tiles/buildable.png';
import pathDesert from '../assets/images/tiles/path_desert.png';
import buildableDesert from '../assets/images/tiles/buildable_desert.png';
import pathSnow from '../assets/images/tiles/path_snow.png';
import buildableSnow from '../assets/images/tiles/buildable_snow.png';
import pathVolcanic from '../assets/images/tiles/path_volcanic.png';
import buildableVolcanic from '../assets/images/tiles/buildable_volcanic.png';

function loadImg(src) {
    const img = new Image();
    img.src = src;
    return img;
}

const TILES = {
    grass: { path: loadImg(pathGrass), buildable: loadImg(buildableGrass) },
    desert: { path: loadImg(pathDesert), buildable: loadImg(buildableDesert) },
    snow: { path: loadImg(pathSnow), buildable: loadImg(buildableSnow) },
    volcanic: { path: loadImg(pathVolcanic), buildable: loadImg(buildableVolcanic) },
};

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
        const set = TILES[mapTheme.value] || TILES.grass;
        if (this.type === 0) {
            ctx.drawImage(set.buildable, this.x, this.y, this.width, this.height);
        } else {
            ctx.drawImage(set.path, this.x, this.y, this.width, this.height);
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
