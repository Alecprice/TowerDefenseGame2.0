# Tower Defense — Quick Start Guide

## Installation & Running

```bash
cd TowerDefenseProject
npm install --legacy-peer-deps
npm run dev
```

The app opens at `http://localhost:3000` (or whatever port Vite reports).

### Production Build
```bash
npm run build
```
Output goes to `build/`, ready to deploy.

### Tests / Lint
```bash
npm test    # vitest — includes tower.test.js and enemy.test.js
npm run lint
```

---

## Testing the Features

### 1. Map picker
- From the home screen, click "Play" → you land on `/play` with all 20
  maps shown as cards, each with a small preview of that map's actual
  layout.
- Only the first map is unlocked at the start. The rest show a lock icon
  and a "reach wave 5 on [previous map]" note, and aren't clickable.
- Reach wave 5 on a map to unlock the next one.

### 2. Tower tray (10 types)
- Only the Striker (red circle) is unlocked at the very start. The other
  9 unlock at wave milestones — waves 3, 6, 9, 12, 15, 18, 21, 24, 27 (see
  `TOWER_UNLOCK_WAVE` in `progression.js`) — shared globally across every
  map, not per-map.
- Locked towers show a 🔒 icon and can't be dragged.
- Each tray icon shows the tower's actual in-game shape/color and its
  name (15 towers don't fit on sight alone the way 4 did).

### 3. Placing and upgrading towers
- Drag a tower from the tray onto a buildable (non-path) tile while the
  game is playing.
- Click a placed tower to open its popup: shows name, level (out of 5),
  and buttons to pay gold to upgrade or sell for a refund.
- **Upgrades are per-tower and reset each round** — there's no separate
  free/automatic upgrade system anymore, so what you see in the popup is
  the whole story.
- A tower gains a translucent ring per upgrade level and a small level
  badge once it's above level 1 — you can tell a tower is upgraded just
  by looking at the board.

### 4. Special tower behaviors worth specifically checking
- **Bank**: place one, don't build any attack towers near it, and watch
  your money climb on its own even without kills.
- **Beacon**: place one next to a Striker, select the Striker, and note
  its range circle — then sell the Beacon and reselect the Striker; the
  range should shrink back down immediately.
- **Bulwark**: on a non-boss wave it should never fire (no projectiles
  from it at all); on a wave that's a multiple of 5, a boss spawns and it
  should start firing.
- **Toxin Spire**: hit an enemy with it twice in a row — health should
  drain at one consistent rate, not accelerate, and a green ring should
  show on the enemy while poisoned.
- **Frost Tower**: hit the same enemy repeatedly — it slows to a floor and
  stays there, it doesn't keep getting slower forever. A cyan dashed ring
  shows while slowed.

### 5. Music
- Checkbox at the top of the game screen. Off by default (browsers require
  a user gesture before audio can start). Each map has its own small
  procedurally generated tune — no audio files involved, so it's instant
  and consistent every time you replay that map.

### 6. Mobile / touch
- Drag towers by touch same as mouse (Pointer Events).
- Below 900px width the panel moves below the canvas; the 15-tower tray
  stays a 5-column grid at every width down to small phones.
- Map preview cards stack to a single column on narrow screens.

### 7. Leaderboard
- Same as before: enter a name after game over, check `/scores`.

---

## Developer Notes

### Check progression data
```javascript
// Browser console:
JSON.parse(localStorage.getItem('td_progression'))
// { towerUnlocks: [10 booleans], mapWavesCompleted: [20 numbers], mapHighestWaves: [20 numbers] }
```

### Reset everything
```javascript
localStorage.clear()
// then reload
```

### Adjusting balance
- Tower stats/prices: edit `TOWER_DEFS` in `src/components/objects/tower.js`
  — every level for every tower is a plain data table there.
- Tower unlock waves: `TOWER_UNLOCK_WAVE` in `src/components/utils/progression.js`.
- Per-map difficulty: `enemyProfile` on each map entry in
  `src/components/data/maps.js` (`speedMult`, `healthMult`, `armoredChance`,
  `tankChance`).
- Wave-over-wave HP scaling: the `waveScale` calculation in `GamePage.jsx`'s
  spawn logic.

### Adding a map
Add an entry to the `maps` array in `src/components/data/maps.js` with
`name`, `theme`, a 12×18 `grid` (0 = buildable, 1 = path), a `waypoints`
array, and an `enemyProfile`. The map preview and music are both derived
automatically from this data — no extra assets to add.

### Adding a tower
Add an entry to `TOWER_DEFS` in `tower.js` with a `category` (reuse an
existing one, or add a new branch to `Tower.prototype.shoot()` /
`Projectile.prototype.impact()` for genuinely new behavior), a `shape`
(add a new case to `drawShape()` if you want a new silhouette), a `color`,
and a 5-entry `levels` array. It'll automatically appear in the tray and
be included in the unlock-wave rotation if you add it to
`TOWER_UNLOCK_WAVE`.

---

Enjoy the game! 🎮
