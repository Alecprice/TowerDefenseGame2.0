// A single shared multiplier so the "Speed Up" toggle in GamePage.jsx can
// affect enemy movement, projectile movement, tower fire rate, and wave
// spawn cadence all at once, without threading a prop through every object.
export const gameSpeed = { value: 1 };
