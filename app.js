/**
 * app.js - UI logik, automatisk GPS-lokation, stedsøgning, dagsvælger og nattilstand for FotoVejr PWA
 */

(function () {
  'use strict';

  // App tilstand
  let state = {
    currentLoc: {
      name: 'Søger GPS...',
      sub: '',
      lat: 55.6761,
      lng: 12.5683,
      isGps: false,
      accuracy: null
    },
    selectedDayIndex: 0,
    forecastData: null,
    parsedDays: [],
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
    locationPinIcon: document.getElementById('locationPinIcon'),
    locName: document.getElementById('locName'),
    locCoords: document.getElementById('locCoords'),
    locationCurrentWrap: document.getElementById('locationCurrentWrap'),
    searchDropdown: document.getElementById('searchDropdown'),
    searchInput: document.getElementById('searchInput'),
    searchResults: document.getElementById('searchResults'),
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
    setupEventListeners();

    // Hent automatisk aktuel GPS-placering
    await acquireGpsLocation(false);
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
    const savedNight = localStorage.getItem('photo_night_red') === 'true';
    if (savedNight) {
      state.isNightRed = true;
      document.body.classList.add('theme-night-red');
      el.btnNightMode.classList.add('active-red');
    }

    try {
      const savedLoc = localStorage.getItem('photo_last_gps_loc');
      if (savedLoc) {
        state.currentLoc = JSON.parse(savedLoc);
        updateLocationDisplay();
      }
    } catch (e) {}
  }

  // Opdater visning af nuværende lokation
  function updateLocationDisplay() {
    el.locName.textContent = state.currentLoc.name || 'Aktuel position';
    const latStr = Math.abs(state.currentLoc.lat).toFixed(3) + '°' + (state.currentLoc.lat >= 0 ? 'N' : 'S');
    const lngStr = Math.abs(state.currentLoc.lng).toFixed(3) + '°' + (state.currentLoc.lng >= 0 ? 'Ø' : 'V');

    if (state.currentLoc.isGps) {
      if (el.locationPinIcon) el.locationPinIcon.classList.add('gps-locked');
      const accText = state.currentLoc.accuracy ? ` (±${state.currentLoc.accuracy}m)` : '';
      const subText = state.currentLoc.sub ? `${state.currentLoc.sub} • ` : '';
      el.locCoords.innerHTML = `<span class="gps-badge-active">● GPS aktiv</span> • ${escapeHtml(subText)}${latStr}, ${lngStr}${accText}`;
    } else {
      if (el.locationPinIcon) el.locationPinIcon.classList.remove('gps-locked');
      const subText = state.currentLoc.sub ? `${state.currentLoc.sub} • ` : '';
      el.locCoords.textContent = `${subText}${latStr}, ${lngStr}`;
    }
  }

  // Henter GPS lokation og foretager Reverse Geocoding
  async function acquireGpsLocation(isManualClick = false) {
    if (!navigator.geolocation) {
      if (isManualClick) alert('GPS understøttes ikke af denne browser.');
      await fallbackToStoredOrCph('GPS understøttes ikke af din browser.');
      return;
    }

    if (isManualClick) {
      showLoading(true, 'Opdaterer GPS position...');
    }

    el.locName.textContent = 'Finder aktuel GPS-position...';
    el.locCoords.textContent = 'Søger GPS satellitter...';

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null;

        el.locName.textContent = 'Navngiver lokation...';
        let geoInfo = { name: 'Aktuel position', sub: '' };
        try {
          geoInfo = await WeatherEngine.reverseGeocode(lat, lng);
        } catch (e) {
          console.warn('Reverse geocode fejlede:', e);
        }

        const placeName = geoInfo.name || 'Aktuel position';
        const placeSub = geoInfo.sub || '';

        state.currentLoc = {
          name: placeName,
          sub: placeSub,
          lat: lat,
          lng: lng,
          accuracy: accuracy,
          isGps: true,
          updatedTime: new Date()
        };

        try {
          localStorage.setItem('photo_last_gps_loc', JSON.stringify(state.currentLoc));
        } catch (e) {}

        updateLocationDisplay();
        await updateWeather(true);
      },
      async (err) => {
        console.warn('GPS fejl eller adgang nægtet:', err);
        const msg = isManualClick ? 'GPS kunne ikke tilgås. Kontroller at lokationstilladelse er slået til.' : null;
        await fallbackToStoredOrCph(msg);
      },
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 60000 }
    );
  }

  async function fallbackToStoredOrCph(alertMsg) {
    showLoading(false);
    if (alertMsg) alert(alertMsg);

    try {
      const saved = localStorage.getItem('photo_last_gps_loc');
      if (saved) {
        state.currentLoc = JSON.parse(saved);
        updateLocationDisplay();
        await updateWeather(false);
        return;
      }
    } catch (e) {}

    // Standard København hvis ingen GPS endnu
    state.currentLoc = {
      name: 'København',
      sub: 'Standard (tryk "Opdater GPS")',
      lat: 55.6761,
      lng: 12.5683,
      isGps: false,
      accuracy: null
    };
    updateLocationDisplay();
    await updateWeather(false);
  }

  // Henter vejrdata og opdaterer interfacet
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

    renderFogCard(day);
    renderMorningCard(day);
    renderEveningCard(day);
    renderAstroCard(day);
    renderMoonCard(day);
    renderHourlyTable(day.hourly);
  }

  // Tåge-kort opdatering
  function renderFogCard(day) {
    const fog = day.fog;
    el.fogBadge.textContent = `${fog.score}% • ${fog.level}`;
    el.fogBadge.className = `score-badge ${fog.classType}`;
    el.fogAssessment.textContent = fog.text;

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

    if (sun.blueHourMorning.start && sun.blueHourMorning.end) {
      el.morningBlueTime.textContent = `${AstroCalc.formatTime(sun.blueHourMorning.start)} – ${AstroCalc.formatTime(sun.blueHourMorning.end)}`;
    } else {
      el.morningBlueTime.textContent = '--:--';
    }

    if (sun.goldenHourMorning.start && sun.goldenHourMorning.end) {
      el.morningGoldenTime.textContent = `${AstroCalc.formatTime(sun.goldenHourMorning.start)} – ${AstroCalc.formatTime(sun.goldenHourMorning.end)}`;
    } else {
      el.morningGoldenTime.textContent = '--:--';
    }

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

    if (sun.goldenHourEvening.start && sun.goldenHourEvening.end) {
      el.eveningGoldenTime.textContent = `${AstroCalc.formatTime(sun.goldenHourEvening.start)} – ${AstroCalc.formatTime(sun.goldenHourEvening.end)}`;
    } else {
      el.eveningGoldenTime.textContent = '--:--';
    }

    if (sun.blueHourEvening.start && sun.blueHourEvening.end) {
      el.eveningBlueTime.textContent = `${AstroCalc.formatTime(sun.blueHourEvening.start)} – ${AstroCalc.formatTime(sun.blueHourEvening.end)}`;
    } else {
      el.eveningBlueTime.textContent = '--:--';
    }

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

    if (mt.rise) {
      el.moonriseTime.textContent = AstroCalc.formatTime(mt.rise);
      const az = day.moonriseAzimuth !== null ? Math.round(day.moonriseAzimuth) : null;
      el.moonriseCompass.textContent = az !== null ? `${az}° ${AstroCalc.getCompassDirection(az)}` : 'Øst';
    } else {
      el.moonriseTime.textContent = 'Går ikke op';
      el.moonriseCompass.textContent = '--';
    }

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

      let rowStyle = '';
      if (h.spread <= 1.0 && h.humidity >= 92) {
        rowStyle = 'background: rgba(148, 163, 184, 0.12);';
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

  // Manuelt lokationsvalg fra søgning
  function selectCustomLocation(name, sub, lat, lng) {
    state.currentLoc = {
      name: name,
      sub: sub || '',
      lat: lat,
      lng: lng,
      isGps: false,
      accuracy: null
    };
    updateLocationDisplay();
    closeSearch();
    updateWeather(true);
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
        selectCustomLocation(item.name, sub, item.lat, item.lng);
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
    el.btnNightMode.addEventListener('click', handleNightModeToggle);
    el.btnRefresh.addEventListener('click', () => updateWeather(true));

    // Manuelt tryk på "Opdater GPS"
    el.btnGps.addEventListener('click', () => acquireGpsLocation(true));

    // Søgebjælke
    el.btnSearchOpen.addEventListener('click', () => {
      if (el.searchDropdown.classList.contains('active')) closeSearch();
      else openSearch();
    });
    el.locationCurrentWrap.addEventListener('click', openSearch);
    el.searchInput.addEventListener('input', handleSearchInput);

    document.addEventListener('click', (e) => {
      if (!el.searchDropdown.contains(e.target) &&
          !el.btnSearchOpen.contains(e.target) &&
          !el.locationCurrentWrap.contains(e.target)) {
        closeSearch();
      }
    });

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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
