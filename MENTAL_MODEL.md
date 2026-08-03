# Mental Model: Tower Defense Codebase

This is the doc to read before touching this codebase for the first time.
It's not a feature list (see `FEATURES_SUMMARY.md` for that) - it's the
*shape* of the thing: what talks to what, which patterns repeat
everywhere, and which shortcuts were taken on purpose so you don't "fix"
them by accident.

## The one idea that explains half the codebase

**`GamePage.jsx` is a game engine wearing a React component as a
costume.** Everything that has to update 60 times a second - enemy
positions, bullet travel, tower cooldowns, collision checks - lives in
plain mutable arrays (`enemies`, `bullets`, `towers`, `grid`) and plain
mutable objects (`mouse`, `META`, `COSMETIC`, `gameSpeed`, `dragState`),
**not** in React state. A single `draw(ctx)` closure, called every
`requestAnimationFrame` by `Canvas.jsx`, is the actual game loop: it
moves things, resolves hits, mutates those arrays in place, and paints
the canvas.

React `useState` only shows up for things a human needs to *read* on
screen at human speed - money, lives, wave number, game-over state. If
you find yourself wanting to `setState` inside the per-frame loop for
something that changes every frame (a boss's HP, a dragged tower's
preview position), don't - use a `ref` and mutate a DOM element directly
instead (see `bossBarFillRef`, `waveBannerRef` in `GamePage.jsx`) or a
shared module-level object read straight out of `draw()`. This is why
the boss HP bar and the wave-cleared banner are plain refs with
`.style.width =` / `.textContent =` calls instead of components - a
`setState` per hit would re-render the whole page tree every frame.

## Module-level shared mutable singletons

You'll see this pattern repeatedly: a small file exports one mutable
object, and anything that needs to read or write it just imports it.
There's no context, no store, no pub/sub - just a shared reference.

| Module | Object | Written by | Read by |
|---|---|---|---|
| `objects/tower.js` | `META` | `GamePage` (once per run, from `metaProgression.getMetaBonuses()`) | `Tower.effectiveDmg/FireRate/Income` |
| `objects/tower.js` | `COSMETIC` | `GamePage` (once per run, from the player's chosen palette) | `drawShape()` |
| `utils/gameSpeed.js` | `gameSpeed` | the speed-toggle button | `Enemy.move`, `Projectile.move`, wave timers |
| `utils/mapTheme.js` | `mapTheme` | `GamePage` on map load | `Enemy.draw` (which sprite sheet to use) |
| `objects/Draggable.jsx` | `dragState` | pointer down/up on a tray tower | `GamePage.draw()` (range-preview circle) |
| `pages/GamePage.jsx` (exported) | `mouse` | a document-level pointermove listener | `Canvas`, `block.mouseIsOver`, drag preview |
| `utils/damageNumbers.js` | `damageNumbers` array | `Projectile.impact` | `drawDamageNumbers()` in the draw loop |
| `utils/particles.js` | `particles` array | boss/splitter death handlers | `updateAndDrawParticles()` |
| `utils/runStats.js` | `runStats` | `placeTower`, `Projectile.impact` | game-over summary (snapshotted, not read live) |

**Why this matters:** these objects are *not reset by unmounting a
component* - they're reset explicitly, on purpose, at the top of the
`if (gameState === 'start')` block in `GamePage.jsx` (`resetDamageNumbers()`,
`resetParticles()`, `resetRunStats()`, `TOWER_META.dmgMult = ...`, etc.).
If you add a new one of these, you almost certainly need to add its reset
call there too, or a value will leak from one run into the next.

## The object model: prototype objects, not classes

`Tower`, `Enemy`, `Projectile`, `Block` are all built the same way: a
constructor function that sets instance fields, plus a
`Thing.prototype = { method() {...}, ... }` object literal for behavior.
This is an older pattern than ES6 `class`, kept for consistency with the
original codebase rather than a technical requirement - don't mix `class`
syntax in for new objects of the same kind, follow the existing pattern.

Every one of these objects is created with `new` and pushed straight into
a plain array (`enemies.push(...)`, `towers.push(...)`). "Deleting" one is
`array.splice(index, 1)` inside the draw loop, immediately after checking
`.dead` or `.end`. There's no object pooling - at current enemy-count
scales it hasn't needed it.

## `TOWER_DEFS` is the single source of truth for balance

Every tower's price/range/damage/fire-rate/special-fields at every level
live in one object literal in `objects/tower.js`. **Nothing else should
hardcode a tower's stats.** If a tower feels wrong, the fix is almost
always a number in `TOWER_DEFS`, not a code path elsewhere.

A tower's *live, in-effect* stats go through the `effective*()` methods
(`effectiveDmg`, `effectiveFireRate`, `effectiveIncome`, `effectiveRange`),
which layer three things on top of the base `TOWER_DEFS` number, in this
order:
1. Aura bonuses from nearby Support towers (`this.auraBonus`, recomputed
   fresh every frame in `GamePage`'s draw loop - nothing is permanently
   baked in, so selling a support tower drops its bonus immediately)
2. The run's meta-progression multiplier (`META.dmgMult` etc., set once
   at run start from purchased Cores upgrades)
