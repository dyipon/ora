# CLAUDE.md — Óra PWA

Fullscreen digitális óra PWA egri időjárással. Élő: https://dyipon.github.io/ora/

## Felépítés

Nincs build lépés, nincs függőség. Négy fájl a repo gyökerében:

| Fájl | Tartalom |
|---|---|
| `index.html` | **Minden** — markup, CSS, és a teljes JS egyetlen inline `<script>`-ben |
| `sw.js` | Service worker (cache + offline fallback) |
| `manifest.json` | PWA manifest |
| `docs/` | Tervezési dokumentumok, [időjárás-szolgáltatók](docs/weather-providers.md) |

Ha JS-t szerkesztesz, az az `index.html`-ben van, nem külön fájlban.

## Deploy

`git push origin main` → `.github/workflows/deploy.yml` → GitHub Pages. **~60 másodperc**
a push és az élő oldal frissülése között. Nincs staging.

A `dyipon.github.io` **gyökér 404** — csak a project page (`/ora/`) létezik. Ellenőrzéskor
mindig a teljes útvonalat hívd, cache-busterrel:

```bash
curl -s "https://dyipon.github.io/ora/index.html?cb=$RANDOM" | grep ...
```

## Az időjárás frissítési lánca

A megjelenített hőmérséklet frissessége **négy rétegen** múlik, és bármelyik elrontja.
2026-09-07-én 9 °C állt a kijelzőn 13 °C helyett; a hiba mind a négy rétegen ült.

**1. Trigger.** A `setInterval` egyedül **nem elég**: rejtett lapon throttle-olódik,
alvó eszközön teljesen felfüggesztődik. Ezért az 5 perces ciklus mellett kell:
`visibilitychange`, `focus`, `online`, `pageshow` → azonnali frissítés, plusz egy
15 másodperces watchdog, ami észreveszi az elmaradt frissítést ébredés után.
Új trigger hozzáadásakor a `fetchInFlight` guard védi a duplikált kéréstől.

**2. HTTP cache.** Az Open-Meteo **nem küld `Cache-Control` headert** (csak `Date`-et),
így a böngésző heurisztikus cache-t alkalmazhat. Ezért kell a `&_t=<timestamp>`
cache-buster **és** a `cache: 'no-store'`. Egyik sem elhagyható.

**3. Service worker.** Network-first, de hibánál a cache-elt régi választ adja vissza.
A `_t` param miatt a cache kulcsot **normalizálni kell** (`weatherCacheKey()` levágja),
különben minden frissítés új bejegyzést hagyna, és az offline fallback sosem találna.
A shell is network-first — cache-first mellett egy deploy nem jutna el az eszközre.
**Release-nél kötelező a `CACHE_NAME` bumpolása** (`ora-v3` → `ora-v4`), különben
az `activate` nem takarítja a régit.

**4. Hibakezelés.** A csendben elnyelt hiba a legrosszabb: a régi érték frissnek
látszik. Ezért: nem-OK válasz dob, `AbortController` 15 s után timeoutol, és a
30 percnél régebbi adat **elhalványítja** a blokkot (`.stale`, opacity 0.25).

A staleness az API `current.time` mezőjéből számol, **nem** a fetch idejéből — így
akkor is elkapja, ha a friss fetch régi (cache-elt) adatot hozott.

## Open-Meteo buktatók

* A `current.temperature_2m` az **órás sorból interpolált** érték, `interval: 900`
  (15 percre kvantált `current.time`). Emiatt gyors reggeli felmelegedéskor drasztikusan
  eltérhet az azonos órához tartozó `hourly` értéktől — 2026-09-07-én a `hourly` 07:00
  = 8,6 °C, a `current` 07:45 = 13,0 °C. **Ez nem hiba.** Következmény: reggel egyetlen
  kihagyott frissítés is 4-5 fokos látszólagos hibát okoz.
* A modell `icon_seamless` (DWD ICON-EU) — a `best_match` **rosszabb** Egerre,
  lásd [docs/weather-providers.md](docs/weather-providers.md). Mérés 2026-09-07 07:45:
  valós 13 °C, `icon_seamless` 13,0 °C, `best_match` 15,4 °C.
* Rate limit: 5 perces ciklus ≈ 288 kérés/nap, a hibás kérések retry-ja 60 s backoffal
  korlátozva. Ne vidd 1 perc alá az intervallumot.

## Tesztelés böngésző nélkül

Ebben a környezetben **nincs Playwright/Selenium**, és böngészőt sem indítunk. A JS-t
node alatt lehet futtatni egy DOM-stubbal, valódi API-hívással (node 18+ tud `fetch`-et
és `AbortController`-t). A minta: kivágni a `<script>` tartalmát, elé fűzni egy
`document`/`window` stubot, ami a `getElementById`-ra fake elemeket ad
(`textContent`, `classList.toggle`, `remove`), és a `setInterval`-t no-oppá tenni,
hogy a lap saját timerei ne induljanak el. Így a `updateWeather()` végigfut és a
`textContent`-ek kiolvashatók.

Szintaxis-ellenőrzés: `node --check` a kivágott scriptre és az `sw.js`-re.

## Snake animáció

`SNAKE_ENABLED = false` az `index.html`-ben — kikapcsolva, a canvas törlődik a DOM-ból.
A teljes implementáció megmaradt, a flag `true`-ra állításával visszakapcsolható.

## Konvenciók

* Kód, kommentek, fájlnevek, commit üzenetek: **angolul**.
* Felhasználónak látható szöveg (dátum, README, docs): **magyarul**.
