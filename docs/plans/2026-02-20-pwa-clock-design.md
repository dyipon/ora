# PWA Clock with Eger Temperature — Design

## Overview

Black-background fullscreen clock PWA for Android Chrome. Shows time (HH:MM), date in Hungarian, and current temperature in Eger. Burn-in protection via slow drift animation. Wake Lock API keeps screen on.

## Architecture

Single static site, 3 files:

- `index.html` — full app (HTML + inline CSS + inline JS)
- `manifest.json` — PWA manifest (standalone, black theme)
- `sw.js` — Service Worker (offline caching)

No build step, no dependencies.

## Display

- **Background:** `#000`
- **Clock:** large monospace digits (HH:MM), sized with `vw` units to fill screen
- **Separator:** colon blinks every second
- **Date:** below clock, smaller, Hungarian format ("2026. februar 20., pentek")
- **Temperature:** bottom area, "Eger: 5°C" format
- **Burn-in protection:** entire content block drifts slowly via `transform: translate()`, ~1-2px every 30s, bounces at screen edges

## Data Flow

1. **Time:** `setInterval` every 1s, updates HH:MM display and colon blink
2. **Date:** updates on day change
3. **Temperature:** Open-Meteo API every 10 minutes
   - `https://api.open-meteo.com/v1/forecast?latitude=47.9025&longitude=20.3772&current=temperature_2m`
   - No API key required
   - On error: keeps last successful value displayed

## PWA

- `manifest.json`: `display: standalone`, `background_color: #000`, `theme_color: #000`
- Service Worker: cache-first for app shell, network-first for weather API
- Wake Lock API: keeps screen awake on Android Chrome

## Deployment

Cloudflare Pages (free tier) — fast CDN, zero config for static sites.
