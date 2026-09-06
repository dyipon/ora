# Időjárás Szolgáltatók és Modellek Dokumentációja

Ez a dokumentáció összefoglalja a projekt időjárás-előrejelzési integrációját, a tesztelt modellek pontosságát, valamint a Google Weather API (WeatherNext 3) jövőbeli integrációs lehetőségeit.

---

## 1. Jelenlegi megoldás: Open-Meteo (DWD ICON-EU)

A projekt az [Open-Meteo Forecast API](https://open-meteo.com/)-t használja.

### Miért volt korábban pontatlan az óra?
* Az eredeti URL-ben nem volt megadva explicit modell paraméter (`&models=...`), ezért az Open-Meteo az automatikus `best_match` választót használta.
* Eger koordinátáira (`47.9025, 20.3772`) a `best_match` a **Météo-France (Arpege)** modell adatait szolgálta ki, amely a Kárpát-medencében és a Bükk környéki domborzatnál súlyosan felülbecsülte a hőmérsékletet (akár 5–6 °C eltéréssel).

### Miért a DWD ICON-EU (`icon_seamless`) a kiválasztott modell?
* **Nagy térbeli felbontás:** ~6.5 km-es rács Európára.
* **Gyakori újraszámítás:** A Német Meteorológiai Szolgálat (DWD) **3 óránként** futtatja a modellt (00, 03, 06, 09, 12, 15, 18, 21 UTC), így a hidegfrontokat és hirtelen lehűléseket órákkal gyorsabban leköveti.
* **Topográfiai illeszkedés:** Kifejezetten a közép-európai domborzatra optimalizált.
* **Költség és infrastruktúra:** Ingyenes, nem igényel API kulcsot, és a böngészőből közvetlenül hívható (CORS engedélyezett).

### Használt API végpont:
```javascript
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=47.9025&longitude=20.3772&current=temperature_2m&daily=temperature_2m_max,weather_code,wind_speed_10m_max&hourly=temperature_2m,weather_code&timezone=auto&forecast_days=2&models=icon_seamless';
```

### Alternatíva: ECMWF IFS (`ecmwf_ifs`)
Ha globális aranystandard numerikus modellre lenne szükség, az URL végére `&models=ecmwf_ifs` írható (~9 km HRES felbontás, napi 4 frissítés).

---

## 2. Google Weather API és a WeatherNext 3

### Mi az a WeatherNext 3?
* A **Google DeepMind** és a Google Research által 2026 szeptemberében bejelentett globális AI időjárás-előrejelző modell (a korábbi GraphCast és WeatherNext 2 közvetlen utódja).
* **Főbb jellemzői:**
  * Óránként frissülő geostacionárius műholdkép-mozaikokból és valós meteorológiai állomási adatokból tanul.
  * 5 km-es felbontás a felszíni változókra (hőmérséklet, csapadék).
  * Akár 50%-kal pontosabb csapadék-előrejelzés rövid távon.
  * Beépítve a Google Keresőbe, a Gemini appba és a **Google Maps Platform Weather API**-ba.

### Tudható-e az API válaszból a modell neve?
* **Nem:** A Google Weather API válasz JSON struktúrája nem tartalmaz `model` mezőt. A Google egységes, menedzselt szolgáltatásként nyújtja a meteorológiai adatokat.
* **Igen a háttérben:** A Google hivatalos bejelentése alapján a Weather API mögött a WeatherNext 3 AI modell és a lokális mérőállomási korrekciók együttese állítja elő az adatokat.

### Google Weather API Végpontok (Eger koordináták)

| Végpont | Cél | Paraméterek |
| :--- | :--- | :--- |
| `https://weather.googleapis.com/v1/currentConditions:lookup` | Aktuális állapot | `key=...&location.latitude=47.9025&location.longitude=20.3772` |
| `https://weather.googleapis.com/v1/forecast/hours:lookup` | Óránkénti előrejelzés | `...&hours=6` |
| `https://weather.googleapis.com/v1/forecast/days:lookup` | Napi előrejelzés | `...&days=2` |

---

## 3. Miért nem hívható meg a Google API közvetlenül a böngészőből?

1. **CORS blokkolás:** A `weather.googleapis.com` szerveroldali használatra van méretezve. Ha a böngészőből futó JavaScript (`Origin: https://dyipon.github.io`) küld kérést, a Google nem küld `Access-Control-Allow-Origin` fejlécet, a böngésző eldobja a kérést (HTTP 404 / CORS error).
2. **API kulcs védelme:** A publikus GitHub repóba kitett Google Cloud API kulcsot a Google biztonsági botjai automatikusan tiltják/figyelmeztetést küldenek, és mások visszaélhetnek a felhasznált kvótával.

---

## 4. Megvalósítási recept: Google Weather átállás proxyval

Ha a jövőben mégis a Google Weather API-ra szeretnénk átállítani az órát, egy könnyű proxy rétegre van szükség:

```
[dyipon.github.io/ora]  --->  [Cloudflare Worker / K8s Proxy]  --->  [weather.googleapis.com]
   (CORS engedélyezve)            (API kulcs titkosítva)               (Google API)
```

### Példa: Cloudflare Worker proxy (`worker.js`)
```javascript
export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const LAT = '47.9025';
    const LON = '20.3772';
    const API_KEY = env.GOOGLE_WEATHER_API_KEY; // Cloudflare secret környezeti változó!

    // Cache 10 percig a kvótatakarékosság miatt
    const cacheKey = new Request(request.url, request);
    const cache = caches.default;
    let response = await cache.match(cacheKey);

    if (!response) {
      const [currentRes, hourlyRes] = await Promise.all([
        fetch(`https://weather.googleapis.com/v1/currentConditions:lookup?key=${API_KEY}&location.latitude=${LAT}&location.longitude=${LON}`),
        fetch(`https://weather.googleapis.com/v1/forecast/hours:lookup?key=${API_KEY}&location.latitude=${LAT}&location.longitude=${LON}&hours=6`)
      ]);

      const current = await currentRes.json();
      const hourly = await hourlyRes.json();

      const combined = { current, hourly };

      response = new Response(JSON.stringify(combined), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=600'
        }
      });

      await cache.put(cacheKey, response.clone());
    }

    return response;
  }
};
```
