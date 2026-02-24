# Nokia Snake Animation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a decorative, autonomous Nokia-style snake animation to the clock background that eats pixels which respawn after 30 seconds.

**Architecture:** Full-screen `<canvas>` overlay behind the clock text, with an autonomous AI-driven snake that moves on a 10px grid. All code goes inline in `index.html` as an IIFE at the end of the existing `<script>` block.

**Tech Stack:** Vanilla JS Canvas API, requestAnimationFrame + tick-based movement

---

### Task 1: Add canvas element and CSS

**Files:**
- Modify: `index.html:14-102` (CSS section)
- Modify: `index.html:104-113` (HTML body)

**Step 1: Add canvas CSS**

In the `<style>` block, add before the closing `</style>`:

```css
#snake-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}
```

**Step 2: Ensure clock text is above canvas**

Add `z-index: 1` to `#container`, `#weather`, and `#forecast` so they render above the canvas.

**Step 3: Add canvas element**

Insert `<canvas id="snake-canvas"></canvas>` right after `<body>`, before `<div id="container">`.

**Step 4: Verify in browser**

Open in browser, confirm canvas is present (transparent, invisible), clock still displays normally.

**Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add snake canvas overlay element"
```

---

### Task 2: Implement snake core logic (grid, movement, rendering)

**Files:**
- Modify: `index.html` (add JS before `</script>` closing tag, after service worker registration)

**Step 1: Add snake IIFE with grid setup and state**

```javascript
// --- Nokia Snake ---
(function() {
  const canvas = document.getElementById('snake-canvas');
  const ctx = canvas.getContext('2d');
  const CELL = 10;
  const SNAKE_COLOR = '#33ff33';
  const SNAKE_HEAD_COLOR = '#66ff66';
  const FOOD_COLOR = 'rgba(51, 255, 51, 0.5)';
  const TICK_MS = 350;
  const MAX_LENGTH = 20;
  const FOOD_COUNT = 10;
  const RESPAWN_MS = 30000;

  let cols, rows;
  let snake = [];
  let direction = { x: 1, y: 0 };
  let foods = [];
  let lastTick = 0;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.floor(canvas.width / CELL);
    rows = Math.floor(canvas.height / CELL);
  }

  // ... (further steps fill in the functions)
})();
```

**Step 2: Add snake initialization**

```javascript
function initSnake() {
  const startX = Math.floor(cols / 2);
  const startY = Math.floor(rows / 2);
  snake = [];
  direction = { x: 1, y: 0 };
  for (let i = 0; i < 5; i++) {
    snake.push({ x: startX - i, y: startY });
  }
}
```

**Step 3: Add food spawning**

```javascript
function spawnFood() {
  let x, y, attempts = 0;
  do {
    x = Math.floor(Math.random() * cols);
    y = Math.floor(Math.random() * rows);
    attempts++;
  } while (attempts < 100 && (snake.some(s => s.x === x && s.y === y) || foods.some(f => f.x === x && f.y === y)));
  foods.push({ x, y });
}

