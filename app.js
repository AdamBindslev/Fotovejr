/**
 * app.js - UI logik, GPS, stedsøgning, favoritter, dagsvælger og nattilstand for Clear or Foggy PWA
 */

(function () {
  'use strict';

  // Forudindstillede danske fotospots hvis brugeren ikke har gemt nogen
  const DEFAULT_SPOTS = [
    { name: 'København', lat: 55.6761, lng: 12.5683 },
    { name: 'Møns Klint', lat: 54.9647, lng: 12.5511 },
    { name: 'Skagen Grenen', lat: 57.7428, lng: 10.6447 },
    { name: 'Silkeborg Søerne', lat: 56.1697, lng: 9.5517 },
    { name: 'Bornholm Hammeren', lat: 55.2833, lng: 14.7667 },
    { name: 'Vadehavet Ribe', lat: 55.3283, lng: 8.7628 }
  ];

  // App tilstand
  let state = {
    currentLoc: { name: 'København', lat: 55.6761, lng: 12.5683, isGps: false },
    selectedDayIndex: 0,
    forecastData: null,
    parsedDays: [],
    favorites: [],
    isNightRed: false,
    searchDebounceTimer: null
  };

  // DOM elementer
  const el = {
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingText: document.getElementById('loadingText'),
    btnNightMode: document.getElementById('btnNightMode'),
    btnRefresh: document.getElementById('btnRefresh'),
    btnGps: document.getElementById('btnGps'),
    btnSearchOpen: document.getElementById('btnSearchOpen'),
    btnFavoriteToggle: document.getElementById('btnFavoriteToggle'),
    favStarIcon: document.getElementById('favStarIcon'),
    locName: document.getElementById('locName'),
    locCoords: document.getElementById('locCoords'),
    locationCurrentWrap: document.getElementById('locationCurrentWrap'),
    searchDropdown: document.getElementById('searchDropdown'),
    searchInput: document.getElementById('searchInput'),
    searchResults: document.getElementById('searchResults'),
    favoritesBar: document.getElementById('favoritesBar'),
    statusBanner: document.getElementById('statusBanner'),
    statusBannerText: document.getElementById('statusBannerText'),
    statusBannerTime: document.getElementById('statusBannerTime'),
    daysScroll: document.getElementById('daysScroll'),

    // Tåge
    fogBadge: document.getElementById('fogBadge'),
    fogAssessment: document.getElementById('fogAssessment'),
    fogTimeWindow: document.getElementById('fogTimeWindow'),
    fogSpread: document.getElementById('fogSpread'),
    fogHumidity: document.getElementById('fogHumidity'),
    fogWind: document.getElementById('fogWind'),
    fogVisibility: document.getElementById('fogVisibility'),

    // Morgen
    morningBadge: document.getElementById('morningBadge'),
    morningAssessment: document.getElementById('morningAssessment'),
    morningBlueTime: document.getElementById('morningBlueTime'),
    morningBlueCompass: document.getElementById('morningBlueCompass'),
    morningGoldenTime: document.getElementById('morningGoldenTime'),
    morningGoldenCompass: document.getElementById('morningGoldenCompass'),
    morningSunriseSub: document.getElementById('morningSunriseSub'),
    morningTotalClouds: document.getElementById('morningTotalClouds'),
    morningValLow: document.getElementById('morningValLow'),
    morningValMid: document.getElementById('morningValMid'),
    morningValHigh: document.getElementById('morningValHigh'),
    morningBarLow: document.getElementById('morningBarLow'),
    morningBarMid: document.getElementById('morningBarMid'),
    morningBarHigh: document.getElementById('morningBarHigh'),

    // Aften
    eveningBadge: document.getElementById('eveningBadge'),
    eveningAssessment: document.getElementById('eveningAssessment'),
    eveningGoldenTime: document.getElementById('eveningGoldenTime'),
    eveningGoldenCompass: document.getElementById('eveningGoldenCompass'),
    eveningSunsetSub: document.getElementById('eveningSunsetSub'),
    eveningBlueTime: document.getElementById('eveningBlueTime'),
    eveningBlueCompass: document.getElementById('eveningBlueCompass'),
    eveningTotalClouds: document.getElementById('eveningTotalClouds'),
    eveningValLow: document.getElementById('eveningValLow'),
    eveningValMid: document.getElementById('eveningValMid'),
    eveningValHigh: document.getElementById('eveningValHigh'),
    eveningBarLow: document.getElementById('eveningBarLow'),
    eveningBarMid: document.getElementById('eveningBarMid'),
    eveningBarHigh: document.getElementById('eveningBarHigh'),

    // Astro
    astroBadge: document.getElementById('astroBadge'),
    astroAssessment: document.getElementById('astroAssessment'),
    astroDarkWindow: document.getElementById('astroDarkWindow'),
    astroClouds: document.getElementById('astroClouds'),
    astroMoonImpact: document.getElementById('astroMoonImpact'),

    // Måne
    moonIconHeader: document.getElementById('moonIconHeader'),
    moonPhaseTitle: document.getElementById('moonPhaseTitle'),
    moonIllumSubtitle: document.getElementById('moonIllumSubtitle'),
    moonBadge: document.getElementById('moonBadge'),
    moonriseTime: document.getElementById('moonriseTime'),
    moonriseCompass: document.getElementById('moonriseCompass'),
    moonsetTime: document.getElementById('moonsetTime'),
    moonsetCompass: document.getElementById('moonsetCompass'),

    // Accordion / Hourly
    btnToggleHourly: document.getElementById('btnToggleHourly'),
    hourlyContent: document.getElementById('hourlyContent'),
    hourlyTableBody: document.getElementById('hourlyTableBody')
  };

  // --- INITIALISERING ---
  async function init() {
    registerServiceWorker();
    loadPreferences();
    renderFavoritesBar();
    setupEventListeners();

    // Hent vejr for den gemte lokation
    await updateWeather(false);
  }

  // Registrering af Service Worker til PWA og offline
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then((reg) => {
            console.log('Service Worker registreret:', reg.scope);
          })
          .catch((err) => {
            console.warn('Service Worker fejl:', err);
          });
      });
    }
  }

  // Henter brugerindstillinger fra localStorage
  function loadPreferences() {
    // Nattilstand
    const savedNight = localStorage.getItem('photo_night_red') === 'true';
    if (savedNight) {
      state.isNightRed = true;
      document.body.classList.add('theme-night-red');
      el.btnNightMode.classList.add('active-red');
    }

    // Favoritter
    try {
      const savedFavs = localStorage.getItem('photo_favorites');
      if (savedFavs) {
        state.favorites = JSON.parse(savedFavs);
      } else {
        state.favorites = DEFAULT_SPOTS;
        localStorage.setItem('photo_favorites', JSON.stringify(DEFAULT_SPOTS));
      }
    } catch (e) {
      state.favorites = DEFAULT_SPOTS;
    }

    // Sidst valgte lokation
    try {
      const savedLoc = localStorage.getItem('photo_current_loc');
      if (savedLoc) {
        state.currentLoc = JSON.parse(savedLoc);
      }
    } catch (e) {}

    updateLocationDisplay();
    updateFavoriteStar();
  }

  // Opdater visning af nuværende lokation
  function updateLocationDisplay() {
    el.locName.textContent = state.currentLoc.name;
    const latStr = Math.abs(state.currentLoc.lat).toFixed(2) + '°' + (state.currentLoc.lat >= 0 ? 'N' : 'S');
    const lngStr = Math.abs(state.currentLoc.lng).toFixed(2) + '°' + (state.currentLoc.lng >= 0 ? 'Ø' : 'V');
    el.locCoords.textContent = `${latStr}, ${lngStr}${state.currentLoc.isGps ? ' (GPS)' : ''}`;
  }

  // Opdaterer favoritstjerne i header
  function updateFavoriteStar() {
    const isFav = state.favorites.some(
      (f) => Math.abs(f.lat - state.currentLoc.lat) < 0.02 && Math.abs(f.lng - state.currentLoc.lng) < 0.02
    );
    el.favStarIcon.textContent = isFav ? '★' : '☆';
    el.favStarIcon.style.color = isFav ? 'var(--golden-primary)' : 'inherit';
  }

  // Render favorit-spots som klikbare chips
  function renderFavoritesBar() {
    el.favoritesBar.innerHTML = '';
    state.favorites.forEach((spot) => {
      const chip = document.createElement('button');
      chip.className = 'fav-chip';
      const isSelected = Math.abs(spot.lat - state.currentLoc.lat) < 0.02 && Math.abs(spot.lng - state.currentLoc.lng) < 0.02;
      if (isSelected) chip.classList.add('active');
      chip.innerHTML = `<span>📍</span> ${escapeHtml(spot.name)}`;

      chip.addEventListener('click', () => {
        selectLocation(spot.name, spot.lat, spot.lng, false);
      });

      el.favoritesBar.appendChild(chip);
    });
  }

  // Henter vejrdata og opdaterer hele interfacet
  async function updateWeather(forceRefresh = false) {
    showLoading(true, 'Henter vejrdata for ' + state.currentLoc.name + '...');

    try {
      const result = await WeatherEngine.fetchForecast(
        state.currentLoc.lat,
        state.currentLoc.lng,
        forceRefresh
      );

      state.forecastData = result.forecast;

      // Parse alle 7 dage
      state.parsedDays = [];
      for (let i = 0; i < 7; i++) {
        const dayParsed = WeatherEngine.parseDayData(
          state.forecastData,
          i,
          state.currentLoc.lat,
          state.currentLoc.lng
        );
        if (dayParsed) state.parsedDays.push(dayParsed);
      }

      // Vis offline banner hvis vi bruger cachede data
      if (result.isCached) {
        el.statusBanner.classList.add('active');
        el.statusBannerText.textContent = 'Offline tilstand – gemt vejrudsigt';
        el.statusBannerTime.textContent = 'Hentet kl. ' + AstroCalc.formatTime(result.updatedAt);
      } else {
        el.statusBanner.classList.remove('active');
      }

      // Render 7-dages overblikket og det valgte døgn
      renderDaysBar();
      renderSelectedDay();

    } catch (err) {
      console.error('Fejl ved opdatering af vejr:', err);
      el.statusBanner.classList.add('active');
      el.statusBannerText.textContent = 'Kunne ikke hente vejr: ' + (err.message || 'Ukendt fejl');
      el.statusBannerTime.textContent = '';
    } finally {
      showLoading(false);
    }
  }

  // Render 7-dages horisontal scrollbjælke
  function renderDaysBar() {
    el.daysScroll.innerHTML = '';

    const dayNames = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

    state.parsedDays.forEach((dayData, index) => {
      const d = dayData.date;
      const chip = document.createElement('div');
      chip.className = 'day-chip' + (index === state.selectedDayIndex ? ' active' : '');

      let dayTitle = dayNames[d.getDay()];
      if (index === 0) dayTitle = 'I dag';
      else if (index === 1) dayTitle = 'I morgen';

      const dateStr = d.getDate() + '. ' + monthNames[d.getMonth()];

      // Badges ikoner (tåge, astro, gylden, fuldmåne)
      let badgeHtml = '';
      if (dayData.badges && dayData.badges.length > 0) {
        badgeHtml = dayData.badges.map(b => `<span class="day-badge-dot" title="${b.text}">${b.icon}</span>`).join('');
      } else {
        badgeHtml = `<span class="day-badge-dot" style="opacity: 0.3;">☀️</span>`;
      }

      const tempStr = Math.round(dayData.tempMax) + '° / ' + Math.round(dayData.tempMin) + '°';

      chip.innerHTML = `
        <span class="day-chip-name">${dayTitle}</span>
        <span class="day-chip-date">${dateStr}</span>
        <div class="day-chip-badges">${badgeHtml}</div>
        <span class="day-chip-temp">${tempStr}</span>
      `;

      chip.addEventListener('click', () => {
        state.selectedDayIndex = index;
        document.querySelectorAll('.day-chip').forEach((c, i) => {
          c.classList.toggle('active', i === index);
        });
        renderSelectedDay();
      });

      el.daysScroll.appendChild(chip);
    });
  }

  // Render det aktuelt valgte døgn på fotokortene
  function renderSelectedDay() {
    const day = state.parsedDays[state.selectedDayIndex];
    if (!day) return;

    // --- 1. TÅGE-KORT ---
    renderFogCard(day);

    // --- 2. MORGEN-KORT (Gylden & Blå time) ---
    renderMorningCard(day);

    // --- 3. AFTEN-KORT (Gylden & Blå time) ---
    renderEveningCard(day);

    // --- 4. ASTRO / STJERNEKLART-KORT ---
    renderAstroCard(day);

    // --- 5. MÅNE-KORT ---
    renderMoonCard(day);

    // --- 6. TIME-FOR-TIME TABEL ---
    renderHourlyTable(day.hourly);
  }

  // Tåge-kort opdatering
  function renderFogCard(day) {
    const fog = day.fog;
    el.fogBadge.textContent = `${fog.score}% • ${fog.level}`;
    el.fogBadge.className = `score-badge ${fog.classType}`;
    el.fogAssessment.textContent = fog.text;

    // Tidsvindue: ca. 1 time før solopgang til 1 time efter
    if (day.sun.sunrise) {
      const sunriseH = day.sun.sunrise.getHours();
      const sunriseM = day.sun.sunrise.getMinutes();
      const startH = Math.max(0, sunriseH - 1);
      const endH = sunriseH + 1;
      el.fogTimeWindow.textContent = `${padZero(startH)}:${padZero(sunriseM)} – ${padZero(endH)}:${padZero(sunriseM)}`;
    } else {
      el.fogTimeWindow.textContent = '05:30 – 08:30';
    }

    el.fogSpread.textContent = `${fog.avgSpread}°C`;
    el.fogHumidity.textContent = `${fog.avgHumidity}%`;
    el.fogWind.textContent = `${fog.avgWind} km/t`;
    el.fogVisibility.textContent = `${fog.minVisibilityKm} km`;
  }

  // Morgen-kort opdatering
  function renderMorningCard(day) {
    const g = day.goldenMorning;
    const sun = day.sun;

    el.morningBadge.textContent = `${g.icon} ${g.score}% kvalitet`;
    el.morningAssessment.textContent = g.text;

    // Blå time morgen
    if (sun.blueHourMorning.start && sun.blueHourMorning.end) {
      el.morningBlueTime.textContent = `${AstroCalc.formatTime(sun.blueHourMorning.start)} – ${AstroCalc.formatTime(sun.blueHourMorning.end)}`;
    } else {
      el.morningBlueTime.textContent = '--:--';
    }

    // Gylden time morgen
    if (sun.goldenHourMorning.start && sun.goldenHourMorning.end) {
      el.morningGoldenTime.textContent = `${AstroCalc.formatTime(sun.goldenHourMorning.start)} – ${AstroCalc.formatTime(sun.goldenHourMorning.end)}`;
    } else {
      el.morningGoldenTime.textContent = '--:--';
    }

    // Solopgang & Azimut kompas
    if (sun.sunrise) {
      const az = day.sunriseAzimuth !== null ? Math.round(day.sunriseAzimuth) : null;
      const compDir = az !== null ? AstroCalc.getCompassDirection(az) : 'Øst';
      el.morningSunriseSub.textContent = `Solopgang kl. ${AstroCalc.formatTime(sun.sunrise)}`;
      el.morningGoldenCompass.textContent = az !== null ? `${az}° ${compDir}` : compDir;
      el.morningBlueCompass.textContent = compDir;
    } else {
      el.morningSunriseSub.textContent = 'Ingen solopgang (polarnat)';
      el.morningGoldenCompass.textContent = 'Øst';
    }

    // Skylag
    if (g.clouds) {
      el.morningTotalClouds.textContent = `${g.clouds.total}%`;
      el.morningValLow.textContent = `${g.clouds.low}%`;
      el.morningValMid.textContent = `${g.clouds.mid}%`;
      el.morningValHigh.textContent = `${g.clouds.high}%`;
      el.morningBarLow.style.width = `${Math.min(100, g.clouds.low)}%`;
      el.morningBarMid.style.width = `${Math.min(100, g.clouds.mid)}%`;
      el.morningBarHigh.style.width = `${Math.min(100, g.clouds.high)}%`;
    }
  }

  // Aften-kort opdatering
  function renderEveningCard(day) {
    const g = day.goldenEvening;
    const sun = day.sun;

    el.eveningBadge.textContent = `${g.icon} ${g.score}% kvalitet`;
    el.eveningAssessment.textContent = g.text;

    // Gylden time aften
    if (sun.goldenHourEvening.start && sun.goldenHourEvening.end) {
      el.eveningGoldenTime.textContent = `${AstroCalc.formatTime(sun.goldenHourEvening.start)} – ${AstroCalc.formatTime(sun.goldenHourEvening.end)}`;
    } else {
      el.eveningGoldenTime.textContent = '--:--';
    }

    // Blå time aften
    if (sun.blueHourEvening.start && sun.blueHourEvening.end) {
      el.eveningBlueTime.textContent = `${AstroCalc.formatTime(sun.blueHourEvening.start)} – ${AstroCalc.formatTime(sun.blueHourEvening.end)}`;
    } else {
      el.eveningBlueTime.textContent = '--:--';
    }

    // Solnedgang & Azimut kompas
    if (sun.sunset) {
      const az = day.sunsetAzimuth !== null ? Math.round(day.sunsetAzimuth) : null;
      const compDir = az !== null ? AstroCalc.getCompassDirection(az) : 'Vest';
      el.eveningSunsetSub.textContent = `Solnedgang kl. ${AstroCalc.formatTime(sun.sunset)}`;
      el.eveningGoldenCompass.textContent = az !== null ? `${az}° ${compDir}` : compDir;
      el.eveningBlueCompass.textContent = compDir;
    } else {
      el.eveningSunsetSub.textContent = 'Ingen solnedgang (midnatssol)';
      el.eveningGoldenCompass.textContent = 'Vest';
    }

    // Skylag
    if (g.clouds) {
      el.eveningTotalClouds.textContent = `${g.clouds.total}%`;
      el.eveningValLow.textContent = `${g.clouds.low}%`;
      el.eveningValMid.textContent = `${g.clouds.mid}%`;
      el.eveningValHigh.textContent = `${g.clouds.high}%`;
      el.eveningBarLow.style.width = `${Math.min(100, g.clouds.low)}%`;
      el.eveningBarMid.style.width = `${Math.min(100, g.clouds.mid)}%`;
      el.eveningBarHigh.style.width = `${Math.min(100, g.clouds.high)}%`;
    }
  }

  // Astro-kort opdatering
  function renderAstroCard(day) {
    const a = day.astro;
    el.astroBadge.textContent = `${a.icon} ${a.score}% • ${a.status}`;
    el.astroBadge.className = `score-badge ${a.score >= 70 ? 'high' : a.score >= 45 ? 'moderate' : 'low'}`;
    el.astroAssessment.textContent = a.text;

    if (a.astroStart && a.astroEnd) {
      el.astroDarkWindow.textContent = `${a.astroStart} – ${a.astroEnd}`;
    } else {
      el.astroDarkWindow.textContent = 'Ingen astronomisk nat';
    }

    el.astroClouds.textContent = `${a.avgClouds}%`;
    el.astroMoonImpact.textContent = a.moonImpact;
  }

  // Måne-kort opdatering
  function renderMoonCard(day) {
    const moon = day.moon;
    const mt = day.moonTimes;

    el.moonIconHeader.textContent = moon.icon;
    el.moonPhaseTitle.textContent = moon.name;
    el.moonIllumSubtitle.textContent = `${moon.fraction}% oplyst flade`;
    el.moonBadge.textContent = `${moon.icon} ${moon.name}`;

    // Måneopgang
    if (mt.rise) {
      el.moonriseTime.textContent = AstroCalc.formatTime(mt.rise);
      const az = day.moonriseAzimuth !== null ? Math.round(day.moonriseAzimuth) : null;
      el.moonriseCompass.textContent = az !== null ? `${az}° ${AstroCalc.getCompassDirection(az)}` : 'Øst';
    } else {
      el.moonriseTime.textContent = 'Går ikke op';
      el.moonriseCompass.textContent = '--';
    }

    // Månenedgang
    if (mt.set) {
      el.moonsetTime.textContent = AstroCalc.formatTime(mt.set);
      const az = day.moonsetAzimuth !== null ? Math.round(day.moonsetAzimuth) : null;
      el.moonsetCompass.textContent = az !== null ? `${az}° ${AstroCalc.getCompassDirection(az)}` : 'Vest';
    } else {
      el.moonsetTime.textContent = 'Går ikke ned';
      el.moonsetCompass.textContent = '--';
    }
  }

  // Time-for-time tabel render
  function renderHourlyTable(hourly) {
    el.hourlyTableBody.innerHTML = '';
    if (!hourly || hourly.length === 0) return;

    hourly.forEach((h) => {
      const tr = document.createElement('tr');
      const wDesc = WeatherEngine.getWeatherCodeDescription(h.weatherCode);

      // Fremhæv timer med tåge eller god sigt
      let rowStyle = '';
      if (h.spread <= 1.0 && h.humidity >= 92) {
        rowStyle = 'background: rgba(148, 163, 184, 0.12);'; // Tåge-farve
      }

      tr.setAttribute('style', rowStyle);
      tr.innerHTML = `
        <td><strong>${padZero(h.hour)}:00</strong></td>
        <td><span title="${wDesc.text}">${wDesc.icon}</span></td>
        <td>${h.temp.toFixed(1)}°</td>
        <td>${h.dewPoint.toFixed(1)}°</td>
        <td>${h.humidity}%</td>
        <td style="color: ${h.cloudLow > 60 ? '#ef4444' : '#94a3b8'}">${h.cloudLow}%</td>
        <td style="color: #38bdf8">${h.cloudMid}%</td>
        <td style="color: #f59e0b">${h.cloudHigh}%</td>
        <td>${Math.round(h.windSpeed)} km/t</td>
        <td>${(h.visibility / 1000).toFixed(1)} km</td>
      `;
      el.hourlyTableBody.appendChild(tr);
    });
  }

  // Lokationsskift
  function selectLocation(name, lat, lng, isGps = false) {
    state.currentLoc = { name, lat, lng, isGps };
    localStorage.setItem('photo_current_loc', JSON.stringify(state.currentLoc));
    updateLocationDisplay();
    updateFavoriteStar();
    renderFavoritesBar();
    closeSearch();
    updateWeather(true);
  }

  // GPS lokalisering
  function handleGpsClick() {
    if (!navigator.geolocation) {
      alert('GPS understøttes ikke af din browser.');
      return;
    }

    showLoading(true, 'Finder din aktuelle position...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        selectLocation('Min position (GPS)', lat, lng, true);
      },
      (err) => {
        showLoading(false);
        console.warn('GPS fejl:', err);
        alert('Kunne ikke hente din GPS-position. Tjek at lokationsadgang er tilladt.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  // Favorit stjerne klik
  function handleFavoriteToggle() {
    const existingIndex = state.favorites.findIndex(
      (f) => Math.abs(f.lat - state.currentLoc.lat) < 0.02 && Math.abs(f.lng - state.currentLoc.lng) < 0.02
    );

    if (existingIndex !== -1) {
      // Fjern fra favoritter
      state.favorites.splice(existingIndex, 1);
    } else {
      // Tilføj
      state.favorites.push({
        name: state.currentLoc.name,
        lat: state.currentLoc.lat,
        lng: state.currentLoc.lng
      });
    }

    localStorage.setItem('photo_favorites', JSON.stringify(state.favorites));
    updateFavoriteStar();
    renderFavoritesBar();
  }

  // Søgning i Open-Meteo geocoding
  function handleSearchInput(e) {
    const val = e.target.value;
    clearTimeout(state.searchDebounceTimer);

    if (!val || val.trim().length < 2) {
      el.searchResults.innerHTML = '';
      return;
    }

    state.searchDebounceTimer = setTimeout(async () => {
      const results = await WeatherEngine.searchLocation(val);
      renderSearchResults(results);
    }, 280);
  }

  function renderSearchResults(results) {
    el.searchResults.innerHTML = '';
    if (!results || results.length === 0) {
      el.searchResults.innerHTML = '<div class="search-item" style="color: var(--text-dim)">Ingen steder fundet</div>';
      return;
    }

    results.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'search-item';
      const sub = [item.admin1, item.country].filter(Boolean).join(', ');
      row.innerHTML = `
        <span><strong>${escapeHtml(item.name)}</strong></span>
        <span class="search-item-geo">${escapeHtml(sub)}</span>
      `;
      row.addEventListener('click', () => {
        const displayName = item.name + (item.admin1 ? ' (' + item.admin1 + ')' : '');
        selectLocation(displayName, item.lat, item.lng, false);
      });
      el.searchResults.appendChild(row);
    });
  }

  function openSearch() {
    el.searchDropdown.classList.add('active');
    el.searchInput.focus();
  }

  function closeSearch() {
    el.searchDropdown.classList.remove('active');
    el.searchInput.value = '';
    el.searchResults.innerHTML = '';
  }

  // Rød nattilstand toggle
  function handleNightModeToggle() {
    state.isNightRed = !state.isNightRed;
    document.body.classList.toggle('theme-night-red', state.isNightRed);
    el.btnNightMode.classList.toggle('active-red', state.isNightRed);
    localStorage.setItem('photo_night_red', state.isNightRed);
  }

  // Event Listeners opsætning
  function setupEventListeners() {
    // Nattilstand
    el.btnNightMode.addEventListener('click', handleNightModeToggle);

    // Refresh
    el.btnRefresh.addEventListener('click', () => updateWeather(true));

    // GPS
    el.btnGps.addEventListener('click', handleGpsClick);

    // Favorit
    el.btnFavoriteToggle.addEventListener('click', handleFavoriteToggle);

    // Søgebjælke
    el.btnSearchOpen.addEventListener('click', () => {
      if (el.searchDropdown.classList.contains('active')) closeSearch();
      else openSearch();
    });
    el.locationCurrentWrap.addEventListener('click', openSearch);
    el.searchInput.addEventListener('input', handleSearchInput);

    // Luk søgning ved klik udenfor
    document.addEventListener('click', (e) => {
      if (!el.searchDropdown.contains(e.target) &&
          !el.btnSearchOpen.contains(e.target) &&
          !el.locationCurrentWrap.contains(e.target)) {
        closeSearch();
      }
    });

    // Accordion fold-ud
    el.btnToggleHourly.addEventListener('click', () => {
      const isOpen = el.hourlyContent.classList.toggle('open');
      el.btnToggleHourly.classList.toggle('open', isOpen);
    });
  }

  // Hjælpefunktioner
  function showLoading(show, text = '') {
    if (show) {
      el.loadingText.textContent = text || 'Indlæser...';
      el.loadingOverlay.classList.remove('hidden');
    } else {
      el.loadingOverlay.classList.add('hidden');
    }
  }

  function padZero(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  // Start appen når DOM er klar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
