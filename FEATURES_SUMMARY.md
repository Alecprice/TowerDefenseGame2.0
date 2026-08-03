# Tower Defense — Feature Summary

## Towers (15 types, 5 levels each: base + 4 upgrades)

Every tower's full stat table lives in `TOWER_DEFS` in
`src/components/objects/tower.js` — that's the single source of truth for
price, range, fire rate, damage, and any special fields (poison, slow,
splash, income, aura). Nothing else in the codebase is allowed to mutate a
tower's stats independently, which is what previously caused upgrades to
sometimes make a tower weaker.

**Attack towers (6):**
| Tower | Behavior |
|---|---|
| Striker | Balanced single-target, targets the enemy furthest along the path |
| Sniper | Long range, slow fire, high per-hit damage, always targets the highest-HP enemy in range |
| Blaster | Hits every enemy in range simultaneously each shot (AOE) |
| Burner | Short range, very fast fire rate, low per-hit damage — targets the fastest enemy in range |
| Cannon | Splash damage: full damage to its target, reduced-percentage damage to other enemies within a radius of the impact |
| Farseer Spire | `global: true` — ignores range entirely, can hit any enemy anywhere on the map. Always targets the highest-HP enemy. Balanced by a slower fire rate than Sniper for similar per-hit damage |

**Utility towers (2):**
| Tower | Behavior |
|---|---|
| Toxin Spire | Direct hit + poison DOT. Poison **never stacks** — a second hit refreshes the duration and takes the stronger of the two DPS values, it doesn't add a second independent DOT |
| Frost Tower | Direct hit + slows the target. The slow is **floored**, not compounding — repeated hits can't grind an enemy toward a standstill |

**Economy / boss towers (2):**
| Tower | Behavior |
|---|---|
| Bank | No attack at all. Passively generates gold every second, scaling with level |
| Bulwark | Only fires when a boss (wave-5-multiple enemy) is actually in range — dead weight most waves, a serious damage spike on boss waves |

**Support towers (5) — none of these deal any direct damage. `shoot()`
bails out immediately for `CATEGORY.SUPPORT`, before a projectile is ever
created, so they are purely aura buffs to everything else on the board:**
| Tower | Behavior |
|---|---|
| Beacon | Generalist. Buffs every other tower in its aura range a little on all three stats: +range, +damage, +fire rate |
| Sharpshooter Nest | Specialist. Large **range-only** buff in its aura — no damage or fire rate bonus |
| Ammo Depot | Specialist. Large **damage-only** buff in its aura |
| Overclock Rig | Specialist. Large **fire-rate-only** buff in its aura |
| Command Spire | Global. Its "aura" is effectively the whole map (radius far larger than any map's diagonal), so it buffs *every* tower on the board regardless of distance — deliberately the weakest per-stat bonus of the five, since it doesn't require positioning |

Buffs from every support tower in range stack additively (a tower under a
Beacon, a Sharpshooter Nest, and a Command Spire gets all three range
bonuses at once), and are recalculated fresh every frame — sell a support
tower and its bonus disappears immediately, nothing is permanently baked
into the towers it buffed.

### Visible upgrades
Every tower is drawn procedurally (shape + color fixed per type) rather
than from PNG sprites. Each upgrade level past the first adds a persistent
translucent ring around the tower and a small numeric level badge in the
corner, plus a brief brighter pulse right when the upgrade lands — so a
levelled-up tower is visually obvious on the board, not just in the popup.

### Upgrading (manual only)
Click a placed tower to open the popup: it shows the tower's name, current
level, and lets you pay gold to upgrade (persists for that tower for the
rest of the round) or sell it back (refund = half of everything spent on
it — base price plus every upgrade paid for). There is no separate
automatic/free upgrade system anymore — upgrades are entirely
player-driven.

### Unlocking new tower types
The Striker starts unlocked; the other 9 unlock at wave milestones (see
`TOWER_UNLOCK_WAVE` in `src/components/utils/progression.js`, waves 3
through 27), tracked permanently in `localStorage` and shared across every
map. This is a separate concept from tower *upgrades* — unlocking makes a
tower type available to place at all; upgrading makes an already-placed
tower stronger for that round.

## Maps (50 total)

12 original maps + 8 earlier additions + 30 new ones (`src/components/data/maps.js`), each with:
- a unique grid layout and waypoint path
- one of 4 biome themes (grass / desert / snow / volcanic) reused across
  maps, cycled for variety
- a distinct `enemyProfile` — per-map multipliers for enemy speed and
  health, plus per-map armored/tank spawn chances — so maps feel
  mechanically different from each other, not just visually different.
  All 50 maps have one; see `enemyProfile` on each map entry.
- a deterministic procedural music theme (see Audio below)

Progressing through a map requires reaching wave 5 to unlock the next one
(`isMapUnlocked` / `recordMapWaveCompletion` in `progression.js`).

### Map picker with previews
`/play` (`MapSelectPage.jsx`) now shows all 50 maps as cards, each with a
small canvas-rendered preview of that map's actual grid + path
(`MapPreview.jsx` — built from the map's real data, not a static image),
plus best-wave-reached for unlocked maps and a "reach wave 5 on X" note
for locked ones. Locked maps are visibly locked and un-clickable, rather
than silently letting you navigate into a map you haven't unlocked yet.

## Enemies

- Types 1/2/4/5 as before (Grunt, Runner, Armored, Boss).
- Type 3 ("Tank" — 500 HP) previously existed in code but could never
  actually spawn; it's now wired into the spawn table (small chance past
  wave 8) instead of being dead content.
- HP scales up gradually every wave (independent of tower upgrades), and
  is further modified per-map by that map's `enemyProfile.healthMult`.
- Poisoned/slowed enemies now show a visual ring (green pulsing / cyan
  dashed) so debuffs are visible on the board, not just mechanical.

## Economy scaling

- Enemy kill value/score scale with wave, but at a slower rate than HP, so
  the economy doesn't spiral alongside rising enemy toughness.
- Bank towers add a second, passive income stream independent of kills.
- Tower sell value is always exactly half of total gold spent on that
  tower (base price + every upgrade), computed from one formula shared
  between the sell action and the popup's displayed sell price.

## Audio

- Sound effects: real `.wav` one-shots via Howler, unchanged in mechanism.
  The 6 new tower types reuse the closest-fitting existing fire sound
  rather than firing silently.
- Music: procedurally generated per map (`utils/music.js`) — a tiny seeded
  chiptune generator using Web Audio oscillators, no audio files. Same map
  always sounds the same; different maps sound different. Toggle at the
  top of the game screen.

## Progression data (localStorage)

- `td_progression` — tower unlock states (10 entries) and per-map wave
  progress (20 entries). No longer stores tower *upgrade* levels — those
  are per-round and live on the in-memory Tower object only.
- `td_highscores`, `td_playerName`, `td_tutorial_shown` — unchanged.

## Automated tests

`src/components/objects/tower.test.js` and `enemy.test.js` cover the
mechanics that are easy to silently break: upgrade stats always coming
from the catalog (never regressing), sell-value math, Beacon aura math,
Bank/Bulwark firing conditions, non-stacking poison, and floored slow —
run with `npm test`.
