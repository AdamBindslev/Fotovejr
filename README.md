# FotoVejr – af Fotografiske Signaler 📸✨

En lynhurtig og specialiseret **Progressive Web App (PWA)** skabt til fotografer, der leder efter de rette fotografiske signaler i vejret: **morgentåge**, **den gyldne time**, **den blå time**, **fuldmåne** og **krystalklar stjernehimmel (astro)**.

Bygget som et professionelt **Kamera-EVF (Elektronisk Søger) feltværktøj** med præcisions-vektorgrafik og to-lags meteorologiske data for fotografer i felten.

---

## 🌟 Nøglefunktioner for fotografer

1. **🎯 Hero Shot Call (Dagens Bedste Fotovindue)**:
   - Appens radar analyserer automatisk dagens lys- og vejrforhold og kårer **dagens absolut bedste fotomulighed** (f.eks. morgentåge ved søer eller en flammende solnedgang).
   - Viser tidspunkt, kvalitetsscore (0-100), vind og azimut uden at du behøver lede i dataene.

2. **📅 'Føj til Kalender' med 45 min. alarm**:
   - Med ét tryk genereres en `.ics`-kalenderaftale direkte til telefonens native kalender (iOS/Android/Google/Apple).
   - Inkluderer automatiske forberedelses-alarmer (f.eks. 45 minutter før solopgang), så du når frem til fotospottet i tide.

3. **📐 To-Lags Informationsmodel (Glanceable + Deep Data)**:
   - **Lag 1**: Klare fotografiske vurderinger, præcise tidsvinduer og kompasretninger.
   - **Lag 2**: Fold-ud sektioner med dugpunktsdifferens, luftfugtighed, vind og lagdelte skyer (lave, mellem og høje).

4. **📍 Kompakt EVF-topbar med GPS & Live Stedsnavn**:
   - Viser det reelle by-/områdenavn (f.eks. *Silkeborg*, *Aarhus C*), præcise koordinater og GPS-nøjagtighed i meter.
   - Knap til at opdatere GPS med ét tryk i felten eller søge alternative fotospots.

5. **🌫️ Morgentåge- & Dis-indeks**:
   - Vurderer sandsynligheden for strålingståge over lavninger, søer og enge ved daggry.
   - Beregnet ud fra forskellen mellem temperatur og dugpunkt ($\Delta T = T - T_d < 2^\circ\text{C}$), relativ luftfugtighed (> 88%), lav vindhastighed (< 2-3 m/s) og sigtbarhed.

6. **🌅 Gylden Time & 🌆 Blå Time (Morgen & Aften)**:
   - Nøjagtige start- og sluttidspunkter for både morgenens og aftenens gyldne og blå time.
   - **Sol-azimut**: Angiver den præcise kompasretning i grader og verdenshjørne (f.eks. `104° ØSØ`), så du kan planlægge din kameravinkel før solen står op eller går ned.

7. **✨ Stjerneklar Nat & Astro-score**:
   - Beregner det reelle astronomiske mørkevindue (solen under -18°).
   - Natskydække og **måne-interferens**: Viser om månens lysstyrke overdøver Mælkevejen, eller om himlen er optimalt kulsort.

8. **🔴 Rød Astro Nattilstand (Red Night Mode)**:
   - Ét klik på ASTRO forvandler interfacet til en krystalklar dybrød monokrom farvepalet.
   - Bevarer øjets rhodopsin og nattesyn, når du fotograferer ude i mørket om natten.

9. **📱 PWA & Fuld Offline-støtte**:
   - Installeres direkte på mobilen som et app-ikon uden brug af App Store eller Google Play.
   - Service Worker (`sw.js`) cacher appen og den seneste vejrudsigt for fuld offline adgang.

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
