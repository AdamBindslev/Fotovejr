# FotoVejr – Fotografiske Signaler 🌅🌫️✨

En lynhurtig og specialiseret **Progressive Web App (PWA)** skabt til fotografer, der leder efter de rette fotografiske signaler i vejret: **morgentåge**, **den gyldne time**, **den blå time**, **fuldmåne** og **krystalklar stjernehimmel (astro)**.

Appen starter automatisk med at finde din **aktuelle GPS-position**, navngiver automatisk den bydel eller det område du befinder dig i med reverse geocoding, og beregner fotobetingelserne lokalt. Den bygger på åbne vejrdata fra **Open-Meteo** (ingen API-nøgle krævet) og højpræcisions astronomiske beregninger, der fungerer **100% offline** i telefonens browser.

---

## 🌟 Nøglefunktioner for fotografer

1. **📍 Automatisk GPS & Stedsnavngivning**:
   - Finder automatisk din aktuelle GPS-position ved opstart.
   - Viser det reelle by-/områdenavn (f.eks. *Hellerup*, *Aarhus C*, *Silkeborg*), nøjagtige koordinater og GPS-præcision i meter, så du aldrig er i tvivl om at GPS'en virker.
   - Knap til at opdatere GPS med ét tryk i felten.

2. **🌫️ Morgentåge- & Dis-indeks**:
   - Vurderer sandsynligheden for strålingståge over lavninger, søer og enge ved daggry.
   - Beregnet ud fra forskellen mellem temperatur og dugpunkt ($\Delta T = T - T_d < 2^\circ\text{C}$), relativ luftfugtighed (> 88%), lav vindhastighed (< 2-3 m/s) og sigtbarhed.

3. **🌅 Gylden Time & 🌆 Blå Time (Morgen & Aften)**:
   - Nøjagtige start- og sluttidspunkter for både morgenens og aftenens gyldne og blå time.
   - **Sol-azimut**: Angiver den præcise kompasretning i grader og verdenshjørne (f.eks. `104° ØSØ`), så du kan planlægge din kameravinkel før solen står op eller går ned.
   - **Sky-fordeling i 3 lag**: Viser opdelingen i lave, mellem og høje skyer. Høje og mellemskyer giver ofte flammende solnedgange, mens tunge lave skyer blokerer lyset.

4. **✨ Stjerneklar Nat & Astro-score**:
   - Beregner det reelle astronomiske mørkevindue (solen under -18°).
   - Natskydække og **måne-interferens**: Viser om månens lysstyrke overdøver Mælkevejen, eller om himlen er optimalt kulsort.

5. **🌕 Månefase & Måneopgang/-nedgang**:
   - Dagsaktuel månefase (f.eks. Fuldmåne, Nymåne, Tiltagende månesegl) og belysningsprocent.
   - Op- og nedgangstider samt azimut-kompasretning for månen.

6. **🔴 Rød Astro Nattilstand (Red Night Mode)**:
   - Ét klik på 🔴 forvandler hele skærmen til en dybrød monokrom farvepalet.
   - Bevarer øjets rhodopsin og nattesyn, når du fotograferer ude i mørket om natten.

7. **📱 PWA & Fuld Offline-støtte**:
   - Installeres direkte på mobilen som et app-ikon uden brug af App Store eller Google Play.
   - Service Worker (`sw.js`) cacher appen og den seneste vejrudsigt, så du kan åbne den dybt inde i en nationalpark uden mobildækning og stadig have fulde sol-, måne- og tågeberegninger.

---

## 📲 Sådan installeres appen på mobilen (PWA)

### iPhone / iPad (Safari)
1. Åbn `https://adambindslev.github.io/Fotovejr/` i **Safari**.
2. Tryk på **Del-knappen** (firkanten med pil op).
3. Rul ned og vælg **"Føj til hjemmeskærm"**.
4. Appen installeres med app-ikonet og åbner i fuld skærm uden browserbjælker!

### Android (Chrome)
1. Åbn `https://adambindslev.github.io/Fotovejr/` i **Chrome**.
2. Tryk på de **3 prikker** øverst til højre.
3. Vælg **"Føj til startskærm"** eller **"Installer app"**.
