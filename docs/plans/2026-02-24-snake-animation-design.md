# Nokia Snake Animation Design

## Overview

Add a decorative, autonomous Nokia-style snake to the clock background. The snake moves around eating pixels, which respawn 30 seconds after being eaten.

## Requirements

- Snake moves freely across the entire screen (canvas overlay)
- Nokia green color (#33ff33)
- 10px grid cells (small, not obtrusive)
- Slow movement (~350ms per tick) — clock remains the focus
- Eaten pixels respawn after 30 seconds at a random position
- Purely decorative, no user interaction

## Architecture

### Canvas Layer

- Full-screen `<canvas>` behind the clock text (`z-index: 0`)
- `pointer-events: none` — fullscreen click-through preserved
- Resizes on `window.onresize`

### Snake

- Grid-based movement (10px cells)
- Starting length: 5 segments
- Max length: ~20 (oldest segment drops off if exceeded without eating)
- Wrap-around at screen edges (classic Nokia behavior)
- AI-driven: seeks nearest food with occasional random turns for organic feel
- Head slightly brighter than body

### Food Pixels

- ~8-12 green squares on screen at any time
- Opacity ~0.6 to distinguish from snake body
- On eaten: removed, timer starts (30s), then respawns at new random position
- If fewer than 3 remain, spawn extra immediately

### Rendering

- `requestAnimationFrame` for drawing
- Tick-based movement (350ms intervals)
- Canvas clears and redraws each frame

### Integration

- Added to `index.html` as `<canvas id="snake-canvas">` + ~100-120 lines JS (IIFE)
- No impact on existing features (clock, weather, burn-in drift, wake lock, fullscreen)
- Drifts with the container or independently for burn-in protection
