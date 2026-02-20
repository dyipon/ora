# PWA Clock Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a black-background fullscreen clock PWA showing time, Hungarian date, and Eger temperature with burn-in protection.

**Architecture:** Single static site — one HTML file with inline CSS/JS, plus PWA manifest and service worker. No build step, no dependencies. Open-Meteo API for weather data, Wake Lock API for screen-on.

**Tech Stack:** Vanilla HTML/CSS/JS, Service Worker API, Wake Lock API, Open-Meteo REST API

---

### Task 1: Project skeleton — HTML + basic CSS

**Files:**
- Create: `index.html`

**Step 1: Create index.html with full structure and styles**

```html
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#000000">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black">
  <title>Óra</title>
  <link rel="manifest" href="manifest.json">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #000;
      color: #fff;
      font-family: 'Courier New', Courier, monospace;
      user-select: none;
      -webkit-user-select: none;
    }

    #container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      white-space: nowrap;
      will-change: transform;
    }

    #time {
      font-size: 25vw;
      font-weight: bold;
      line-height: 1;
      letter-spacing: 0.02em;
    }

    #time .colon {
      opacity: 1;
      transition: opacity 0.3s;
    }

    #time .colon.off {
      opacity: 0.2;
    }

    #date {
      font-size: 4vw;
      margin-top: 2vh;
      opacity: 0.7;
    }

    #weather {
      font-size: 3.5vw;
      margin-top: 4vh;
      opacity: 0.6;
    }

    @media (orientation: portrait) {
      #time {
        font-size: 18vw;
      }
      #date {
        font-size: 5vw;
      }
      #weather {
        font-size: 4.5vw;
      }
    }
  </style>
</head>
<body>
  <div id="container">
    <div id="time">
      <span id="hours">00</span><span class="colon">:</span><span id="minutes">00</span>
    </div>
    <div id="date"></div>
    <div id="weather"></div>
  </div>

  <script>
    // JS will be added in subsequent tasks
  </script>
</body>
</html>
```

**Step 2: Verify**

Open `index.html` in browser. Should see black page with white "00:00" centered.

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add clock HTML structure and CSS"
```

---

### Task 2: Clock and date JavaScript

**Files:**
- Modify: `index.html` (replace the `<script>` block)

**Step 1: Add clock and date logic**

Replace the `<script>` block in `index.html` with:

```javascript
// --- Clock & Date ---
const DAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];
const MONTHS = [
  'január', 'február', 'március', 'április', 'május', 'június',
  'július', 'augusztus', 'szeptember', 'október', 'november', 'december'
];

const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const colonEl = document.querySelector('.colon');
const dateEl = document.getElementById('date');

function updateClock() {
  const now = new Date();
  hoursEl.textContent = String(now.getHours()).padStart(2, '0');
  minutesEl.textContent = String(now.getMinutes()).padStart(2, '0');
  colonEl.classList.toggle('off');
}

function updateDate() {
  const now = new Date();
  const day = DAYS[now.getDay()];
  const month = MONTHS[now.getMonth()];
  dateEl.textContent = `${now.getFullYear()}. ${month} ${now.getDate()}., ${day}`;
}

updateClock();
updateDate();
setInterval(updateClock, 1000);
setInterval(updateDate, 60000);
```

**Step 2: Verify**

Open in browser. Clock should show current time with blinking colon. Date should appear in Hungarian format below.

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add clock and Hungarian date display"
```

---

### Task 3: Temperature from Open-Meteo

**Files:**
- Modify: `index.html` (append to the `<script>` block)

**Step 1: Add weather fetching**

Append to the `<script>` block:

```javascript
// --- Weather ---
const weatherEl = document.getElementById('weather');
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=47.9025&longitude=20.3772&current=temperature_2m';

async function updateWeather() {
  try {
    const res = await fetch(WEATHER_URL);
    const data = await res.json();
    const temp = Math.round(data.current.temperature_2m);
    weatherEl.textContent = `Eger: ${temp}°C`;
  } catch (e) {
    // Keep last displayed value on error
  }
}

updateWeather();
setInterval(updateWeather, 10 * 60 * 1000);
```

**Step 2: Verify**

