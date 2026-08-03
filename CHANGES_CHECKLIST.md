# Changes Checklist

This file tracks what's actually been done to the project, most recent
first. (The version of this file describing the original ASP.NET removal
and the first 4-tower progression system is superseded by everything
below — that system was replaced, not extended.)

## ✅ Round 2: 10-tower rewrite, 20 maps, procedural art/music, polish pass

### Bug fixes carried over from the Round 1 review
- [x] Fixed the upgrade popup silently corrupting a tower's stats (two
      independent upgrade systems both wrote to the same fields)
- [x] Fixed the render loop and all pointer listeners rebuilding
      themselves on every React render (`Canvas.jsx`, `Draggable.jsx`)
- [x] Fixed unbounded slow-effect stacking (now floored)
- [x] Fixed stray projectiles homing in on already-dead enemies
- [x] Removed dead enemy Type 3 (now actually wired into spawns)

### Tower system rewrite
- [x] Expanded from 4 to 10 tower types, 5 levels each (base + 4 upgrades)
- [x] Single data-driven `TOWER_DEFS` catalog — the only place tower stats
      live, by design, so the old dual-system bug class can't recur
- [x] Added 5 special tower categories beyond plain attack: poison
      (non-stacking DOT), slow (floored), bank (passive income), boss
      hunter (only fires on boss waves), support/aura (buffs nearby towers)
- [x] Procedural shape/color rendering for every tower — no PNG art
      needed; old tower/projectile PNG assets removed as dead files
- [x] Visible per-level upgrade indicators: persistent ring per level,
      numeric level badge, brief pulse on upgrade
- [x] Upgrades are manual/gold-only now — no separate automatic system
- [x] Tower unlock schedule generalized to 10 towers
      (`TOWER_UNLOCK_WAVE` in `progression.js`)

### Maps
- [x] Expanded from 12 to 20 maps
- [x] Every map has a distinct `enemyProfile` (speed/health multipliers,
      armored/tank spawn chance) for mechanical, not just visual, variety
- [x] Map picker (`/play`) now shows a real preview of each map's layout
      before you commit, built from the map's own grid/waypoint data
- [x] Map picker now actually shows and enforces lock state (previously
      it silently let you navigate into locked maps)

### Audio
- [x] Replaced the single shared mp3 background track with a procedurally
      generated per-map chiptune (Web Audio oscillators, no audio files,
      deterministic per map index)
- [x] New tower types mapped to the closest-fitting existing sound effect
      instead of firing silently

### Visual polish
- [x] Poisoned/slowed enemies now show a status-effect ring on the board
- [x] Enemy status-effect rendering unit-tested (`enemy.test.js`)

### Verification
- [x] `npm run build` clean
- [x] `npm run lint` — 0 errors (only pre-existing style warnings)
- [x] `npm test` — 31 tests passing, including new unit tests covering
      upgrade math, sell value, poison non-stacking, slow flooring, and
      Bank/Bulwark firing conditions
- [x] Live Playwright playthrough: map picker, tower placement, upgrade
      popup, a played round — zero console/page errors
- [x] Mobile-width (375px) layout checked: no horizontal overflow, tray
      and map-preview grid both fit, canvas/panel stack correctly
- [x] Dead code/assets removed: `Panel.jsx`, `Audio.js`, unused
      `circle.png` duplicate, old tower/projectile PNGs

### Known remaining gap
- [ ] Balance numbers (unlock-wave schedule, per-map `enemyProfile`
      multipliers, tower price/damage curves) are judgment calls, not the
      product of hours of real playtesting — expect to want to tune these
      once you've actually played through several maps.
