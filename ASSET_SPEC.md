# Tower Defense — Asset Specification

This tracks every visual/audio asset the game engine actually uses, pulled
from the code rather than guessed. As of the 10-tower / 20-map rewrite,
**towers, projectiles, and music are all procedurally generated in code —
they no longer need image or audio files at all.**

## Towers — procedural, no art files

Every tower (all 10 types, all 5 levels) is drawn on the canvas at runtime
by `drawShape()` in `src/components/objects/tower.js`: a fixed silhouette
per type (circle, triangle, diamond, square, hexagon, star, cross/plus,
pentagon, octagon) in a fixed color, scaled slightly and ringed once per
upgrade level past the first, plus a small numeric level badge once
upgraded. See `TOWER_DEFS` in that file for the type → shape/color table.

There is **no PNG art for towers anymore** — the old
`src/components/assets/images/towers/` directory (4 towers × 3 levels +
4 panel icons) has been deleted since nothing referenced it. If you want
hand-drawn tower art later, the integration point is `Tower.prototype.draw`
in `tower.js`: swap the `drawShape(...)` call for `ctx.drawImage(...)`
keyed by `[type][level]`, same pattern the old code used.

The tray icon (`TowerIcon.jsx`) reuses the exact same `drawShape()`
function so the tray and the board always match.

## Projectiles — procedural, no art files

Projectiles are small filled circles colored by the firing tower's
category (`CATEGORY_COLOR` in `src/components/objects/projectile.js`):
white for plain attack towers, green for poison, cyan for slow, red for
the boss-hunter tower. The old `projectiles/` PNG directory (bolt/ice/
spark) has been deleted — nothing imports it anymore.

## Enemies — still real PNG art

Enemy art is the one place hand-drawn sprites are still used and still
matter. All enemy art is drawn unscaled at native image size via
`ctx.drawImage`, so the PNG's actual pixel dimensions must exactly match
the hitbox below — otherwise the visible sprite and the collision box will
mismatch.

| Type | Name | Size | Notes |
|---|---|---|---|
| 1 | Grunt | 50×50 | |
| 2 | Runner | 50×50 | faster, less HP |
| 3 | Tank | 50×50 | high HP, high value/score — now actually spawns (small chance past wave 8, was previously dead/unused code) |
| 4 | Armored | 50×50 | flat damage-reduction armor stat |
| 5 | Boss | 70×70 | every 5th wave, scales up per boss tier |

Each type has 4 sprite variants — one per map biome/theme (`grass`,
`desert`, `snow`, `volcanic`) — under
`src/components/assets/images/enemies/`. `mapTheme.js` picks the active
set per map; `block.js` reads the same theme for tile art.

Enemy debuffs (poison, slow) don't have their own sprites either — they're
drawn as a pulsing green ring / dashed cyan ring around the existing enemy
sprite (`Enemy.prototype.drawStatusEffects` in `enemy.js`), stacking to two
concentric rings if both are active at once.

## Map tiles

Unchanged from before: 50×50 PNGs, path and buildable variants per theme,
under `src/components/assets/images/tiles/`.

## Map preview thumbnails — procedural, no art files

The map picker (`MapSelectPage.jsx`) shows a small canvas-rendered preview
per map (`MapPreview.jsx`) built directly from that map's `grid` and
`waypoints` data — colored per theme, with the enemy path traced as a
line. No thumbnail images to generate or keep in sync as maps change.

## UI icons

Unchanged: lock (🔒) and menu are emoji/text, no image assets.

## Fonts

Unchanged, already wired up in `styles.css`:
- `arcade.ttf` / `Bungee-Regular.ttf` / `VT323-Regular.ttf` — see
  `styles.css` for which font-family maps to which class.

## Audio

### Sound effects — real audio files, unchanged
Short one-shot `.wav` clips under `src/components/assets/audioClips/`,
played through Howler (`utils/sfx.js`): tower fire (mapped per tower —
the 6 new tower types reuse the closest-fitting existing clip rather than
firing silently, see the `fireSounds` table), enemy death, boss death, buy,
unlock, upgrade, UI click.

### Background music — procedural, no audio files
There is no `songformydeath.mp3` background track anymore, and no
per-map audio files. `src/components/utils/music.js` generates a short
looping chiptune with plain Web Audio oscillators, seeded deterministically
by map index — same map always sounds the same, different maps sound
different, and there's nothing to ship, license, or keep in sync as maps
are added or reordered. The in-game toggle (top of `GamePage.jsx`) starts/
stops it; browsers require the user gesture on that checkbox before audio
can play, same constraint as before.

If you want real composed music instead, the integration point is
`startMapMusic(mapIndex)` in `music.js` — replace its internals with an
`Audio`/Howl element keyed by map index.
