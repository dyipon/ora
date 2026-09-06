# Óra PWA

Fullscreen Progressive Web App (PWA) digitális óra egri időjárás- és hőmérséklet-előrejelzéssel, képernyővédő burn-in védelemmel és háttérben futó snake animációval.

Élő oldal: **[dyipon.github.io/ora/](https://dyipon.github.io/ora/)**

---

## Főbb funkciók
* **Digitális óra & dátum:** Óra, perc, nap és magyar nyelvű dátumkijelzés.
* **Időjárás előrejelzés:**
  * Aktuális egri hőmérséklet.
  * Napi csúcshőmérséklet és szélsebesség-figyelmeztetés.
  * Következő 4 óra ikonjai és hőmérsékletei.
  * **Modell:** Német Meteorológiai Szolgálat (DWD) **ICON-EU** modellje (~6.5 km felbontás, 3 óránkénti frissítés) az Open-Meteo API-n keresztül.
* **Képernyő ébrentartása (Wake Lock API):** Nem kapcsol le a kijelző, miközben az óra fut.
* **Burn-in védelem:** Lassú, diszkrét pozíció-driftelés az OLED/AMOLED panelek beégésének megelőzésére.
* **Snake háttéranimáció:** A feliratokat és a szöveges blokkokat kikerülő, háttérben mozgó kígyó animáció.
* **Offline / PWA támogatás:** Service Worker cache (`ora-v2`), telepíthető kezdőképernyőre vagy fullscreen futtatható.

---

## Dokumentáció
* [Időjárás-szolgáltatók, modellek és Google WeatherNext 3 integráció](docs/weather-providers.md)
* [PWA Óra tervezési dokumentum](docs/plans/2026-02-20-pwa-clock-design.md)
* [Snake animáció tervezése](docs/plans/2026-02-24-snake-animation-design.md)
