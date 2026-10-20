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
    btnCalDayBanner: document.getElementById('btnCalDayBanner'),

    // Tåge
    cardFog: document.getElementById('cardFog'),
    fogBadge: document.getElementById('fogBadge'),
    fogAssessment: document.getElementById('fogAssessment'),
    fogTimingBanner: document.getElementById('fogTimingBanner'),
    fogTimingLabel: document.getElementById('fogTimingLabel'),
    fogTimingPill: document.getElementById('fogTimingPill'),
    fogTimeWindow: document.getElementById('fogTimeWindow'),
    fogTimeSub: document.getElementById('fogTimeSub'),
    fogSpreadSub: document.getElementById('fogSpreadSub'),
    fogJumpAction: document.getElementById('fogJumpAction'),
    fogSpread: document.getElementById('fogSpread'),
    fogHumidity: document.getElementById('fogHumidity'),
    fogWind: document.getElementById('fogWind'),
    fogVisibility: document.getElementById('fogVisibility'),
    btnCalFog: document.getElementById('btnCalFog'),

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
    btnCalMorning: document.getElementById('btnCalMorning'),

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
    btnCalEvening: document.getElementById('btnCalEvening'),

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
    astroCloudsSub: document.getElementById('astroCloudsSub'),
    astroMoonImpact: document.getElementById('astroMoonImpact'),
    btnCalAstro: document.getElementById('btnCalAstro'),

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

  // SVG Ikonbibliotek (1.5px Precision Stroke)
  const SVG_ICONS = {
    fog: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="3" y1="8" x2="21" y2="8"></line><line x1="5" y1="12" x2="19" y2="12"></line><line x1="2" y1="16" x2="22" y2="16"></line><line x1="7" y1="20" x2="17" y2="20"></line></svg>`,
    dawn: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v4"></path><path d="M4.93 7.93l2.83 2.83"></path><path d="M19.07 7.93l-2.83 2.83"></path><path d="M17 18a5 5 0 0 0-10 0"></path><line x1="2" y1="18" x2="22" y2="18"></line><line x1="12" y1="13" x2="12" y2="9"></line><polyline points="10 11 12 9 14 11"></polyline></svg>`,
    sunset: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 18a5 5 0 0 0-10 0"></path><line x1="2" y1="18" x2="22" y2="18"></line><path d="M4.93 10.93l2.83-2.83"></path><path d="M19.07 10.93l-2.83-2.83"></path><line x1="12" y1="9" x2="12" y2="13"></line><polyline points="10 11 12 13 14 11"></polyline></svg>`,
    astro: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    moon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
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
  function getEventTiming(startTime, endTime, dayIndex, dayDate, eventType, score) {
    const now = new Date();
    const dayNamesFull = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
    const quality = typeof score === 'number' ? score : 50;

    // I dag (dag 0)
    if (dayIndex === 0) {
      // Aktiv lige nu
      if (startTime && endTime && now >= startTime && now <= endTime) {
        const remainingMs = endTime.getTime() - now.getTime();
        const durationStr = formatDuration(remainingMs);

        let bannerClass = 'banner-active';
        let icon = '🟢';
        let pill = 'Aktiv nu';
        let label = 'Aktiv lige nu • Slutter om ' + durationStr;
        let sub = 'Aktiv lige nu (slutter kl. ' + AstroCalc.formatTime(endTime) + ')';

        if (eventType === 'astro') {
          if (quality >= 65) {
            bannerClass = 'banner-active';
            icon = '✨';
            pill = 'Aktiv nu';
            label = 'Gode stjerneforhold nu • Slutter om ' + durationStr;
            sub = 'Astronomisk nat aktiv lige nu (slutter kl. ' + AstroCalc.formatTime(endTime) + ')';
          } else if (quality >= 40) {
            bannerClass = 'banner-active-moderate';
            icon = '⛅';
            pill = 'Moderat nu';
            label = 'Astronomisk nat aktiv • Vekslende skydække (slutter om ' + durationStr + ')';
            sub = 'Mørke i gang (kl. ' + AstroCalc.formatTime(endTime) + ') • Skiftende skyer';
          } else {
            bannerClass = 'banner-active-poor';
            icon = '☁️';
            pill = 'Overskyet nu';
            label = 'Astronomisk nat er i gang • Desværre overskyet (slutter om ' + durationStr + ')';
            sub = 'Mørke i gang (kl. ' + AstroCalc.formatTime(endTime) + ') • Dækket af skyer';
          }
        } else if (eventType === 'fog') {
          if (quality >= 55) {
            bannerClass = 'banner-active';
            icon = '🌫️';
            pill = 'Aktiv nu';
            label = 'Tågevindue aktivt nu • Gode tågebetingelser (slutter om ' + durationStr + ')';
            sub = 'Tågevindue aktivt lige nu (slutter kl. ' + AstroCalc.formatTime(endTime) + ')';
          } else if (quality >= 35) {
            bannerClass = 'banner-active-moderate';
            icon = '🌁';
            pill = 'Moderat nu';
            label = 'Tidsvindue aktivt • Mulighed for let morgendis (slutter om ' + durationStr + ')';
            sub = 'Tidsvindue aktivt (slutter kl. ' + AstroCalc.formatTime(endTime) + ')';
          } else {
            bannerClass = 'banner-active-poor';
            icon = '☀️';
            pill = 'Klar sigt';
            label = 'Morgentime i gang • Lav tågerisiko / klar luft (slutter om ' + durationStr + ')';
            sub = 'Morgenstund i gang (slutter kl. ' + AstroCalc.formatTime(endTime) + ') • Ingen tåge';
          }
        } else if (eventType === 'morning') {
          if (quality >= 65) {
            bannerClass = 'banner-active';
            icon = '🌅';
            pill = 'Aktiv nu';
            label = 'Gylden time aktiv lige nu • Flot morgenlys (slutter om ' + durationStr + ')';
            sub = 'Daggry i gang nu (slutter kl. ' + AstroCalc.formatTime(endTime) + ')';
          } else if (quality >= 40) {
            bannerClass = 'banner-active-moderate';
            icon = '🌤️';
            pill = 'Vekslende nu';
            label = 'Morgenlys aktivt nu • Vekslende skydække (slutter om ' + durationStr + ')';
            sub = 'Morgenlys i gang (slutter kl. ' + AstroCalc.formatTime(endTime) + ')';
          } else {
            bannerClass = 'banner-active-poor';
            icon = '☁️';
            pill = 'Overskyet nu';
            label = 'Morgentime i gang • Solen skjult af skydække (slutter om ' + durationStr + ')';
            sub = 'Morgenlys i gang, men dækket af skyer';
          }
        } else if (eventType === 'evening') {
          if (quality >= 65) {
            bannerClass = 'banner-active';
            icon = '🌆';
            pill = 'Aktiv nu';
            label = 'Solnedgang aktiv lige nu • Smukt aftenlys (slutter om ' + durationStr + ')';
            sub = 'Aktiv solnedgang lige nu (slutter kl. ' + AstroCalc.formatTime(endTime) + ')';
          } else if (quality >= 40) {
            bannerClass = 'banner-active-moderate';
            icon = '🌤️';
            pill = 'Moderat nu';
            label = 'Aftenlys i gang • Vekslende skydække (slutter om ' + durationStr + ')';
            sub = 'Solnedgang i gang (slutter kl. ' + AstroCalc.formatTime(endTime) + ')';
          } else {
            bannerClass = 'banner-active-poor';
            icon = '☁️';
            pill = 'Overskyet nu';
            label = 'Solnedgang i gang • Skjult bag tungt skydække (slutter om ' + durationStr + ')';
            sub = 'Solnedgang i gang, men skjult bag skyer';
          }
        }

        return {
          status: 'active',
          bannerClass: bannerClass,
          icon: icon,
          pill: pill,
          label: label,
          sub: sub,
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
          label = quality >= 65
            ? 'I aften • Om ' + formatDuration(untilMs) + ' (flot aftenlys)'
            : 'I aften • Om ' + formatDuration(untilMs);
          sub = 'Starter i aften kl. ' + AstroCalc.formatTime(startTime) + ' (om ' + formatDuration(untilMs) + ')';
        } else if (eventType === 'astro') {
          label = quality >= 65
            ? 'I aften/nat • Om ' + formatDuration(untilMs) + ' (klare stjerneforhold)'
            : quality <= 35
              ? 'I aften/nat • Om ' + formatDuration(untilMs) + ' (forventet overskyet)'
              : 'I aften/nat • Om ' + formatDuration(untilMs);
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

  // Beregner det aktuelle eller næste fotovindue for valgt dag til hurtig kalendereksport
  function getBannerCalendarPayload(day) {
    if (!day || !day.sun) return null;
    const now = new Date();
    const sun = day.sun;
    const locName = state.currentLoc.name || 'Lokation';
    const isToday = state.selectedDayIndex === 0;

    let title = '';
    let desc = '';
    let start = null;
    let end = null;

    if (isToday) {
      const fogEnd = sun.sunrise ? new Date(sun.sunrise.getTime() + 65 * 60 * 1000) : null;
      const mEnd = sun.goldenHourMorning ? sun.goldenHourMorning.end : null;
      const eStart = sun.goldenHourEvening ? sun.goldenHourEvening.start : null;
      const eEnd = sun.blueHourEvening ? sun.blueHourEvening.end : null;
      const aStart = sun.astronomicalDusk;

      if (fogEnd && now <= fogEnd) {
        start = new Date(sun.sunrise.getTime() - 60 * 60 * 1000);
        end = fogEnd;
        title = `📸 FotoVejr: Morgentåge & Solopgang (${locName})`;
        desc = `Morgentåge og daggry ved ${locName}.\nSolopgang kl. ${AstroCalc.formatTime(sun.sunrise)}.`;
      } else if (mEnd && now <= mEnd) {
        start = (sun.blueHourMorning && sun.blueHourMorning.start) || new Date(sun.sunrise.getTime() - 50 * 60 * 1000);
        end = mEnd;
        title = `📸 FotoVejr: Daggry & Gylden Time (${locName})`;
        desc = `Morgenlys ved ${locName}.\nSolopgang kl. ${AstroCalc.formatTime(sun.sunrise)}.`;
      } else if (eStart && now < eStart) {
        start = eStart;
        end = eEnd || new Date(sun.sunset.getTime() + 45 * 60 * 1000);
        title = `📸 FotoVejr: Solnedgang & Aftenlys (${locName})`;
        desc = `Gylden time og solnedgang ved ${locName}.\nSolnedgang kl. ${AstroCalc.formatTime(sun.sunset)}.`;
      } else if (eEnd && now <= eEnd) {
        start = eStart || new Date(sun.sunset.getTime() - 45 * 60 * 1000);
        end = eEnd;
        title = `📸 FotoVejr: Solnedgang & Blå Time (${locName})`;
        desc = `Aftenlys ved ${locName}.\nSolnedgang kl. ${AstroCalc.formatTime(sun.sunset)}.`;
      } else if (aStart) {
        start = aStart;
        end = sun.astronomicalDawn ? new Date(sun.astronomicalDawn.getTime() + 24 * 60 * 60 * 1000) : new Date(aStart.getTime() + 8 * 60 * 60 * 1000);
        title = `📸 FotoVejr: Astronomisk Stjernehimmel (${locName})`;
        desc = `Astronomisk nat ved ${locName}.\nNatskydække: ${day.astro.avgClouds}%.`;
      }
    } else {
      if (day.fog && day.fog.score >= 55) {
        start = new Date(sun.sunrise.getTime() - 60 * 60 * 1000);
        end = new Date(sun.sunrise.getTime() + 65 * 60 * 1000);
        title = `📸 FotoVejr: Morgentåge (${locName})`;
        desc = `Morgentåge og solopgang kl. ${AstroCalc.formatTime(sun.sunrise)} ved ${locName}.`;
      } else if (sun.goldenHourEvening && day.goldenEvening && day.goldenEvening.score >= 60) {
        start = sun.goldenHourEvening.start;
        end = sun.blueHourEvening ? sun.blueHourEvening.end : new Date(sun.sunset.getTime() + 45 * 60 * 1000);
        title = `📸 FotoVejr: Solnedgang & Aftenlys (${locName})`;
        desc = `Solnedgang kl. ${AstroCalc.formatTime(sun.sunset)} ved ${locName}.`;
      } else if (sun.sunrise) {
        start = (sun.blueHourMorning && sun.blueHourMorning.start) || new Date(sun.sunrise.getTime() - 50 * 60 * 1000);
        end = (sun.goldenHourMorning && sun.goldenHourMorning.end) || new Date(sun.sunrise.getTime() + 45 * 60 * 1000);
        title = `📸 FotoVejr: Daggry & Morgenlys (${locName})`;
        desc = `Solopgang kl. ${AstroCalc.formatTime(sun.sunrise)} ved ${locName}.`;
      }
    }

    if (!start || !end) return null;
    return {
      title: title,
      description: desc,
      location: locName,
      start: start,
      end: end,
      alarmMinutes: 45
    };
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
        const hasFog = day.fog && day.fog.score >= 50;
        el.dayBannerSubtitle.textContent = hasFog
          ? `Aktuel nu: Morgentåge & solopgang kl. ${AstroCalc.formatTime(sun.sunrise)}`
          : `Aktuel nu: Solopgang & daggry kl. ${AstroCalc.formatTime(sun.sunrise)}`;
      } else if (mEnd && now <= mEnd) {
        const isGoodMorn = day.goldenMorning && day.goldenMorning.score >= 50;
        el.dayBannerSubtitle.textContent = isGoodMorn
          ? `Aktuel lige nu: Daggry & gylden time!`
          : `Aktuel lige nu: Daggry (skydækket morgen)`;
      } else if (eStart && now < eStart) {
        el.dayBannerSubtitle.textContent = `Næste: Gylden time i aften kl. ${AstroCalc.formatTime(eStart)} (om ${formatDuration(eStart.getTime() - now.getTime())})`;
      } else if (eEnd && now <= eEnd) {
        const isGoodEve = day.goldenEvening && day.goldenEvening.score >= 50;
        el.dayBannerSubtitle.textContent = isGoodEve
          ? `Aktuel lige nu: Solnedgang & aftenlys!`
          : `Aktuel lige nu: Solnedgang (skjult bag skyer)`;
      } else if (aStart && now < aStart) {
        const isGoodAstro = day.astro && day.astro.score >= 60;
        el.dayBannerSubtitle.textContent = isGoodAstro
          ? `Næste: Stjernehimmel i aften kl. ${AstroCalc.formatTime(aStart)} (om ${formatDuration(aStart.getTime() - now.getTime())})`
          : `Næste: Astronomisk mørke i aften kl. ${AstroCalc.formatTime(aStart)} (om ${formatDuration(aStart.getTime() - now.getTime())})`;
      } else if (aStart && now >= aStart) {
        const isGoodAstro = day.astro && day.astro.score >= 60;
        el.dayBannerSubtitle.textContent = isGoodAstro
          ? `Aktuel i nat: Krystalklar astronomisk stjernehimmel`
          : `Aktuel i nat: Astronomisk nat (${day.astro.avgClouds}% skydække)`;
      } else {
        el.dayBannerSubtitle.textContent = `Dagens soltimer er passeret • Tryk 'I morgen' for næste dagslys`;
      }
    } else if (state.selectedDayIndex === 1) {
      el.dayBannerTitle.textContent = `I morgen (${dayNamesFull[d.getDay()].toLowerCase()} d. ${d.getDate()}. ${monthNames[d.getMonth()]})`;
      const sun = day.sun;
      if (sun.sunrise) {
        const mStart = sun.blueHourMorning ? sun.blueHourMorning.start : sun.sunrise;
        const until = Math.max(0, mStart.getTime() - now.getTime());
        const hasFogTomorrow = day.fog && day.fog.score >= 50;
        el.dayBannerSubtitle.textContent = hasFogTomorrow
          ? `Første fotomulighed: Daggry & tåge kl. ${AstroCalc.formatTime(mStart)} (om ${formatDuration(until)})`
          : `Første fotomulighed: Daggry & morgenlys kl. ${AstroCalc.formatTime(mStart)} (om ${formatDuration(until)})`;
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
        badgeHtml = dayData.badges.map(b => `<span class="day-badge-dot type-${b.type}" title="${b.text}">●</span>`).join('');
      } else {
        badgeHtml = `<span class="day-badge-dot" style="opacity: 0.25;">○</span>`;
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

  // --- KALENDER INTEGRATION (.ICS GENERATOR MED ALARM) ---
  function downloadCalendarEvent({ title, description, location, start, end, alarmMinutes = 45 }) {
    if (!start || !end) return;

    function toIcsFormat(d) {
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      const hours = String(d.getUTCHours()).padStart(2, '0');
      const mins = String(d.getUTCMinutes()).padStart(2, '0');
      const secs = String(d.getUTCSeconds()).padStart(2, '0');
      return `${year}${month}${day}T${hours}${mins}${secs}Z`;
    }

    const nowStr = toIcsFormat(new Date());
    const startStr = toIcsFormat(new Date(start));
    const endStr = toIcsFormat(new Date(end));
    const uid = 'fotovejr-' + Date.now() + '-' + Math.floor(Math.random() * 100000) + '@fotografiskesignaler.dk';

    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Fotografiske Signaler//FotoVejr//DA',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${nowStr}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:${(title || 'FotoVejr Fotobegivenhed').replace(/[,;]/g, ' ')}`,
      `DESCRIPTION:${(description || '').replace(/\n/g, '\\n')}`,
      `LOCATION:${(location || '').replace(/[,;]/g, ' ')}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      `TRIGGER:-PT${alarmMinutes}M`,
      'ACTION:DISPLAY',
      `DESCRIPTION:Påmindelse: ${title}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ];

    const icsData = icsLines.join('\r\n');
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanFileName = (title || 'fotovejr_event').toLowerCase().replace(/[^a-z0-9]/gi, '_');
    a.setAttribute('download', `${cleanFileName}.ics`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
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

    const timing = getEventTiming(fogStart, fogEnd, state.selectedDayIndex, day.date, 'fog', fog.score);
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
    if (el.fogSpreadSub) {
      const spreadVal = parseFloat(fog.avgSpread);
      if (spreadVal <= 1.0) el.fogSpreadSub.textContent = 'Meget lille forskel (høj tågefare)';
      else if (spreadVal <= 2.5) el.fogSpreadSub.textContent = 'Moderat forskel (mulig dis)';
      else el.fogSpreadSub.textContent = 'For stor forskel til tåge';
    }
    el.fogHumidity.textContent = `${fog.avgHumidity}%`;
    el.fogWind.textContent = `${fog.avgWind} m/s`;
    el.fogVisibility.textContent = `${fog.minVisibilityKm} km`;
  }

  // Morgen-kort opdatering
  function renderMorningCard(day) {
    const g = day.goldenMorning;
    const sun = day.sun;

    el.morningBadge.textContent = `${g.score}% kvalitet`;
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
    const timing = getEventTiming(mStart, mEnd, state.selectedDayIndex, day.date, 'morning', g.score);

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
      if (timing.isPassed) {
        el.morningBlueSub.textContent = 'Afsluttet i morges';
      } else if (g.clouds && g.clouds.total >= 75) {
        el.morningBlueSub.textContent = 'Overskyet blå time (diffust lys)';
      } else if (g.clouds && g.clouds.total <= 30) {
        el.morningBlueSub.textContent = 'Klar dybblå himmel & bylys';
      } else {
        el.morningBlueSub.textContent = 'Vekslende skydække i den blå time';
      }
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

    el.eveningBadge.textContent = `${g.score}% kvalitet`;
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
    const timing = getEventTiming(eStart, eEnd, state.selectedDayIndex, day.date, 'evening', g.score);

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
      if (timing.isPassed) {
        el.eveningBlueSub.textContent = 'Afsluttet i aften';
      } else if (g.clouds && g.clouds.total >= 75) {
        el.eveningBlueSub.textContent = 'Overskyet blå time (diffust lys)';
      } else if (g.clouds && g.clouds.total <= 30) {
        el.eveningBlueSub.textContent = 'Klar dybblå himmel & langtidseksponering';
      } else {
        el.eveningBlueSub.textContent = 'Vekslende skydække i den blå time';
      }
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
    el.astroBadge.textContent = `${a.score}% • ${a.status}`;
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

    const timing = getEventTiming(aStart, aEnd, state.selectedDayIndex, day.date, 'astro', a.score);
    applyTimingBanner(el.astroTimingBanner, el.astroTimingLabel, el.astroTimingPill, timing);

    if (el.astroDarkSub) {
      el.astroDarkSub.textContent = timing.sub;
    }
    if (el.cardAstro) el.cardAstro.classList.toggle('card-event-passed', timing.isPassed);

    el.astroClouds.textContent = `${a.avgClouds}%`;
    if (el.astroCloudsSub) {
      if (a.avgClouds <= 15) el.astroCloudsSub.textContent = 'Klart udsyn til stjerner';
      else if (a.avgClouds <= 35) el.astroCloudsSub.textContent = 'Få spredte skyer';
      else if (a.avgClouds <= 60) el.astroCloudsSub.textContent = 'Vekslende skydække / kighuller';
      else if (a.avgClouds <= 85) el.astroCloudsSub.textContent = 'Mest overskyet / få kighuller';
      else el.astroCloudsSub.textContent = 'Helt overskyet / intet udsyn';
    }

    el.astroMoonImpact.textContent = a.moonImpact;
  }

  // Måne-kort opdatering
  function renderMoonCard(day) {
    const moon = day.moon;
    const mt = day.moonTimes;
    const now = new Date();

    if (el.moonIconHeader) el.moonIconHeader.innerHTML = SVG_ICONS.moon;
    el.moonPhaseTitle.textContent = moon.name;
    el.moonIllumSubtitle.textContent = `${moon.fraction}% oplyst flade`;
    el.moonBadge.textContent = `${moon.name}`;

    const dayNames = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];
    let dayLabel = 'I dag';
    if (state.selectedDayIndex === 1) dayLabel = 'I morgen';
    else if (state.selectedDayIndex >= 2) dayLabel = dayNames[day.date.getDay()];

    applyTimingBanner(el.moonTimingBanner, el.moonTimingLabel, el.moonTimingPill, {
      bannerClass: 'banner-info',
      icon: '',
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

    // Hurtig-kalender knap på dagsbanneret
    if (el.btnCalDayBanner) {
      el.btnCalDayBanner.addEventListener('click', () => {
        const day = state.parsedDays[state.selectedDayIndex];
        const payload = getBannerCalendarPayload(day);
        if (payload) {
          downloadCalendarEvent(payload);
        }
      });
    }

    // Kort-specifikke kalenderknapper
    if (el.btnCalFog) {
      el.btnCalFog.addEventListener('click', () => {
        const day = state.parsedDays[state.selectedDayIndex];
        if (!day || !day.sun.sunrise) return;
        const start = new Date(day.sun.sunrise.getTime() - 60 * 60 * 1000);
        const end = new Date(day.sun.sunrise.getTime() + 65 * 60 * 1000);
        downloadCalendarEvent({
          title: `📸 FotoVejr: Morgentåge (${state.currentLoc.name})`,
          description: `Morgentåge-indeks: ${day.fog.score}%\nTidsvindue: ${AstroCalc.formatTime(start)} – ${AstroCalc.formatTime(end)}\nDugpunktsforskel: ${day.fog.avgSpread}°C, Vind: ${day.fog.avgWind} m/s\nSolopgang: kl. ${AstroCalc.formatTime(day.sun.sunrise)}`,
          location: state.currentLoc.name,
          start: start,
          end: end,
          alarmMinutes: 45
        });
      });
    }

    if (el.btnCalMorning) {
      el.btnCalMorning.addEventListener('click', () => {
        const day = state.parsedDays[state.selectedDayIndex];
        if (!day || !day.sun.sunrise) return;
        const start = (day.sun.blueHourMorning && day.sun.blueHourMorning.start) || new Date(day.sun.sunrise.getTime() - 50 * 60 * 1000);
        const end = (day.sun.goldenHourMorning && day.sun.goldenHourMorning.end) || new Date(day.sun.sunrise.getTime() + 45 * 60 * 1000);
        downloadCalendarEvent({
          title: `📸 FotoVejr: Daggry & Morgenlys (${state.currentLoc.name})`,
          description: `Morgenlys-kvalitet: ${day.goldenMorning.score}%\nSolopgang kl. ${AstroCalc.formatTime(day.sun.sunrise)}\nAzimut: ${day.sunriseAzimuth !== null ? Math.round(day.sunriseAzimuth) + '°' : 'Øst'}`,
          location: state.currentLoc.name,
          start: start,
          end: end,
          alarmMinutes: 45
        });
      });
    }

    if (el.btnCalEvening) {
      el.btnCalEvening.addEventListener('click', () => {
        const day = state.parsedDays[state.selectedDayIndex];
        if (!day || !day.sun.sunset) return;
        const start = (day.sun.goldenHourEvening && day.sun.goldenHourEvening.start) || new Date(day.sun.sunset.getTime() - 45 * 60 * 1000);
        const end = (day.sun.blueHourEvening && day.sun.blueHourEvening.end) || new Date(day.sun.sunset.getTime() + 45 * 60 * 1000);
        downloadCalendarEvent({
          title: `📸 FotoVejr: Solnedgang & Aftenlys (${state.currentLoc.name})`,
          description: `Aftenlys-kvalitet: ${day.goldenEvening.score}%\nSolnedgang kl. ${AstroCalc.formatTime(day.sun.sunset)}\nAzimut: ${day.sunsetAzimuth !== null ? Math.round(day.sunsetAzimuth) + '°' : 'Vest'}`,
          location: state.currentLoc.name,
          start: start,
          end: end,
          alarmMinutes: 45
        });
      });
    }

    if (el.btnCalAstro) {
      el.btnCalAstro.addEventListener('click', () => {
        const day = state.parsedDays[state.selectedDayIndex];
        if (!day || !day.sun.astronomicalDusk) return;
        const start = day.sun.astronomicalDusk;
        const end = day.sun.astronomicalDawn ? new Date(day.sun.astronomicalDawn.getTime() + 24 * 60 * 60 * 1000) : new Date(start.getTime() + 8 * 60 * 60 * 1000);
        downloadCalendarEvent({
          title: `📸 FotoVejr: Astronomisk Stjernehimmel (${state.currentLoc.name})`,
          description: `Stjerneklar kvalitet: ${day.astro.score}%\nAstronomisk mørke: ${day.astro.astroStart} – ${day.astro.astroEnd}\nNatskydække: ${day.astro.avgClouds}%`,
          location: state.currentLoc.name,
          start: start,
          end: end,
          alarmMinutes: 45
        });
      });
    }

    // Fold-ud / To-lags målinger skuffe-toggle
    document.querySelectorAll('.btn-toggle-deep-data').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const drawer = document.getElementById(targetId);
        if (!drawer) return;
        const isOpen = drawer.classList.toggle('open');
        btn.classList.toggle('open', isOpen);
      });
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