3. For range specifically: `def.global` short-circuits everything and
   returns `true` unconditionally from `inRange()` - see Farseer Spire.

If you add a new stat modifier (a difficulty tier, a new upgrade path,
whatever), it belongs in one of these `effective*()` methods, not
scattered across call sites that read `.dmg` directly.

## Enemies: sprite-based *and* procedural, on purpose

Enemy types 1-5 (Grunt/Runner/Tank/Armored/Boss) use real sprite images
per map theme (`enemySprites[theme][type]`). Types 6-7 (Flyer,
Teleporter) were added later and have **no sprite assets** - they're
drawn procedurally in `Enemy.drawFlyer` / `drawTeleporter`, the same
approach `tower.js` uses for every tower. If you add enemy type 8, you
have the same choice: source/generate a sprite sheet, or draw it in code.
Procedural is faster to add and easier to make read clearly at a glance;
sprites read as more "designed." Neither is wrong - `draw()` already
branches on `this.type` to pick a path.

Shielded and Splitter aren't separate enemy *types* - they're boolean
flags (`shieldHP`, `splitter`) that can be layered onto any type,
rolled independently in `GamePage`'s spawn block. This is why they scale
cleanly with difficulty and wave number without needing their own
`TOWER_DEFS`-style stat table: they modify behavior, not base stats.

## Four separate localStorage systems - deliberately not merged

| File | Key | What it holds |
|---|---|---|
| `progression.js` | `td_progression`, `td_tutorial_shown` | Tower/map unlocks (binary) |
| `metaProgression.js` | `td_meta` | Cores (spendable currency), stat upgrade levels, cosmetic palettes |
| `achievements.js` | `td_achievement_stats`, `td_achievements_unlocked` | Lifetime counters + which achievements are unlocked |
| `highscores.js` | `td_highscores`, `td_playerName` | Local-fallback leaderboard, used when Supabase isn't configured |

They're kept separate so that resetting or migrating one never risks
corrupting another, and so each file's `getX()`/`saveX()` pair can evolve
its own schema independently. Every one of them follows the same
defensive-merge pattern: `getX()` reads raw JSON, spreads it over a
`DEFAULT_X` object, and **pads/backfills arrays** rather than trusting
the saved shape - this is what let the tower roster grow from 10 to 15
and the map count grow from 20 to 50 without wiping anyone's save data
(see `padArray()` in `progression.js`). If you add a new persisted field,
follow that same "merge over defaults, never trust the saved shape
verbatim" pattern.

`progressBackup.js` is a *fifth* thing, deliberately: it doesn't own any
data, it just knows the full list of keys the other four use and
serializes/restores them as a portable JSON file. If you add a new
localStorage-backed system, add its key to `BACKED_UP_KEYS` there too, or
it silently won't be included in exports.

## Difficulty and Cores are two different kinds of "harder"

It's easy to conflate these - they're not the same axis:
- **Difficulty** (`difficulty.js`, `easy`/`basic`/`normal`/`hard`/`challenge`)
  is chosen *before* a run, resets every run, and only makes that one run
  harder (enemy HP/damage/armor odds up, starting gold/sell refund down).
- **Meta-progression** (`metaProgression.js`, Cores) is earned *from*
  runs and makes *every future run* a little easier/stronger. It's
  permanent until you spend differently or reset it.

Wave-over-wave scaling (`waveScale`, +5%/wave) is a third, separate axis
that has nothing to do with either - it's why "endless mode" doesn't need
its own toggle, every map already never hard-caps its wave count.

## Waypoint-based movement, not grid pathfinding

`map.grid` (a 12x18 array of 0/1) is **only** used for rendering tiles
and blocking tower placement on path cells. It is not used for enemy
movement. Enemies walk a polyline defined by `map.waypoints`
(`[{x,y}, {x,y}, ...]`), advancing `this.waypoint` as an index each time
they arrive near the current target point (`enemy.move()` in `enemy.js`).
This means:
- `map.grid` and `map.waypoints` are two independent representations of
  the same path, hand/procedurally kept in visual agreement - nothing
  enforces that agreement in code. If you add a map, get the waypoints
  right for gameplay and the grid roughly matching for visuals; they
  don't have to be pixel-perfect against each other.
