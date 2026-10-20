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
    selectedDayBanner: document.getElementById('selectedDayBanner'),
    dayBannerTitle: document.getElementById('dayBannerTitle'),
    dayBannerSubtitle: document.getElementById('dayBannerSubtitle'),

    // Tåge
    cardFog: document.getElementById('cardFog'),
    fogBadge: document.getElementById('fogBadge'),
    fogAssessment: document.getElementById('fogAssessment'),
    fogTimingBanner: document.getElementById('fogTimingBanner'),
    fogTimingLabel: document.getElementById('fogTimingLabel'),
    fogTimingPill: document.getElementById('fogTimingPill'),
    fogTimeWindow: document.getElementById('fogTimeWindow'),
    fogTimeSub: document.getElementById('fogTimeSub'),
    fogJumpAction: document.getElementById('fogJumpAction'),
    fogSpread: document.getElementById('fogSpread'),
    fogHumidity: document.getElementById('fogHumidity'),
    fogWind: document.getElementById('fogWind'),
    fogVisibility: document.getElementById('fogVisibility'),

    // Morgen
    cardMorning: document.getElementById('cardMorning'),
    morningBadge: document.getElementById('morningBadge'),
    morningAssessment: document.getElementById('morningAssessment'),
    morningTimingBanner: document.getElementById('morningTimingBanner'),
    morningTimingLabel: document.getElementById('morningTimingLabel'),
    morningTimingPill: document.getElementById('morningTimingPill'),
    morningBlueTime: document.getElementById('morningBlueTime'),
    morningBlueCompass: document.getElementById('morningBlueCompass'),
    morningBlueSub: document.getElementById('morningBlueSub'),
    morningGoldenTime: document.getElementById('morningGoldenTime'),
    morningGoldenCompass: document.getElementById('morningGoldenCompass'),
    morningSunriseSub: document.getElementById('morningSunriseSub'),
    morningJumpAction: document.getElementById('morningJumpAction'),
    morningTotalClouds: document.getElementById('morningTotalClouds'),
    morningValLow: document.getElementById('morningValLow'),
    morningValMid: document.getElementById('morningValMid'),
    morningValHigh: document.getElementById('morningValHigh'),
    morningBarLow: document.getElementById('morningBarLow'),
    morningBarMid: document.getElementById('morningBarMid'),
    morningBarHigh: document.getElementById('morningBarHigh'),

    // Aften
    cardEvening: document.getElementById('cardEvening'),
    eveningBadge: document.getElementById('eveningBadge'),
    eveningAssessment: document.getElementById('eveningAssessment'),
    eveningTimingBanner: document.getElementById('eveningTimingBanner'),
    eveningTimingLabel: document.getElementById('eveningTimingLabel'),
    eveningTimingPill: document.getElementById('eveningTimingPill'),
    eveningGoldenTime: document.getElementById('eveningGoldenTime'),
    eveningGoldenCompass: document.getElementById('eveningGoldenCompass'),
    eveningSunsetSub: document.getElementById('eveningSunsetSub'),
    eveningBlueTime: document.getElementById('eveningBlueTime'),
    eveningBlueCompass: document.getElementById('eveningBlueCompass'),
    eveningBlueSub: document.getElementById('eveningBlueSub'),
    eveningTotalClouds: document.getElementById('eveningTotalClouds'),
    eveningValLow: document.getElementById('eveningValLow'),
    eveningValMid: document.getElementById('eveningValMid'),
    eveningValHigh: document.getElementById('eveningValHigh'),
    eveningBarLow: document.getElementById('eveningBarLow'),
    eveningBarMid: document.getElementById('eveningBarMid'),
    eveningBarHigh: document.getElementById('eveningBarHigh'),

    // Astro
    cardAstro: document.getElementById('cardAstro'),
    astroBadge: document.getElementById('astroBadge'),
    astroAssessment: document.getElementById('astroAssessment'),
    astroTimingBanner: document.getElementById('astroTimingBanner'),
    astroTimingLabel: document.getElementById('astroTimingLabel'),
    astroTimingPill: document.getElementById('astroTimingPill'),
    astroDarkWindow: document.getElementById('astroDarkWindow'),
    astroDarkSub: document.getElementById('astroDarkSub'),
    astroClouds: document.getElementById('astroClouds'),
    astroMoonImpact: document.getElementById('astroMoonImpact'),

    // Måne
    cardMoon: document.getElementById('cardMoon'),
    moonIconHeader: document.getElementById('moonIconHeader'),
    moonPhaseTitle: document.getElementById('moonPhaseTitle'),
    moonIllumSubtitle: document.getElementById('moonIllumSubtitle'),
    moonBadge: document.getElementById('moonBadge'),
    moonTimingBanner: document.getElementById('moonTimingBanner'),
    moonTimingLabel: document.getElementById('moonTimingLabel'),
    moonTimingPill: document.getElementById('moonTimingPill'),
    moonriseTime: document.getElementById('moonriseTime'),
    moonriseCompass: document.getElementById('moonriseCompass'),
    moonriseSub: document.getElementById('moonriseSub'),
    moonsetTime: document.getElementById('moonsetTime'),
    moonsetCompass: document.getElementById('moonsetCompass'),
    moonsetSub: document.getElementById('moonsetSub'),

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

    // Hvert 60. sekund opdateres de relative tidsangivelser automatisk
    setInterval(() => {
      if (state.parsedDays && state.parsedDays.length > 0) {
        renderSelectedDay();
      }
    }, 60000);

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

  // Hjælpefunktion til dansk tidsangivelse og varighed
  function formatDuration(ms) {
    if (isNaN(ms) || ms < 0) ms = 0;
    const totalMinutes = Math.round(ms / 60000);
    if (totalMinutes < 1) return 'under 1 min';
    if (totalMinutes < 60) return `${totalMinutes} min`;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours < 24) {
      if (mins === 0) return hours === 1 ? '1 time' : `${hours} timer`;
      return hours === 1 ? `1 t. ${mins} min` : `${hours} t. ${mins} min`;
    }
    const days = Math.floor(hours / 24);
    const remH = Math.round(hours % 24);
    if (days === 1) {
      return remH > 0 ? `1 d. ${remH} t.` : '1 dag';
    }
    return `${days} dage`;
  }

  // Beregner tidsstatus for en fotobegivenhed (aktiv, passeret, kommende, fremtidig)
  function getEventTiming(startTime, endTime, dayIndex, dayDate, eventType) {
    const now = new Date();
    const dayNamesFull = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];

    // I dag (dag 0)
    if (dayIndex === 0) {
      // Aktiv lige nu
      if (startTime && endTime && now >= startTime && now <= endTime) {
        const remainingMs = endTime.getTime() - now.getTime();
        return {
          status: 'active',
          bannerClass: 'banner-active',
          icon: '🟢',
          pill: 'Aktiv nu',
          label: 'Aktiv lige nu • Slutter om ' + formatDuration(remainingMs),
          sub: 'Aktiv lige nu (slutter kl. ' + AstroCalc.formatTime(endTime) + ')',
          isPassed: false
        };
      }

      // Passeret tidligere i dag
      if (endTime && now > endTime) {
        const elapsedMs = now.getTime() - endTime.getTime();
        let label = 'I morges • For ' + formatDuration(elapsedMs) + ' siden';
        let sub = 'Afsluttet i morges (for ' + formatDuration(elapsedMs) + ' siden)';

        if (eventType === 'evening') {
          label = 'I aften • For ' + formatDuration(elapsedMs) + ' siden';
          sub = 'Afsluttet i aften kl. ' + AstroCalc.formatTime(endTime);
        } else if (eventType === 'astro') {
          label = 'Natten er ovre';
          sub = 'Astronomisk nat afsluttet kl. ' + AstroCalc.formatTime(endTime);
        }

        return {
          status: 'passed',
          bannerClass: 'banner-passed',
          icon: '⏳',
          pill: 'Passeret',
          label: label,
          sub: sub,
          isPassed: true
        };
      }

      // Kommende senere i dag
      if (startTime && now < startTime) {
        const untilMs = startTime.getTime() - now.getTime();
        let label = 'I dag • Om ' + formatDuration(untilMs);
        let sub = 'Starter kl. ' + AstroCalc.formatTime(startTime) + ' (om ' + formatDuration(untilMs) + ')';

        if (eventType === 'evening') {
          label = 'I aften • Om ' + formatDuration(untilMs);
          sub = 'Starter i aften kl. ' + AstroCalc.formatTime(startTime) + ' (om ' + formatDuration(untilMs) + ')';
        } else if (eventType === 'astro') {
          label = 'I aften/nat • Om ' + formatDuration(untilMs);
          sub = 'Astronomisk nat starter kl. ' + AstroCalc.formatTime(startTime) + ' (om ' + formatDuration(untilMs) + ')';
        } else if (eventType === 'fog' || eventType === 'morning') {
          label = 'I dag ved daggry • Om ' + formatDuration(untilMs);
        }

        return {
          status: 'upcoming',
          bannerClass: 'banner-upcoming',
          icon: '⏱️',
          pill: 'Kommende',
          label: label,
          sub: sub,
          isPassed: false
        };
      }
    }

    // I morgen (dag 1)
    if (dayIndex === 1) {
      const untilMs = startTime ? Math.max(0, startTime.getTime() - now.getTime()) : 0;
      let label = 'I morgen • Om ' + formatDuration(untilMs);
      let sub = 'I morgen kl. ' + (startTime ? AstroCalc.formatTime(startTime) : '--:--');

      if (eventType === 'fog' || eventType === 'morning') {
        label = 'I morgen tidlig • Om ' + formatDuration(untilMs);
        sub = 'I morgen kl. ' + AstroCalc.formatTime(startTime) + ' (om ' + formatDuration(untilMs) + ')';
      } else if (eventType === 'evening') {
        label = 'I morgen aften • Om ' + formatDuration(untilMs);
        sub = 'I morgen kl. ' + AstroCalc.formatTime(startTime) + ' (om ' + formatDuration(untilMs) + ')';
      } else if (eventType === 'astro') {
        label = 'I morgen nat • Om ' + formatDuration(untilMs);
        sub = 'I morgen nat fra kl. ' + AstroCalc.formatTime(startTime);
      }

      return {
        status: 'future',
        bannerClass: 'banner-future',
        icon: '📅',
        pill: 'I morgen',
        label: label,
        sub: sub,
        isPassed: false
      };
    }

    // Dag 2-6 (fremtid)
    const dayName = dayNamesFull[dayDate.getDay()];
    let label = `${dayName} • Om ${dayIndex} dage`;
    let sub = `${dayName}`;

    if (eventType === 'fog' || eventType === 'morning') {
      label = `${dayName} morgen • Om ${dayIndex} dage`;
      sub = `${dayName} kl. ` + (startTime ? AstroCalc.formatTime(startTime) : '06:00');
    } else if (eventType === 'evening') {
      label = `${dayName} aften • Om ${dayIndex} dage`;
      sub = `${dayName} kl. ` + (startTime ? AstroCalc.formatTime(startTime) : '18:00');
    } else if (eventType === 'astro') {
      label = `${dayName} nat • Om ${dayIndex} dage`;
      sub = `${dayName} nat`;
    }

    return {
      status: 'future-distant',
      bannerClass: 'banner-future',
      icon: '📅',
      pill: dayName,
      label: label,
      sub: sub,
      isPassed: false
    };
  }

  function applyTimingBanner(bannerEl, labelEl, pillEl, timing) {
    if (!bannerEl) return;
    bannerEl.className = 'card-timing-banner ' + timing.bannerClass;
    if (labelEl) labelEl.textContent = timing.label;
    if (pillEl) pillEl.textContent = timing.pill;
  }

  // Skift valgt dag
  function selectDay(index) {
    if (index < 0 || index >= state.parsedDays.length) return;
    state.selectedDayIndex = index;
    const chips = el.daysScroll.querySelectorAll('.day-chip');
    chips.forEach((c, i) => {
      c.classList.toggle('active', i === index);
    });
    if (chips[index]) {
      chips[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    renderSelectedDay();
  }

  // Opdaterer det overordnede "Viser dag"-banner under dagsvælgeren
  function updateSelectedDayBanner(day) {
    if (!el.selectedDayBanner || !day) return;
    const d = day.date;
    const dayNamesFull = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
    const now = new Date();

    if (state.selectedDayIndex === 0) {
      el.dayBannerTitle.textContent = `I dag (${dayNamesFull[d.getDay()].toLowerCase()} d. ${d.getDate()}. ${monthNames[d.getMonth()]})`;

      const sun = day.sun;
      const fogEnd = sun.sunrise ? new Date(sun.sunrise.getTime() + 65 * 60 * 1000) : null;
      const mEnd = sun.goldenHourMorning ? sun.goldenHourMorning.end : null;
      const eStart = sun.goldenHourEvening ? sun.goldenHourEvening.start : null;
      const eEnd = sun.blueHourEvening ? sun.blueHourEvening.end : null;
      const aStart = sun.astronomicalDusk;

      if (fogEnd && now <= fogEnd) {
        el.dayBannerSubtitle.textContent = `Næste: Morgentåge & solopgang kl. ${AstroCalc.formatTime(sun.sunrise)}`;
      } else if (mEnd && now <= mEnd) {
        el.dayBannerSubtitle.textContent = `Næste: Daggry & gylden time kl. ${AstroCalc.formatTime(sun.sunrise)}`;
      } else if (eStart && now < eStart) {
        el.dayBannerSubtitle.textContent = `Næste: Gylden time i aften kl. ${AstroCalc.formatTime(eStart)} (om ${formatDuration(eStart.getTime() - now.getTime())})`;
      } else if (eEnd && now <= eEnd) {
        el.dayBannerSubtitle.textContent = `Aktuel lige nu: Solnedgang & aftenlys!`;
      } else if (aStart && now < aStart) {
        el.dayBannerSubtitle.textContent = `Næste: Stjerneklart mørke i aften kl. ${AstroCalc.formatTime(aStart)} (om ${formatDuration(aStart.getTime() - now.getTime())})`;
      } else if (aStart && now >= aStart) {
        el.dayBannerSubtitle.textContent = `Aktuel i nat: Astronomisk nat (stjernehimmel)`;
      } else {
        el.dayBannerSubtitle.textContent = `Dagens soltimer er passeret • Tryk 'I morgen' for næste dagslys`;
      }
    } else if (state.selectedDayIndex === 1) {
      el.dayBannerTitle.textContent = `I morgen (${dayNamesFull[d.getDay()].toLowerCase()} d. ${d.getDate()}. ${monthNames[d.getMonth()]})`;
      const sun = day.sun;
      if (sun.sunrise) {
        const mStart = sun.blueHourMorning ? sun.blueHourMorning.start : sun.sunrise;
        const until = Math.max(0, mStart.getTime() - now.getTime());
        el.dayBannerSubtitle.textContent = `Første fotomulighed: Daggry & tåge kl. ${AstroCalc.formatTime(mStart)} (om ${formatDuration(until)})`;
      } else {
        el.dayBannerSubtitle.textContent = `Fotovejrudsigt for i morgen`;
      }
    } else {
      el.dayBannerTitle.textContent = `${dayNamesFull[d.getDay()]} d. ${d.getDate()}. ${monthNames[d.getMonth()]}`;
      el.dayBannerSubtitle.textContent = `7-dages fotovejrudsigt for ${state.currentLoc.name}`;
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
        selectDay(index);
      });

      el.daysScroll.appendChild(chip);
    });
  }

  // Render det aktuelt valgte døgn på fotokortene
  function renderSelectedDay() {
    const day = state.parsedDays[state.selectedDayIndex];
    if (!day) return;

    updateSelectedDayBanner(day);
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

    let fogStart = null;
    let fogEnd = null;

    if (day.sun.sunrise) {
      const sunriseH = day.sun.sunrise.getHours();
      const sunriseM = day.sun.sunrise.getMinutes();
      const startH = Math.max(0, sunriseH - 1);
      const endH = sunriseH + 1;
      el.fogTimeWindow.textContent = `${padZero(startH)}:${padZero(sunriseM)} – ${padZero(endH)}:${padZero(sunriseM)}`;

      fogStart = new Date(day.sun.sunrise.getTime() - 60 * 60 * 1000);
      fogEnd = new Date(day.sun.sunrise.getTime() + 65 * 60 * 1000);
    } else {
      el.fogTimeWindow.textContent = '05:30 – 08:30';
      fogStart = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate(), 5, 30);
      fogEnd = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate(), 8, 30);
    }

    const timing = getEventTiming(fogStart, fogEnd, state.selectedDayIndex, day.date, 'fog');
    applyTimingBanner(el.fogTimingBanner, el.fogTimingLabel, el.fogTimingPill, timing);

    if (el.fogTimeSub) el.fogTimeSub.textContent = timing.sub;
    if (el.cardFog) el.cardFog.classList.toggle('card-event-passed', timing.isPassed);

    if (el.fogJumpAction) {
      if (timing.isPassed && state.parsedDays.length > 1) {
        el.fogJumpAction.style.display = 'flex';
        el.fogJumpAction.innerHTML = `
          <span class="passed-note-text">ℹ️ Morgentågen fandt sted i morges. Tjek i morgen?</span>
          <button type="button" class="btn-jump-tomorrow">Se i morgen tidlig ➔</button>
        `;
      } else {
        el.fogJumpAction.style.display = 'none';
        el.fogJumpAction.innerHTML = '';
      }
    }

    el.fogSpread.textContent = `${fog.avgSpread}°C`;
    el.fogHumidity.textContent = `${fog.avgHumidity}%`;
    el.fogWind.textContent = `${fog.avgWind} m/s`;
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

    const mStart = (sun.blueHourMorning && sun.blueHourMorning.start) || (sun.sunrise ? new Date(sun.sunrise.getTime() - 50 * 60 * 1000) : null);
    const mEnd = (sun.goldenHourMorning && sun.goldenHourMorning.end) || (sun.sunrise ? new Date(sun.sunrise.getTime() + 45 * 60 * 1000) : null);
    const timing = getEventTiming(mStart, mEnd, state.selectedDayIndex, day.date, 'morning');

    applyTimingBanner(el.morningTimingBanner, el.morningTimingLabel, el.morningTimingPill, timing);
    if (el.cardMorning) el.cardMorning.classList.toggle('card-event-passed', timing.isPassed);

    const now = new Date();
    if (sun.sunrise) {
      const az = day.sunriseAzimuth !== null ? Math.round(day.sunriseAzimuth) : null;
      const compDir = az !== null ? AstroCalc.getCompassDirection(az) : 'Øst';

      if (state.selectedDayIndex === 0) {
        if (timing.isPassed) {
          el.morningSunriseSub.textContent = `Solopgang var kl. ${AstroCalc.formatTime(sun.sunrise)} (for ${formatDuration(now.getTime() - sun.sunrise.getTime())} siden)`;
        } else if (timing.status === 'active') {
          el.morningSunriseSub.textContent = `Solopgang kl. ${AstroCalc.formatTime(sun.sunrise)} (daggry i gang nu)`;
        } else {
          el.morningSunriseSub.textContent = `Solopgang kl. ${AstroCalc.formatTime(sun.sunrise)} (om ${formatDuration(sun.sunrise.getTime() - now.getTime())})`;
        }
      } else if (state.selectedDayIndex === 1) {
        el.morningSunriseSub.textContent = `Solopgang i morgen kl. ${AstroCalc.formatTime(sun.sunrise)}`;
      } else {
        el.morningSunriseSub.textContent = `Solopgang kl. ${AstroCalc.formatTime(sun.sunrise)}`;
      }

      el.morningGoldenCompass.textContent = az !== null ? `${az}° ${compDir}` : compDir;
      el.morningBlueCompass.textContent = compDir;
    } else {
      el.morningSunriseSub.textContent = 'Ingen solopgang (polarnat)';
      el.morningGoldenCompass.textContent = 'Øst';
    }

    if (el.morningBlueSub) {
      el.morningBlueSub.textContent = timing.isPassed ? 'Afsluttet i morges' : 'dybblå himmel & bylancering';
    }

    if (el.morningJumpAction) {
      if (timing.isPassed && state.parsedDays.length > 1) {
        el.morningJumpAction.style.display = 'flex';
        el.morningJumpAction.innerHTML = `
          <span class="passed-note-text">ℹ️ Morgenens gyldne time fandt sted i morges. Tjek i morgen?</span>
          <button type="button" class="btn-jump-tomorrow">Se daggry i morgen ➔</button>
        `;
      } else {
        el.morningJumpAction.style.display = 'none';
        el.morningJumpAction.innerHTML = '';
      }
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

    const eStart = (sun.goldenHourEvening && sun.goldenHourEvening.start) || (sun.sunset ? new Date(sun.sunset.getTime() - 45 * 60 * 1000) : null);
    const eEnd = (sun.blueHourEvening && sun.blueHourEvening.end) || (sun.sunset ? new Date(sun.sunset.getTime() + 45 * 60 * 1000) : null);
    const timing = getEventTiming(eStart, eEnd, state.selectedDayIndex, day.date, 'evening');

    applyTimingBanner(el.eveningTimingBanner, el.eveningTimingLabel, el.eveningTimingPill, timing);
    if (el.cardEvening) el.cardEvening.classList.toggle('card-event-passed', timing.isPassed);

    const now = new Date();
    if (sun.sunset) {
      const az = day.sunsetAzimuth !== null ? Math.round(day.sunsetAzimuth) : null;
      const compDir = az !== null ? AstroCalc.getCompassDirection(az) : 'Vest';

      if (state.selectedDayIndex === 0) {
        if (timing.isPassed) {
          el.eveningSunsetSub.textContent = `Solnedgang var kl. ${AstroCalc.formatTime(sun.sunset)} (for ${formatDuration(now.getTime() - sun.sunset.getTime())} siden)`;
        } else if (timing.status === 'active') {
          el.eveningSunsetSub.textContent = `Solnedgang kl. ${AstroCalc.formatTime(sun.sunset)} (aktiv solnedgang lige nu)`;
        } else {
          el.eveningSunsetSub.textContent = `Solnedgang i aften kl. ${AstroCalc.formatTime(sun.sunset)} (om ${formatDuration(sun.sunset.getTime() - now.getTime())})`;
        }
      } else if (state.selectedDayIndex === 1) {
        el.eveningSunsetSub.textContent = `Solnedgang i morgen kl. ${AstroCalc.formatTime(sun.sunset)}`;
      } else {
        el.eveningSunsetSub.textContent = `Solnedgang kl. ${AstroCalc.formatTime(sun.sunset)}`;
      }

      el.eveningGoldenCompass.textContent = az !== null ? `${az}° ${compDir}` : compDir;
      el.eveningBlueCompass.textContent = compDir;
    } else {
      el.eveningSunsetSub.textContent = 'Ingen solnedgang (midnatssol)';
      el.eveningGoldenCompass.textContent = 'Vest';
    }

    if (el.eveningBlueSub) {
      el.eveningBlueSub.textContent = timing.isPassed ? 'Afsluttet i aften' : 'perfekt til langtidseksponering';
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

    let aStart = null;
    let aEnd = null;

    if (day.sun.astronomicalDusk) {
      aStart = day.sun.astronomicalDusk;
      if (day.sun.astronomicalDawn) {
        aEnd = new Date(day.sun.astronomicalDawn.getTime() + 24 * 60 * 60 * 1000);
      } else {
        aEnd = new Date(aStart.getTime() + 9 * 60 * 60 * 1000);
      }
    }

    if (a.astroStart && a.astroEnd) {
      el.astroDarkWindow.textContent = `${a.astroStart} – ${a.astroEnd}`;
    } else {
      el.astroDarkWindow.textContent = 'Ingen astronomisk nat';
    }

    const timing = getEventTiming(aStart, aEnd, state.selectedDayIndex, day.date, 'astro');
    applyTimingBanner(el.astroTimingBanner, el.astroTimingLabel, el.astroTimingPill, timing);

    if (el.astroDarkSub) {
      el.astroDarkSub.textContent = timing.sub;
    }
    if (el.cardAstro) el.cardAstro.classList.toggle('card-event-passed', timing.isPassed);

    el.astroClouds.textContent = `${a.avgClouds}%`;
    el.astroMoonImpact.textContent = a.moonImpact;
  }

  // Måne-kort opdatering
  function renderMoonCard(day) {
    const moon = day.moon;
    const mt = day.moonTimes;
    const now = new Date();

    el.moonIconHeader.textContent = moon.icon;
    el.moonPhaseTitle.textContent = moon.name;
    el.moonIllumSubtitle.textContent = `${moon.fraction}% oplyst flade`;
    el.moonBadge.textContent = `${moon.icon} ${moon.name}`;

    const dayNames = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];
    let dayLabel = 'I dag';
    if (state.selectedDayIndex === 1) dayLabel = 'I morgen';
    else if (state.selectedDayIndex >= 2) dayLabel = dayNames[day.date.getDay()];

    applyTimingBanner(el.moonTimingBanner, el.moonTimingLabel, el.moonTimingPill, {
      bannerClass: 'banner-info',
      icon: '🌕',
      label: `Måneforhold for ${dayLabel.toLowerCase()}`,
      pill: dayLabel
    });

    if (mt.rise) {
      el.moonriseTime.textContent = AstroCalc.formatTime(mt.rise);
      const az = day.moonriseAzimuth !== null ? Math.round(day.moonriseAzimuth) : null;
      el.moonriseCompass.textContent = az !== null ? `${az}° ${AstroCalc.getCompassDirection(az)}` : 'Øst';

      if (el.moonriseSub) {
        if (state.selectedDayIndex === 0) {
          if (now > mt.rise) {
            el.moonriseSub.textContent = `Stod op for ${formatDuration(now.getTime() - mt.rise.getTime())} siden`;
          } else {
            el.moonriseSub.textContent = `Står op om ${formatDuration(mt.rise.getTime() - now.getTime())} (i aften)`;
          }
        } else if (state.selectedDayIndex === 1) {
          el.moonriseSub.textContent = `I morgen kl. ${AstroCalc.formatTime(mt.rise)} (om ${formatDuration(mt.rise.getTime() - now.getTime())})`;
        } else {
          el.moonriseSub.textContent = `${dayNames[day.date.getDay()]} kl. ${AstroCalc.formatTime(mt.rise)}`;
        }
      }
    } else {
      el.moonriseTime.textContent = 'Går ikke op';
      el.moonriseCompass.textContent = '--';
      if (el.moonriseSub) el.moonriseSub.textContent = 'Bliver under horisonten';
    }

    if (mt.set) {
      el.moonsetTime.textContent = AstroCalc.formatTime(mt.set);
      const az = day.moonsetAzimuth !== null ? Math.round(day.moonsetAzimuth) : null;
      el.moonsetCompass.textContent = az !== null ? `${az}° ${AstroCalc.getCompassDirection(az)}` : 'Vest';

      if (el.moonsetSub) {
        if (state.selectedDayIndex === 0) {
          if (now > mt.set) {
            el.moonsetSub.textContent = `Gik ned for ${formatDuration(now.getTime() - mt.set.getTime())} siden`;
          } else {
            el.moonsetSub.textContent = `Går ned om ${formatDuration(mt.set.getTime() - now.getTime())}`;
          }
        } else if (state.selectedDayIndex === 1) {
          el.moonsetSub.textContent = `I morgen kl. ${AstroCalc.formatTime(mt.set)} (om ${formatDuration(mt.set.getTime() - now.getTime())})`;
        } else {
          el.moonsetSub.textContent = `${dayNames[day.date.getDay()]} kl. ${AstroCalc.formatTime(mt.set)}`;
        }
      }
    } else {
      el.moonsetTime.textContent = 'Går ikke ned';
      el.moonsetCompass.textContent = '--';
      if (el.moonsetSub) el.moonsetSub.textContent = 'Bliver over horisonten';
    }
  }

  // Time-for-time tabel render
  function renderHourlyTable(hourly) {
    el.hourlyTableBody.innerHTML = '';
    if (!hourly || hourly.length === 0) return;

    const isToday = state.selectedDayIndex === 0;
    const currentHour = (new Date()).getHours();

    hourly.forEach((h) => {
      const tr = document.createElement('tr');
      const wDesc = WeatherEngine.getWeatherCodeDescription(h.weatherCode);

      const classes = [];
      if (isToday) {
        if (h.hour === currentHour) classes.push('hourly-current-hour');
        else if (h.hour < currentHour) classes.push('hourly-past-hour');
      }

      if (classes.length > 0) {
        tr.className = classes.join(' ');
      }

      let rowStyle = '';
      if (h.spread <= 1.0 && h.humidity >= 92 && !classes.includes('hourly-current-hour')) {
        rowStyle = 'background: rgba(148, 163, 184, 0.12);';
      }
      if (rowStyle) tr.setAttribute('style', rowStyle);

      const hourLabel = isToday && h.hour === currentHour
        ? `<strong>${padZero(h.hour)}:00</strong> <span class="hour-now-badge">NU</span>`
        : `<strong>${padZero(h.hour)}:00</strong>`;

      tr.innerHTML = `
        <td>${hourLabel}</td>
        <td><span title="${wDesc.text}">${wDesc.icon}</span></td>
        <td>${h.temp.toFixed(1)}°</td>
        <td>${h.dewPoint.toFixed(1)}°</td>
        <td>${h.humidity}%</td>
        <td style="color: ${h.cloudLow > 60 ? '#ef4444' : '#94a3b8'}">${h.cloudLow}%</td>
        <td style="color: #38bdf8">${h.cloudMid}%</td>
        <td style="color: #f59e0b">${h.cloudHigh}%</td>
        <td>${h.windSpeed != null ? h.windSpeed.toFixed(1) : '-'} m/s</td>
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
      const jumpBtn = e.target.closest('.btn-jump-tomorrow');
      if (jumpBtn) {
        selectDay(1);
        if (el.selectedDayBanner) {
          el.selectedDayBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        return;
      }

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