function initFoods() {
  foods = [];
  for (let i = 0; i < FOOD_COUNT; i++) spawnFood();
}
```

**Step 4: Add movement with wrap-around**

```javascript
function move() {
  const head = snake[0];
  const newHead = {
    x: (head.x + direction.x + cols) % cols,
    y: (head.y + direction.y + rows) % rows
  };
  const foodIdx = foods.findIndex(f => f.x === newHead.x && f.y === newHead.y);
  snake.unshift(newHead);
  if (foodIdx !== -1) {
    foods.splice(foodIdx, 1);
    setTimeout(spawnFood, RESPAWN_MS);
    if (foods.length < 3) spawnFood();
  } else if (snake.length > MAX_LENGTH) {
    snake.pop();
  } else {
    snake.pop();
  }
}
```

**Step 5: Add simple AI steering**

```javascript
function steer() {
  if (foods.length === 0) return;
  const head = snake[0];
  let nearest = foods[0], minDist = Infinity;
  for (const f of foods) {
    const dx = Math.min(Math.abs(f.x - head.x), cols - Math.abs(f.x - head.x));
    const dy = Math.min(Math.abs(f.y - head.y), rows - Math.abs(f.y - head.y));
    const d = dx + dy;
    if (d < minDist) { minDist = d; nearest = f; }
  }

  // Random turn 15% of the time for organic feel
  if (Math.random() < 0.15) {
    const dirs = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
    const valid = dirs.filter(d => !(d.x === -direction.x && d.y === -direction.y));
    direction = valid[Math.floor(Math.random() * valid.length)];
    return;
  }

  let dx = nearest.x - head.x;
  let dy = nearest.y - head.y;
  // Wrap-aware: choose shorter path
  if (Math.abs(dx) > cols / 2) dx = -Math.sign(dx);
  if (Math.abs(dy) > rows / 2) dy = -Math.sign(dy);

  const candidates = [];
  if (dx !== 0) candidates.push({ x: Math.sign(dx), y: 0 });
  if (dy !== 0) candidates.push({ x: 0, y: Math.sign(dy) });
  // Avoid reversing
  const choice = candidates.find(c => !(c.x === -direction.x && c.y === -direction.y));
  if (choice) direction = choice;
}
```

**Step 6: Add self-collision avoidance**

Add to `steer()`: after choosing a direction, check if the next cell would hit the snake body. If so, try alternative directions.

```javascript
function wouldCollide(dir) {
  const nx = (snake[0].x + dir.x + cols) % cols;
  const ny = (snake[0].y + dir.y + rows) % rows;
  return snake.some((s, i) => i > 0 && s.x === nx && s.y === ny);
}
```

Add collision check at end of `steer()`:
```javascript
if (wouldCollide(direction)) {
  const dirs = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
  const safe = dirs.filter(d => !(d.x === -direction.x && d.y === -direction.y) && !wouldCollide(d));
  if (safe.length > 0) direction = safe[Math.floor(Math.random() * safe.length)];
}
```

**Step 7: Commit**

```bash
git add index.html
git commit -m "feat: add snake core logic - movement, AI, food spawning"
```

---

### Task 3: Add rendering and game loop

**Files:**
- Modify: `index.html` (continue in the snake IIFE)

**Step 1: Add draw function**

```javascript
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw food
  ctx.fillStyle = FOOD_COLOR;
  for (const f of foods) {
    ctx.fillRect(f.x * CELL, f.y * CELL, CELL - 1, CELL - 1);
  }

  // Draw snake body
  ctx.fillStyle = SNAKE_COLOR;
  for (let i = 1; i < snake.length; i++) {
    ctx.fillRect(snake[i].x * CELL, snake[i].y * CELL, CELL - 1, CELL - 1);
  }

  // Draw snake head (brighter)
  if (snake.length > 0) {
    ctx.fillStyle = SNAKE_HEAD_COLOR;
    ctx.fillRect(snake[0].x * CELL, snake[0].y * CELL, CELL - 1, CELL - 1);
  }
}
```

**Step 2: Add game loop**

```javascript
function loop(timestamp) {
  if (timestamp - lastTick >= TICK_MS) {
    steer();
    move();
    lastTick = timestamp;
  }
  draw();
  requestAnimationFrame(loop);
}

// Initialize
resize();
initSnake();
initFoods();
window.addEventListener('resize', () => { resize(); });
requestAnimationFrame(loop);
```

**Step 3: Verify in browser**

Open the app — green snake should be moving around, eating pixels, pixels respawn after 30s.

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add snake rendering and game loop"
```

---

### Task 4: Final polish and visual verification

**Files:**
- Modify: `index.html` (minor tweaks if needed)

**Step 1: Take screenshot and verify visuals**

Use Playwright to take a screenshot and verify:
- Snake is visible and moving
- Clock text is readable above the snake
- Food pixels are visible but subtle
- Colors look good (#33ff33 Nokia green)

**Step 2: Verify food respawn**

Wait 30+ seconds, confirm eaten food reappears at new positions.

**Step 3: Verify no interference with existing features**

- Click still triggers fullscreen
- Burn-in drift still works
- Weather still updates

**Step 4: Final commit**

```bash
git add index.html
git commit -m "feat: complete Nokia snake animation with 30s food respawn"
```
