# Tower Defense 2.0 - Quick Start Guide

## Installation & Running

### First Time Setup:
```bash
cd TowerDefenseProject
npm install --legacy-peer-deps
npm start
```

The app will open at `http://localhost:3000`

### Production Build:
```bash
npm run build
```
Output goes to `build/` folder, ready to deploy.

---

## Testing the New Features

### 1. **Tutorial**
- First time you play, tutorial should appear automatically
- Click through all 6 pages
- Check "Don't show again" and close
- Restart game — tutorial should not appear again
- Data is stored in browser localStorage

### 2. **Map Selection & Unlocking**
- Click "Home" from game over screen
- You'll see 12 map buttons
- Maps 2-12 should be grayed out or show "Locked" status
- Complete 5 waves on Map 1 to unlock Map 2
- Progress through maps to unlock the rest

### 3. **Tower Unlocking**
- Start game on Map 1
- Only Tower 1 (Striker, red) should be draggable
- Towers 2, 3, 4 should show 🔒 lock icon, grayed out
- Complete Wave 5 → Tower 2 unlocks ("Tower 2 Unlocked!" message)
- Complete Wave 10 → Tower 3 unlocks
- Complete Wave 15 → Tower 4 unlocks

### 4. **Tower Upgrades**
- Look for "+1", "+2", "+3" badges on tower cards after unlocking
- Every 3 waves you get an upgrade to a tower (rotates through them)
- Wave 3: Tower 1 +1
- Wave 6: Tower 2 +1
- Wave 9: Tower 3 +1
- Wave 12: Tower 4 +1
- Upgrades persist across games (reload and start new game — upgrades still there)
- Upgraded towers deal more damage, have more range, fire faster

### 5. **Mobile Testing**
- Open on phone/tablet
- Drag towers by touching and dragging them onto the board
- Panel should be below canvas (not to the side)
- Buttons should be large enough to tap easily
- Pause/Play buttons work on touch
- Try pinching to zoom — should be blocked during gameplay

### 6. **Affordability Check**
- Start with $20
- Try placing a Tower 4 (costs $40) before wave 1 — should fail
- Grayed out, can't drag
- After earning money, should become draggable

### 7. **Leaderboard**
- Complete a wave and lose (or win, but then close game)
- Name prompt appears after game over popup
- Enter a name and click continue
- Go to "Highscores" 
- Your score should appear in the local leaderboard
- Refresh page — score still there (stored in localStorage)

### 8. **Enemy Types**
- **Wave 1-3**: Red Grunts only
- **Wave 4+**: Mix of Grunts and Yellow Runners
- **Wave 6+**: Occasionally gray Armored enemies (tanky)
- **Every 5 waves**: Boss appears (large purple circle) at end of wave

---

## Browser Developer Tools

### Check Progression Data:
```javascript
// In console:
JSON.parse(localStorage.getItem('td_progression'))
JSON.parse(localStorage.getItem('td_highscores'))
```

### Clear All Data:
```javascript
localStorage.clear()
// Then reload page
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Can't drag towers | Make sure you're dragging from the tower card (right side). Locked towers won't drag. You need enough money ($X for tower type). Game must be in "Playing" state. |
| Tower unlock not showing | Watch for the popup message "Tower X Unlocked!" at wave 5, 10, 15. If you miss the message, check the tower cards — they should have the lock icon removed. |
| Upgrades not persisting | Make sure you're not clearing localStorage. Upgrades are stored in `td_progression`. Reload the page — upgrades should still be there. |
| Touch doesn't work | Make sure you're using a real touch device. Mobile testing in browser DevTools may not perfectly emulate touch events. Test on actual phone/tablet for best results. |
| Score not saved | After game over, you must enter your name before clicking continue. The name input prompt appears after the "You Died" popup. |

---

## Customization Points for Later

### When You Have Sprites:
1. Replace images in `src/components/objects/`:
   - `circle.png` → Your tower sprite
   - `type1.png`, `type2.png` → Enemy sprites

2. Update tower/enemy draw methods in:
   - `src/components/objects/tower.js` - `.draw()` method
   - `src/components/objects/enemy.js` - `.draw()` method

### Adjust Wave Unlock Points:
Edit in `src/components/utils/progression.js`:
```javascript
// Default: 5 waves to unlock next map
return prev >= 5; // Change 5 to your desired number
```

### Change Tower Costs/Stats:
Edit `src/components/objects/tower.js` constructor:
```javascript
if (this.type === 1) {
    this.range = 150;     // Change range
    this.price = 10;      // Change cost
    // ... etc
}
```

### Add More Maps:
Add to `src/components/data/maps.js` maps array. Follow the pattern:
```javascript
{
    name: 'Your Map Name',
    grid: [ /* 12x18 array, 0=buildable, 1=path */ ],
    waypoints: [ /* array of {x, y} coordinates */ ]
}
```

---

## Files to Share with Your Kids

Print/share the tutorial info so they know:
- Drag towers onto the dark areas
- Complete waves to earn upgrades
- Unlock new towers at wave milestones
- Don't let enemies reach the end!

---

Enjoy the game! 🎮
