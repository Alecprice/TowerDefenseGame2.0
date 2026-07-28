# Tower Defense 2.0 - Feature Summary

## Major Features Added

### 1. **12 Maps with Progression**
- Expanded from 2 maps to 12 unique maps with increasing difficulty
- Maps: Switchback, Serpentine, Spiral, Hourglass, Maze, River, Twister, Checkered, Long Road, Gauntlet, Descent, Fortress
- Each map must be completed with 5+ waves to unlock the next one
- Map unlock system stored locally in browser

### 2. **Tower Unlock System**
- Start with only Tower 1 (Striker) unlocked
- Tower 2 (Slower): Unlocked at Wave 5
- Tower 3 (Blaster): Unlocked at Wave 10
- Tower 4 (Burner): Unlocked at Wave 15
- Locked towers show a 🔒 icon in the tower panel
- Locked towers are grayed out and cannot be placed

### 3. **Permanent Tower Upgrades**
- Gain upgrade points for towers by completing waves
- Every 3 waves completed grants an upgrade to a rotating tower (cycles through all 4)
- Upgrades are permanent and persist across games
- Upgrade levels shown as "+1", "+2", etc. on tower cards
- Each upgrade level increases:
  - Damage multiplier: +50% per level
  - Range: +15% per level
  - Fire rate: +15% per level (up to 5 levels max)

### 4. **Tutorial Mode**
- Interactive tutorial shown on first play
- 6-page guide covering:
  - Game overview
  - How to play (drag & drop towers)
  - Tower types and abilities
  - Enemy types
  - Progression system
  - Pro tips
- "Don't show again" checkbox
- Skip to any page or close at any time
- Beautiful styled modal that works on mobile and desktop

### 5. **Mobile-Friendly Design**
- Full Pointer Events API support (mouse, touch, pen all work the same)
- Responsive canvas that scales to screen size (maintains 900x600 internal resolution)
- Mobile breakpoints:
  - 900px and below: Panel stacks below canvas horizontally
  - 480px and below: Smaller fonts, reduced padding
- Touch-optimized tower placement (no accidental pinch-zoom during play)
- Minimum 44px touch targets for all buttons
- Viewport configured to prevent unwanted zooming during gameplay

### 6. **Removed ASP.NET Backend**
- Completely removed BackendAPI (.NET) project
- Removed SSL/HTTPS prestart scripts
- Simplified npm scripts (no more ASP.NET dev cert setup)
- Cleaner project structure (React-only, Node-based)

### 7. **Local High Score System**
- Removed dependency on ASP.NET backend
- Scores stored in browser localStorage (per-device only)
- Leaderboard displays: Rank, Name, Score, Wave Reached, Map Name
- Player names persist for convenience
- Supports up to 10 high scores per device

### 8. **Home Page Branding**
- New map selection screen on home page
- Shows all 12 maps as clickable buttons
- Credits footer: "Made by Alec Price" with link to https://www.alecjprice.com
- Improved visual hierarchy

## Progression Tracking (localStorage)

### Saved Data:
- `td_progression`: Tower unlock states, upgrade levels, map completion waves
- `td_highscores`: Top 10 local scores with player names
- `td_playerName`: Player name for convenience
- `td_tutorial_shown`: Flag to show/hide tutorial on load

## Enemy Types (New)
- **Type 4 - Armored**: Tanky with armor (shrugs off 8 damage per hit), spawns from wave 6+
- **Type 5 - Boss**: Appears every 5 waves, scaled up 1x, 2x, 3x... by tier

## How Tower Progression Works

### Unlocking:
```
Wave 5: Unlock Tower 2 → "Tower 2 Unlocked!" message
Wave 10: Unlock Tower 3 → "Tower 3 Unlocked!" message
Wave 15: Unlock Tower 4 → "Tower 4 Unlocked!" message
```

### Upgrading:
```
Wave 3 → Tower 1 +1
Wave 6 → Tower 2 +1
Wave 9 → Tower 3 +1
Wave 12 → Tower 4 +1
(pattern repeats)
```

## Mobile Optimization Details

### Canvas Scaling:
- Internal resolution: 900x600 (fixed)
- Display size: Responsive (max-width: 900px, scales down on mobile)
- Pointer Events automatically scale click coordinates based on display vs. canvas size
- Touch drag-and-drop works seamlessly

### Layout Reflow:
- Desktop: Canvas on left, panel on right (flex row)
- Tablet/Mobile: Canvas on top, panel below (flex column)
- All fonts, buttons, and spacing scale with breakpoints

## Files Modified/Created

### New Files:
- `src/components/utils/progression.js` - Game progression tracking
- `src/components/objects/Tutorial.js` - Tutorial modal component

### Modified Files:
- `src/components/data/maps.js` - Expanded to 12 maps
- `src/components/pages/GamePage.js` - Tower unlocks, upgrades, map unlocking, tutorial, progression
- `src/components/pages/HomePage.js` - Map selection, branding
- `src/components/pages/LoginPage.js` - Map selection pass-through
- `src/components/pages/ScoresPage.js` - Local leaderboard display
- `src/components/objects/Draggable.js` - Pointer Events, lock/upgrade badges
- `src/components/objects/Panel.js` - Tower unlock state display
- `src/components/objects/Tower.js` - Upgrade levels and methods
- `src/components/objects/Enemy.js` - Armored and Boss enemy types
- `src/components/objects/Projectile.js` - Damage multiplier support
- `src/styles.css` - Mobile breakpoints, tutorial styling, tower badges
- `public/index.html` - Mobile viewport tuning, meta tags
- `package.json` - Removed ASP.NET deps
- `.esproj`, `.sln` - Removed ASP.NET references

## Next Steps (When You Have Sprites)

To add custom sprites:
1. Replace `circle.png`, `type1.png`, `type2.png` in `src/components/objects/`
2. Update enemy draw() methods to use custom sprite images
3. Tower placement circles can be replaced with tower-specific sprites
4. Boss sprite suggestions: Larger, distinct colored circle or image

## Scaling Approach

The progression scales reasonably:
- **Early game** (Waves 1-5): Build with Tower 1, learn mechanics, unlock Tower 2
- **Mid game** (Waves 6-15): Mix tower types, gain permanent upgrades, handle Armored enemies
- **Late game** (Waves 15+): Utilize all towers upgraded, manage Boss waves every 5 waves
- **Map progression**: Success on one map → unlock next with increased enemy density/path complexity

The upgrade multipliers (1.5x damage per level) keep early towers relevant and provide meaningful progression feeling.

---

**Status**: Fully playable on desktop and mobile. Ready for sprite/art integration.
