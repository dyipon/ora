# Óra PWA

Fullscreen Progressive Web App (PWA) digitális óra egri időjárás- és hőmérséklet-előrejelzéssel és képernyővédő burn-in védelemmel.

Élő oldal: **[dyipon.github.io/ora/](https://dyipon.github.io/ora/)**

---

## Főbb funkciók
* **Digitális óra & dátum:** Óra, perc, nap és magyar nyelvű dátumkijelzés.
* **Időjárás előrejelzés:**
  * Aktuális egri hőmérséklet.
  * Napi csúcshőmérséklet és szélsebesség-figyelmeztetés.
  * Következő 4 óra ikonjai és hőmérsékletei.
  * **Modell:** Német Meteorológiai Szolgálat (DWD) **ICON-EU** modellje (~6.5 km felbontás, 3 óránkénti frissítés) az Open-Meteo API-n keresztül.
  * **Frissítés:** 5 percenként, továbbá azonnal, ha a lap újra láthatóvá válik, fókuszt kap vagy visszatér a hálózat. Egy 15 másodperces watchdog bepótolja azt a frissítést, ami alvó eszközön kimaradt.
  * **Elavult adat jelzése:** ha a megjelenített mérés 30 percnél régebbi, a hőmérséklet-blokk elhalványul, hogy a beragadt érték látszódjon.
* **Képernyő ébrentartása (Wake Lock API):** Nem kapcsol le a kijelző, miközben az óra fut.
* **Burn-in védelem:** Lassú, diszkrét pozíció-driftelés az OLED/AMOLED panelek beégésének megelőzésére.
* **Snake háttéranimáció:** Jelenleg **kikapcsolva** (`SNAKE_ENABLED = false` az `index.html`-ben); a kód megmaradt, egy sor átírásával visszakapcsolható.
* **Offline / PWA támogatás:** Service Worker cache (`ora-v3`, network-first), telepíthető kezdőképernyőre vagy fullscreen futtatható.

---

## Dokumentáció
* [CLAUDE.md — felépítés, deploy, frissítési lánc, buktatók](CLAUDE.md)
* [Időjárás-szolgáltatók, modellek és Google WeatherNext 3 integráció](docs/weather-providers.md)
* [PWA Óra tervezési dokumentum](docs/plans/2026-02-20-pwa-clock-design.md)
* [Snake animáció tervezése](docs/plans/2026-02-24-snake-animation-design.md)