- 30 of the 50 maps were generated by a one-off script (since removed -
  it wasn't part of the app, just an authoring tool) that laid out
  full-width/height "bands" in the grid, with waypoints simply
  alternating direction at each band. That's why so many maps look like
  horizontal or vertical combs - it's a cheap, always-valid pattern, not
  a design constraint. Worth knowing if you want to add more maps by
  hand versus writing a similar generator.

## The database layer is optional by design

`supabaseClient.js` exports `null` if `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`
aren't set. `highscores.js` checks `if (!supabase)` at the top of every
function and falls back to `localStorage`. **Every caller of
`highscores.js` should keep working identically whether or not a
database is configured** - don't add a code path that assumes `supabase`
is non-null without a fallback.

The two Edge Functions (`start-session`, `submit-score`) exist because
score submission is *not* trusted from the client: `start-session`
anchors a server-side clock when a run begins, and `submit-score`
recomputes a plausible max score/wave from elapsed server time
(`_shared/gameRules.js`) before accepting a submission. If you change
scoring math (points per kill, wave-clear bonuses, whatever), you
probably need to update the plausibility check in `gameRules.js` too, or
legitimate high scores will start getting rejected as implausible.

## Tests: what's covered and why

Test files sit next to the code they test (`enemy.test.js` beside
`enemy.js`, etc.), all using Vitest. Coverage is concentrated on **pure
logic**, not rendering: damage math, shield absorption, difficulty
multipliers, achievement unlock thresholds, localStorage merge/pad
behavior. Canvas drawing methods are *not* unit tested (jsdom's
`getContext('2d')` returns `null` - see the comment in `App.test.jsx`);
the one exception is `enemy.test.js`'s `drawHealth` tests, which pass in
a hand-rolled fake `ctx` object that just records `fillRect` calls
instead of actually rendering. If you need to test a new draw method,
that's the pattern to copy - don't try to get real canvas rendering
working in the test environment.

`GamePage.jsx` itself has no direct test coverage beyond "renders without
crashing is skipped" (see `App.test.jsx`) - it's exercised by playing the
game, not by unit tests. Keep game *logic* (damage formulas, spawn
chances, wave-completion bookkeeping) in the objects it delegates to
where it's testable, rather than growing more untested logic inline in
`GamePage.jsx`'s draw loop, when you have the choice.

## Two parallel game modes share one engine

`GamePageV3.jsx` ("Tower Defense Game 3.0", routed at `/play3` → `/game3`)
is a second, independent ruleset - its own 22-tower roster
(`towerDefsV3.js`), its own dual-currency economy (Money buys towers,
Crystals upgrade them), its own progression tracking
(`progressionV3.js`, fully separate `td3_...` localStorage keys) - built
on top of the *same* engine as the original game, not a fork of it:

- `Tower()` takes an optional `defsTable` argument (defaults to the
  original `TOWER_DEFS`) - `TowerIcon.jsx` and `Draggable.jsx` do too.
  `GamePageV3.jsx` is the only caller that ever passes `TOWER_DEFS_V3`.
- `Projectile.impact()`'s Game 3.0-only mechanics (execute, chain,
  pierce, crit, armor-shred, anti-heavy, anti-shield) are all gated
  behind `extra` fields that are simply `undefined` for every original
  tower - there's no mode flag, the original game's towers just never
  populate those fields.
- The two new enemy types (Regenerator, Juggernaut) live in the same
  `enemy.js` as everything else, for the same reason - the original
  game's spawn logic in `GamePage.jsx` just never rolls types 8/9, so
  they can't appear there even though the class supports them.

The one deliberate exception to "share, don't fork" is the tutorial:
`Tutorial.jsx` and `TutorialV3.jsx` are two separate components with
separate content and separate "has this been shown" tracking
(`tutorialHasBeenShown()` vs. `tutorialHasBeenShownV3()`). Unlike the
mechanics above, tutorial *content* has no meaningful shared subset -
"drag a tower onto the green tiles" is true in both modes, but
everything else (what the towers do, the dual-currency economy) isn't -
so parametrizing one component with mode-specific text would just be a
big if/else with no engine actually being reused. When something is
truly mode-specific content rather than mode-specific *data feeding a
shared engine*, a second small component is the right call, not another
optional parameter.

If you're adding a third mechanic in this spirit, ask "does this need a
new field that's simply absent/undefined for existing callers?" before
reaching for a mode-check branch - that's the pattern this whole feature
leans on, and it's what let Game 3.0 ship without touching the original
game's balance or save data at all.

## Where to look for X

- **"Why did my tower stat not apply?"** → check `effective*()` in
  `tower.js` first; raw `.dmg`/`.range` fields are base values only.
- **"Why does this only happen on some runs?"** → check whether it's
  difficulty-gated (`difficulty.js`) or meta-progression-gated
  (`metaProgression.getMetaBonuses()`), both set once at run start.
- **"Where does a run actually end?"** → `values.lives <= 0` check near
  the bottom of `draw()` in `GamePage.jsx`, which flips `gameState` to
  `'end'` - everything else (score save, Cores award, achievement
  recording, run summary) hangs off `useEffect`s watching `gameState`.
- **"Where do I add a new enemy spawn mechanic?"** → the spawn block in
  `GamePage.jsx`'s `draw()` (search for `values.enemySpawned < values.wave`),
  following the existing wave-gated, difficulty-scaled, capped-chance
  pattern used by armored/tank/shielded/splitter/flyer/teleporter.
- **"Where do I add a new persisted player-facing number?"** → decide
  which of the four localStorage systems it conceptually belongs to
  (unlock? currency? lifetime stat? score?) before adding a fifth.