Open in browser. After a moment, "Eger: X°C" should appear at the bottom. Check DevTools Network tab for the API call.

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add Eger temperature from Open-Meteo API"
```

---

### Task 4: Burn-in protection (slow drift)

**Files:**
- Modify: `index.html` (append to the `<script>` block)

**Step 1: Add drift animation**

Append to the `<script>` block:

```javascript
// --- Burn-in protection: slow drift ---
const container = document.getElementById('container');
let driftX = 0;
let driftY = 0;
let dirX = 1;
let dirY = 1;
const DRIFT_STEP = 1; // pixels per tick
const DRIFT_MAX = 30; // max pixels from center
const DRIFT_INTERVAL = 30000; // ms between moves

function drift() {
  driftX += DRIFT_STEP * dirX;
  driftY += DRIFT_STEP * dirY;

  if (Math.abs(driftX) >= DRIFT_MAX) dirX *= -1;
  if (Math.abs(driftY) >= DRIFT_MAX) dirY *= -1;

  container.style.transform = `translate(calc(-50% + ${driftX}px), calc(-50% + ${driftY}px))`;
}

setInterval(drift, DRIFT_INTERVAL);
```

**Step 2: Verify**

Open in browser, wait 30+ seconds. Content should shift slightly. Inspect element — `transform` values should change each tick.

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add burn-in protection with slow drift"
```

---

### Task 5: Wake Lock API

**Files:**
- Modify: `index.html` (append to the `<script>` block)

**Step 1: Add wake lock**

Append to the `<script>` block:

```javascript
// --- Wake Lock: keep screen on ---
let wakeLock = null;

async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => { wakeLock = null; });
  } catch (e) {
    // Wake Lock not supported or failed
  }
}

requestWakeLock();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    requestWakeLock();
  }
});
```

**Step 2: Verify**

On Android Chrome, the screen should stay on indefinitely. On desktop, check DevTools console — no errors.

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add Wake Lock API to keep screen on"
```

---

### Task 6: PWA manifest

**Files:**
- Create: `manifest.json`

**Step 1: Create manifest.json**

```json
{
  "name": "Óra",
  "short_name": "Óra",
  "description": "Fullscreen clock with Eger temperature",
  "start_url": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#000000",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%23000' width='100' height='100'/><text x='50' y='62' text-anchor='middle' font-size='50' fill='white' font-family='monospace'>🕐</text></svg>",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any"
    }
  ]
}
```

**Step 2: Verify**

Open DevTools > Application > Manifest. Should show the manifest data with black theme.

**Step 3: Commit**

```bash
git add manifest.json
git commit -m "feat: add PWA manifest"
```

---

### Task 7: Service Worker

**Files:**
- Create: `sw.js`
- Modify: `index.html` (append service worker registration to `<script>`)

**Step 1: Create sw.js**

```javascript
const CACHE_NAME = 'ora-v1';
const SHELL_FILES = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Network-first for weather API
  if (url.hostname === 'api.open-meteo.com') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for app shell
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
```

**Step 2: Add SW registration to index.html**

Append to the `<script>` block:

```javascript
// --- Service Worker ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

**Step 3: Verify**

Serve with a local HTTP server: `python3 -m http.server 8000`
Open `http://localhost:8000`, check DevTools > Application > Service Workers. SW should be registered and active.

**Step 4: Commit**

```bash
git add sw.js index.html
git commit -m "feat: add service worker for offline support"
```

---

### Task 8: Final verification and PNG icon

**Files:**
- Modify: `manifest.json` (add 192px and 512px PNG icon entries if desired)

**Step 1: End-to-end test**

Serve locally: `python3 -m http.server 8000`

Verify checklist:
- [ ] Black background, white clock centered
- [ ] Time updates every second, colon blinks
- [ ] Hungarian date displayed correctly
- [ ] Temperature shows after API call
- [ ] Content drifts every 30 seconds
- [ ] PWA installable (Chrome shows install prompt)
- [ ] Works offline after first load
- [ ] Screen stays on (Android)

**Step 2: Generate simple PNG icons**

Create a simple canvas-based icon generator or use an inline SVG icon (already in manifest). For full PWA compliance, add 192x192 and 512x512 PNG icons.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: final polish and PWA icons"
```
