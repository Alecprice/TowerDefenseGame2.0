import { maps } from '../data/maps';
import { expansionMaps } from '../data/expansionMaps';
import { expansionMapsV32 } from '../data/expansionMapsV32';
import { TOWER_DEFS_V3, TOWER_TYPES_V3 } from '../objects/towerDefsV3';
import { EXPANSION_TOWER_DEFS_V3, EXPANSION_TOWER_TYPES_V3 } from '../objects/towerExpansionV3';
import { Enemy } from '../objects/enemy';
import { applyGameModeToEnemy } from './gameModes';

let installed = false;

export function installExpansionContent() {
    if (installed) return;
    installed = true;

    const existingMapNames = new Set(maps.map(m => m.name));
    [...expansionMaps, ...expansionMapsV32].forEach(map => {
        if (!existingMapNames.has(map.name)) {
            maps.push(map);
            existingMapNames.add(map.name);
        }
    });

    Object.assign(TOWER_DEFS_V3, EXPANSION_TOWER_DEFS_V3);
    const existingTowerTypes = new Set(TOWER_TYPES_V3);
    EXPANSION_TOWER_TYPES_V3.forEach(type => {
        if (!existingTowerTypes.has(type)) TOWER_TYPES_V3.push(type);
    });
    TOWER_TYPES_V3.sort((a, b) => a - b);

    if (!Enemy.prototype.__tdModeWrapped) {
        const originalMove = Enemy.prototype.move;
        Enemy.prototype.move = function expandedMove(path) {
            if (!this.__tdModeApplied) {
                this.__tdModeApplied = true;
                applyGameModeToEnemy(this);
                this.baseSpeed = this.speed;
            }
            return originalMove.call(this, path);
        };
        Enemy.prototype.__tdModeWrapped = true;
    }
}

installExpansionContent();
