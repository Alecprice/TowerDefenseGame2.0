# Tower Defense — Asset Specification

This is a working list of every visual/audio asset the game engine expects,
pulled directly from the code (grid size, `drawImage` calls, hitbox
dimensions) rather than guessed. Anything marked **MISSING** currently
renders as a plain vector shape (a solid-color circle) as a placeholder —
dropping in real art for those won't require any code changes, since the
draw functions already have a branch reserved for them.

All game-board art uses transparent PNG on a 50×50 px grid (the canvas is
900×600, i.e. 18×12 tiles of 50px). Keep sprites centered in their canvas
with a little breathing room at the edges — collision boxes are exactly
50×50 (70×70 for the boss), so oversized art will visually overlap
neighboring tiles.

## Towers

The panel shows a drag icon per tower; the canvas shows a separate in-play
sprite. Both are currently the same reused circle placeholder — each tower
type needs its own art for both.

| Type | Name (from code) | Cost | Placeholder color | Panel icon | Canvas sprite |
|---|---|---|---|---|---|
| 1 | Striker | $10 | red | 50×50 PNG | 50×50 PNG |
| 2 | Slower | $20 | blue | 50×50 PNG | 50×50 PNG |
| 3 | Blaster | $30 | yellow | 50×50 PNG | 50×50 PNG |
| 4 | Burner | $40 | green | 50×50 PNG | 50×50 PNG |

- **Panel icon**: drawn at a fixed 50×50 in the tower tray (`Draggable.jsx`).
- **Canvas sprite**: drawn at the tower's `(x, y)` on a 50×50 grid tile.
- **Upgrades**: each tower has 3 levels, but upgrades currently only change
  stats (range/fire rate/damage) — there's no visual change on upgrade.
  If you want a tier look (e.g. a glowing ring or bigger silhouette at
  level 2/3), that's 3 extra sprite variants per tower (12 total) *and*
  a small code change to swap the image based on `tower.level`.

## Enemies

All enemy art is drawn unscaled at native image size via `ctx.drawImage`,
so the PNG's actual pixel dimensions must exactly match the hitbox below —
otherwise the visible sprite and the collision box will mismatch.

| Type | Name | Size | Status | Notes |
|---|---|---|---|---|
| 1 | Grunt | 50×50 | ✅ exists (`Type1.png`) | |
| 2 | Runner | 50×50 | ✅ exists (`Type2.png`) | faster, less HP |
| 3 | *(unnamed)* | 50×50 | ⚠️ uses generic circle placeholder | deserves its own sprite |
| 4 | Armored | 50×50 | **MISSING** | currently a grey circle with dark outline |
| 5 | Boss | 70×70 | **MISSING** | currently a purple circle, gold outline — every 5th wave |

## Projectiles

Drawn scaled down to 5×5 px on the canvas regardless of source size, so
supply higher-resolution source art (e.g. 32×32 or 64×64) for a crisp
downscale rather than authoring at 5×5 directly.

| Type | Fired by | Suggested look |
|---|---|---|
| 1 | Striker | plain bolt/orb (currently generic white circle) |
| 2 | Slower | something visually "cold" — it slows enemies on hit |
| 3 | Blaster | energy/spark look — it hits every enemy in range at once |

## Map tiles (optional polish)

Currently pure vector: path tiles are a white-outlined rect, buildable
ground is a solid black fill. Both are 50×50. Real textures here are
optional but would be the single biggest visual upgrade for the board:

- **Path tile**: 50×50 PNG (road/dirt texture)
- **Buildable tile**: 50×50 PNG (grass/ground texture)

Tileable/seamless art is strongly preferred since the same tile repeats
across the whole 18×12 board.

## Map thumbnails (optional)

The 12 maps are currently plain text buttons on the home screen. If you
want a visual preview per map, a 4:3 thumbnail works well with the game's
existing layout:

- Suggested size: 300×225 px (or 400×300 for retina), PNG or JPG

## UI icons (optional — currently emoji/text, both work fine as-is)

| Icon | Where | Current | Suggested size |
|---|---|---|---|
| Lock | tower panel, locked towers | 🔒 emoji | 24×24 (export at 48×48 for retina) |
| Menu/pause | new in-game menu button | plain text "Menu" | 24×24 (export at 48×48 for retina) |

## Fonts (already in the project — no action needed)

Located in `src/components/assets/fonts/`, all already wired up in
`styles.css` and used consistently across the app:

- `arcade.ttf` — buttons (`.btn`, `.sbtn`)
- `space.otf` (font-family `title`) — all headings (h1–h4)
- `pixel.ttf` — body text, HUD, popups, tutorial, scores

## Audio

One track currently exists: `songformydeath.mp3` (background music,
~6.8 MB — on the large side for a web asset; consider re-encoding future
tracks at a lower bitrate, e.g. 128kbps mp3 or an .ogg alternative).

Not implemented yet, but worth having if you want fuller game-feel:

| Sound | Trigger | Suggested length |
|---|---|---|
| Tower fire | each shot | <0.3s one-shot |
| Enemy hit | projectile impact | <0.3s one-shot |
| Enemy death | enemy killed | <0.5s one-shot |
| Wave start | new wave begins | 1–2s stinger |
| Victory / Game over | win/lose | 2–4s stinger |
| UI click | button press | <0.2s one-shot |

Keep one-shot SFX small (well under 200KB each) — they're loaded/played
far more frequently than the background track.
