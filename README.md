# Clear or Foggy – Fotografens Vejrguide 🌅🌫️✨

En flad, lynhurtig og specialiseret **Progressive Web App (PWA)** skabt til fotografer, der jagter det perfekte lys: **morgentåge**, **den gyldne time**, **den blå time**, **fuldmåne** og **krystalklar stjernehimmel (astro)**.

Appen er baseret på åbne vejrdata fra **Open-Meteo** (kræver ingen API-nøgle) og højpræcisions astronomiske beregninger, der kører **100% offline** direkte i telefonens browser.

---

## 🌟 Nøglefunktioner for fotografer

1. **🌫️ Morgentåge- & Dis-indeks**:
   - Vurderer sandsynligheden for strålingståge over enge, søer og lavninger ved daggry.
   - Beregnet ud fra forskellen mellem temperatur og dugpunkt ($\Delta T = T - T_d < 2^\circ\text{C}$), relativ luftfugtighed (> 88%), lav vindhastighed og sigtbarhed.

2. **🌅 Gylden Time & 🌆 Blå Time (Morgen & Aften)**:
   - Nøjagtige start- og sluttidspunkter for både morgenens og aftenens gyldne og blå time.
   - **Sol-azimut**: Angiver den præcise kompasretning i grader og verdenshjørne (f.eks. `104° ØSØ`), så du kan planlægge din kameravinkel før solen står op eller går ned.
   - **Sky-fordeling i 3 lag**: Viser opdelingen i lave, mellem og høje skyer. Høje og mellemskyer giver ofte flammende solnedgange, mens tunge lave skyer blokerer lyset.

3. **✨ Stjerneklar Nat & Astro-score**:
   - Beregner det reelle astronomiske mørkevindue (solen under -18°).
   - Natskydække og **måne-interferens**: Viser om månens lysstyrke overdøver Mælkevejen, eller om himlen er optimalt kulsort.

4. **🌕 Månefase & Måneopgang/-nedgang**:
   - Dagsaktuel månefase (f.eks. Fuldmåne, Nymåne, Tiltagende månesegl) og belysningsprocent.
   - Op- og nedgangstider samt azimut-kompasretning for månen.

5. **🔴 Rød Astro Nattilstand (Red Night Mode)**:
   - Ét klik på 🔴 forvandler hele skærmen til en dybrød monokrom farvepalet.
   - Bevarer øjets rhodopsin og nattesyn, når du fotograferer ude i mørket om natten.

6. **📍 GPS & Fotospots**:
   - Find din aktuelle position med ét tryk på GPS.
   - Søg frit på danske og internationale byer og naturspots (f.eks. *Møns Klint*, *Skagen Grenen*, *Silkeborg Søerne*, *Vadehavet*).
   - Gem dine foretrukne fotolokaliteter i hurtigbjælken som favoritter.

7. **📱 PWA & Fuld Offline-støtte**:
   - Installeres direkte på mobilen som et app-ikon uden brug af App Store eller Google Play.
   - Service Worker (`sw.js`) cacher appen og den seneste vejrudsigt, så du kan åbne den dybt inde i en nationalpark uden mobildækning og stadig have fulde sol-, måne- og tågeberegninger.

---

## 📲 Sådan installeres appen på mobilen (PWA)

### iPhone / iPad (Safari)
1. Åbn `index.html` (eller dit hosting-link) i **Safari**.
2. Tryk på **Del-knappen** (firkanten med pil op nederst i skærmen).
3. Rul ned og vælg **"Føj til hjemmeskærm"** (Add to Home Screen).
4. Appen installeres med app-ikonet og åbner i fuld skærm uden browserbjælker!

### Android (Chrome)
1. Åbn i **Chrome**.
2. Tryk på de **3 prikker** øverst til højre.
3. Vælg **"Føj til startskærm"** eller **"Installer app"**.

---

## 📁 Filstruktur

```text
clear or foggy/
├── index.html            # Hovedside, semantisk markup og PWA meta tags
├── styles.css            # Mørkt fototema, CSS variabler, astro rød tilstand
├── astro.js              # Astronomisk beregningskerne (sol, måne, azimut, tusmørke)
├── weather.js            # Open-Meteo integration, tågeberegning og offline cache
├── app.js                # Brugergrænseflade, GPS, søgning, favoritter og hændelser
├── sw.js                 # Service Worker til offline caching i felten
├── manifest.webmanifest  # PWA manifest
├── icon.svg              # Skalerbar SVG-vektorikon (linse, sol, tåge, stjerner)
├── icon-192.png          # PWA appikon (192x192)
└── icon-512.png          # PWA appikon (512x512)
```

---

## 🛠️ Lokal test

Du kan køre en simpel lokal webserver for at teste PWA og Service Worker:

```bash
# Python 3
python3 -m http.server 8080

# Åbn derefter i browseren:
http://localhost:8080
```
