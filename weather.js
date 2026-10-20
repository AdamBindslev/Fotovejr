/**
 * weather.js - Henter vejrdata fra Open-Meteo og beregner foto-specifikke indekser
 * (Tågerisiko, Gylden time-kvalitet, Stjerneklart / Astro-score).
 * Indeholder offline caching i localStorage.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./astro.js'));
  } else {
    root.WeatherEngine = factory(root.AstroCalc);
  }
})(typeof self !== 'undefined' ? self : this, function (AstroCalc) {
  'use strict';

  var CACHE_PREFIX = 'photoweather_cache_v2_';

  // Henter vejrdata for koordinater (med fallback til cache ved offline)
  async function fetchForecast(lat, lng, forceRefresh = false) {
    var cacheKey = CACHE_PREFIX + lat.toFixed(4) + '_' + lng.toFixed(4);
    var cached = null;
    try {
      var raw = localStorage.getItem(cacheKey);
      if (raw) {
        cached = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Kunne ikke læse cache:', e);
    }

    // Hvis ikke offline, hent ny data fra Open-Meteo
    if (navigator.onLine && (!cached || forceRefresh || Date.now() - cached.timestamp > 30 * 60 * 1000)) {
      try {
        var url = new URL('https://api.open-meteo.com/v1/forecast');
        url.searchParams.set('latitude', lat);
        url.searchParams.set('longitude', lng);
        url.searchParams.set('hourly', [
          'temperature_2m',
          'relative_humidity_2m',
          'dew_point_2m',
          'precipitation_probability',
          'precipitation',
          'weather_code',
          'cloud_cover',
          'cloud_cover_low',
          'cloud_cover_mid',
          'cloud_cover_high',
          'visibility',
          'wind_speed_10m'
        ].join(','));
        url.searchParams.set('daily', [
          'weather_code',
          'temperature_2m_max',
          'temperature_2m_min',
          'sunrise',
          'sunset',
          'uv_index_max'
        ].join(','));
        url.searchParams.set('wind_speed_unit', 'ms');
        url.searchParams.set('timezone', 'auto');
        url.searchParams.set('forecast_days', '7');

        var res = await fetch(url.toString());
        if (!res.ok) throw new Error('Vejr-server svarede med fejl: ' + res.status);
        var data = await res.json();

        var cachePayload = {
          timestamp: Date.now(),
          data: data,
          lat: lat,
          lng: lng
        };
        try {
          localStorage.setItem(cacheKey, JSON.stringify(cachePayload));
        } catch (err) {
          console.warn('Kunne ikke gemme i cache:', err);
        }

        return {
          forecast: data,
          isCached: false,
          updatedAt: new Date()
        };
      } catch (err) {
        console.warn('Netværksfejl ved hentning af vejr, prøver cache:', err);
        if (cached) {
          return {
            forecast: cached.data,
            isCached: true,
            updatedAt: new Date(cached.timestamp),
            offlineReason: 'Netværksfejl - viser gemt vejrudsigt'
          };
        }
        throw err;
      }
    }

    if (cached) {
      return {
        forecast: cached.data,
        isCached: true,
        updatedAt: new Date(cached.timestamp)
      };
    }

    throw new Error('Ingen netværksforbindelse og ingen gemt vejrdata fundet for dette sted.');
  }

  // Søg efter steder/byer med Open-Meteo Geocoding
  async function searchLocation(query) {
    if (!query || query.trim().length < 2) return [];
    var url = 'https://geocoding-api.open-meteo.com/v1/search?name=' +
      encodeURIComponent(query.trim()) + '&count=6&language=da&format=json';
    var res = await fetch(url);
    if (!res.ok) return [];
    var data = await res.json();
    if (!data.results) return [];
    return data.results.map(function (item) {
      return {
        name: item.name,
        admin1: item.admin1 || '',
        country: item.country || '',
        lat: item.latitude,
        lng: item.longitude
      };
    });
  }

  // Slå stednavn op ud fra GPS-koordinater (Reverse Geocoding)
  async function reverseGeocode(lat, lng) {
    try {
      var bdcUrl = 'https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' +
        encodeURIComponent(lat) + '&longitude=' + encodeURIComponent(lng) + '&localityLanguage=da';
      var res = await fetch(bdcUrl);
      if (res.ok) {
        var data = await res.json();
        var loc = data.locality || data.city || '';
        var sub = data.principalSubdivision || data.countryName || '';
        if (loc) {
          return {
            name: loc,
            sub: sub && sub !== loc ? sub : (data.countryName || '')
          };
        }
      }
    } catch (e) {
      console.warn('BigDataCloud reverse geocode fejl, prøver fallback:', e);
    }

    try {
      var nomUrl = 'https://nominatim.openstreetmap.org/reverse?lat=' +
        encodeURIComponent(lat) + '&lon=' + encodeURIComponent(lng) + '&format=json&accept-language=da';
      var nomRes = await fetch(nomUrl);
      if (nomRes.ok) {
        var nomData = await nomRes.json();
        var addr = nomData.address || {};
        var localName = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city || addr.municipality || 'Aktuel position';
        var county = addr.city || addr.municipality || addr.state || '';
        return {
          name: localName,
          sub: county !== localName ? county : ''
        };
      }
    } catch (e) {
      console.warn('Nominatim reverse geocode fejl:', e);
    }

    return { name: 'Aktuel position', sub: '' };
  }

  // Henter vejrdata for et givet døgn (0-6 indekseret)
  function parseDayData(weatherData, dayIndex, lat, lng) {
    if (!weatherData || !weatherData.daily || !weatherData.daily.time[dayIndex]) return null;

    var dateStr = weatherData.daily.time[dayIndex]; // 'YYYY-MM-DD'
    var parts = dateStr.split('-');
    var targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 12, 0, 0);

    // Beregn astronomiske tider for denne dag og lokation
    var sun = AstroCalc.getSunTimes(targetDate, lat, lng);
    var moon = AstroCalc.getMoonIllumination(targetDate);
    var moonTimes = AstroCalc.getMoonTimes(targetDate, lat, lng);

    // Beregn azimut for solopgang, solnedgang og måne
    var sunriseAz = sun.sunrise ? AstroCalc.getSunPosition(sun.sunrise, lat, lng).azimuth : null;
    var sunsetAz = sun.sunset ? AstroCalc.getSunPosition(sun.sunset, lat, lng).azimuth : null;
    var moonriseAz = moonTimes.rise ? AstroCalc.getMoonPosition(moonTimes.rise, lat, lng).azimuth : null;
    var moonsetAz = moonTimes.set ? AstroCalc.getMoonPosition(moonTimes.set, lat, lng).azimuth : null;

    // Udtræk de 24 timer for denne dag
    var startHourIndex = dayIndex * 24;
    var hourly = [];
    var hRaw = weatherData.hourly;

    for (var i = 0; i < 24; i++) {
      var idx = startHourIndex + i;
      if (idx < hRaw.time.length) {
        var hTime = new Date(hRaw.time[idx]);
        var rawWind = (hRaw.wind_speed_10m && hRaw.wind_speed_10m[idx] !== undefined)
          ? hRaw.wind_speed_10m[idx]
          : 0;
        // Hvis data mod forventning er i km/h (f.eks. fra ældre cache), konverteres til m/s:
        var isKmh = weatherData.hourly_units && weatherData.hourly_units.wind_speed_10m === 'km/h';
        var windSpeedMs = isKmh ? (rawWind / 3.6) : rawWind;

        hourly.push({
          hour: hTime.getHours(),
          timeStr: hRaw.time[idx],
          temp: hRaw.temperature_2m[idx],
          humidity: hRaw.relative_humidity_2m[idx],
          dewPoint: hRaw.dew_point_2m[idx],
          spread: hRaw.temperature_2m[idx] - hRaw.dew_point_2m[idx],
          cloudTotal: hRaw.cloud_cover[idx],
          cloudLow: hRaw.cloud_cover_low[idx],
          cloudMid: hRaw.cloud_cover_mid[idx],
          cloudHigh: hRaw.cloud_cover_high[idx],
          visibility: hRaw.visibility[idx], // meter
          windSpeed: windSpeedMs, // m/s
          weatherCode: hRaw.weather_code[idx],
          precipProb: hRaw.precipitation_probability ? hRaw.precipitation_probability[idx] : 0
        });
      }
    }

    // --- 1. TÅGE-ANALYSE (Fokus på daggry: ca. 04:00 - 08:00) ---
    var fogScore = calculateFogScore(hourly, sun);

    // --- 2. GYLDEN & BLÅ TIME KVALITET (Morgen & Aften) ---
    var goldenMorningScore = calculateGoldenHourQuality(hourly, sun.goldenHourMorning, sun.sunrise);
    var goldenEveningScore = calculateGoldenHourQuality(hourly, sun.goldenHourEvening, sun.sunset);

    // --- 3. STJERNEKLAR NAT / ASTRO-SCORE (Astro-mørke timer) ---
    var astroScore = calculateAstroScore(hourly, sun, moon, moonTimes, lat, lng, targetDate);

    // --- 4. DAGS-RESUMÉ BADGES (Til 7-dages overblikket) ---
    var badges = [];
    if (fogScore.score >= 65) badges.push({ text: 'Tåge', icon: '🌫️', type: 'fog' });
    else if (fogScore.score >= 45) badges.push({ text: 'Dis', icon: '🌁', type: 'mist' });

    if (astroScore.score >= 70) badges.push({ text: 'Astro', icon: '✨', type: 'astro' });
    if (goldenEveningScore.score >= 75 || goldenMorningScore.score >= 75) badges.push({ text: 'Gylden', icon: '🌅', type: 'golden' });
    if (moon.fraction >= 95) badges.push({ text: 'Fuldmåne', icon: '🌕', type: 'moon' });
    else if (moon.fraction <= 6) badges.push({ text: 'Nymåne', icon: '🌑', type: 'newmoon' });

    return {
      dayIndex: dayIndex,
      date: targetDate,
      dateString: dateStr,
      tempMax: weatherData.daily.temperature_2m_max[dayIndex],
      tempMin: weatherData.daily.temperature_2m_min[dayIndex],
      weatherCode: weatherData.daily.weather_code[dayIndex],
      sun: sun,
      sunriseAzimuth: sunriseAz,
      sunsetAzimuth: sunsetAz,
      moon: moon,
      moonTimes: moonTimes,
      moonriseAzimuth: moonriseAz,
      moonsetAzimuth: moonsetAz,
      hourly: hourly,
      fog: fogScore,
      goldenMorning: goldenMorningScore,
      goldenEvening: goldenEveningScore,
      astro: astroScore,
      badges: badges
    };
  }

  // Algoritme til tågerisiko:
  // Tåge (især strålingståge) dannes når dugpunktstemperaturen er næsten lig med lufttemperaturen (spread < 2°C),
  // relativ luftfugtighed > 88%, lav vindstyrke (< 2-3 m/s) og klar nattehimmel der fremmer udstråling.
  function calculateFogScore(hourly, sun) {
    if (!hourly || hourly.length === 0) return { score: 0, text: 'Ingen data' };

    // Find solopgangstime
    var sunriseHour = sun.sunrise ? sun.sunrise.getHours() : 6;
    var scanHours = [
      Math.max(0, sunriseHour - 2),
      Math.max(0, sunriseHour - 1),
      sunriseHour,
      Math.min(23, sunriseHour + 1)
    ];

    var relevantHours = hourly.filter(function (h) {
      return scanHours.indexOf(h.hour) !== -1;
    });

    if (relevantHours.length === 0) relevantHours = hourly.slice(4, 8);

    var avgSpread = 0;
    var avgHumidity = 0;
    var avgWind = 0;
    var minVisibility = 99999;
    var hasFogWeatherCode = false;

    relevantHours.forEach(function (h) {
      avgSpread += h.spread;
      avgHumidity += h.humidity;
      avgWind += h.windSpeed;
      if (h.visibility < minVisibility) minVisibility = h.visibility;
      if (h.weatherCode === 45 || h.weatherCode === 48) hasFogWeatherCode = true;
    });

    avgSpread /= relevantHours.length;
    avgHumidity /= relevantHours.length;
    avgWind /= relevantHours.length;

    var points = 0;

    // Dugpunktsforskel (maks 40 point)
    if (avgSpread <= 0.5) points += 40;
    else if (avgSpread <= 1.2) points += 32;
    else if (avgSpread <= 2.2) points += 20;
    else if (avgSpread <= 3.5) points += 10;

    // Relativ luftfugtighed (maks 30 point)
    if (avgHumidity >= 96) points += 30;
    else if (avgHumidity >= 92) points += 24;
    else if (avgHumidity >= 88) points += 16;
    else if (avgHumidity >= 80) points += 8;

    // Vindforhold (maks 20 point - let brise eller vindstille er ideelt)
    if (avgWind <= 2.0) points += 20; // Rolig vind / let brise (< 2 m/s)
    else if (avgWind <= 3.5) points += 14; // Svag vind (2 - 3.5 m/s)
    else if (avgWind <= 5.0) points += 6; // Moderat vind (3.5 - 5 m/s)
    else points -= 15; // Kraftig blæst (> 5 m/s) forhindrer tågedannelse

    // Sigtbarhed og officielle vejrkoder (maks 20 point)
    if (hasFogWeatherCode || minVisibility <= 1000) points += 20;
    else if (minVisibility <= 4000) points += 12;

    var finalScore = Math.min(100, Math.max(0, points));

    var level = 'Lav';
    var text = 'Lav tågerisiko – klar morgensigt';
    var icon = '☀️';
    var classType = 'low';

    if (finalScore >= 75) {
      level = 'Meget høj';
      text = 'Perfekte tågebetingelser! Tæt morgentåge forventes i lavninger og ved søer';
      icon = '🌫️';
      classType = 'high';
    } else if (finalScore >= 55) {
      level = 'Høj';
      text = 'Gode chancer for stemningsfuld morgendis og jordtåge';
      icon = '🌫️';
      classType = 'high';
    } else if (finalScore >= 35) {
      level = 'Moderat';
      text = 'Mulighed for let dis over enge og vand tidligt om morgenen';
      icon = '🌁';
      classType = 'moderate';
    }

    return {
      score: finalScore,
      level: level,
      text: text,
      icon: icon,
      classType: classType,
      avgSpread: avgSpread.toFixed(1),
      avgHumidity: Math.round(avgHumidity),
      avgWind: avgWind.toFixed(1),
      minVisibilityKm: (minVisibility / 1000).toFixed(1)
    };
  }

  // Kvalitet af gylden time:
  // Skyer i mellemlag og højt lag (cirrus/altocumulus) fanger solens røde stråler og skaber en dramatisk himmel.
  // Tykke lave skyer (stratus) kvæler lyset helt.
  function calculateGoldenHourQuality(hourly, hourWindow, sunEventTime) {
    if (!hourly || !sunEventTime) {
      return { score: 50, text: 'Middel betingelser', cloudsDesc: 'Normalt skydække' };
    }

    var targetH = sunEventTime.getHours();
    var matchHour = hourly.find(function (h) { return h.hour === targetH; }) || hourly[targetH] || hourly[0];

    var total = matchHour.cloudTotal;
    var low = matchHour.cloudLow;
    var mid = matchHour.cloudMid;
    var high = matchHour.cloudHigh;

    var score = 50;
    var text = 'Pænt lys';
    var icon = '☀️';

    if (low >= 70 || (total >= 85 && (low + mid) >= 80)) {
      score = 20;
      text = 'Tungt lavt skydække blokerer for direkte sollys og gylden glød';
      icon = '☁️';
    } else if (total >= 75) {
      score = 35;
      text = 'Overvejende overskyet – diffust og dæmpet lys ved horisonten';
      icon = '☁️';
    } else if (total <= 15) {
      score = 85;
      text = 'Klar himmel – rent gyldent lys og skarpe lange skygger';
      icon = '🌅';
    } else if (low <= 30 && (mid + high >= 30 && mid + high <= 75)) {
      score = 95;
      text = 'Fremragende! Høje og mellemskyer kan skabe en flammende farverig himmel';
      icon = '🔥';
    } else if (total <= 50) {
      score = 75;
      text = 'Gode forhold med dynamiske lysstriber gennem spredte skyer';
      icon = '🌤️';
    } else {
      score = 45;
      text = 'Vekslende skydække med diffuse lysforhold';
      icon = '⛅';
    }

    return {
      score: score,
      text: text,
      icon: icon,
      clouds: {
        total: total,
        low: low,
        mid: mid,
        high: high
      }
    };
  }

  // Astro / Nattehimmel analyse:
  // Perfekt stjernehimmel kræver:
  // 1. Solen dybt under horisonten (astronomisk nat)
  // 2. Minimum af skydække (især lave og mellemskyer)
  // 3. Månens lyspåvirkning: Hvis månen er under horisonten eller har lav fase (nymåne), er himlen kulsort!
  function calculateAstroScore(hourly, sun, moon, moonTimes, lat, lng, date) {
    // Tjek om der er astronomisk nat (sol under -18 grader)
    var hasAstroNight = sun.astronomicalDusk && sun.astronomicalDawn;
    
    // Timer mellem kl 22:00 og 04:00 som typisk natte-vindue
    var nightHours = hourly.filter(function (h) {
      return h.hour >= 22 || h.hour <= 4;
    });

    if (nightHours.length === 0) nightHours = hourly.slice(0, 4);

    var avgClouds = 0;
    var avgLowClouds = 0;
    nightHours.forEach(function (h) {
      avgClouds += h.cloudTotal;
      avgLowClouds += h.cloudLow;
    });
    avgClouds /= nightHours.length;
    avgLowClouds /= nightHours.length;
    var roundClouds = Math.round(avgClouds);

    // Beregn månens tilstedeværelse over horisonten i natte-vinduet
    var moonUpHours = 0;
    nightHours.forEach(function (h) {
      var d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + (h.hour <= 4 ? 1 : 0), h.hour, 0, 0);
      try {
        var pos = AstroCalc.getMoonPosition(d, lat, lng);
        if (pos && pos.altitude > 0) {
          moonUpHours++;
        }
      } catch (e) {}
    });

    var points = 100;

    // Træk point fra for skyer (skyer er det absolut vigtigste for stjernekiggeri)
    if (roundClouds <= 10) {
      points -= (roundClouds * 0.5);
    } else if (roundClouds <= 30) {
      points -= (5 + (roundClouds - 10) * 1.0);
    } else if (roundClouds <= 60) {
      points -= (25 + (roundClouds - 30) * 1.5);
    } else {
      // Svært overskyet nat (f.eks. 70-80%+) giver ugunstig score
      points -= (70 + (roundClouds - 60) * 0.7);
    }

    // Ekstra fradrag for uigennemtrængelige lave skyer
    points -= (avgLowClouds * 0.25);

    // Månepåvirkning:
    var moonImpact = '';
    if (moonUpHours === 0) {
      moonImpact = 'Månen er under horisonten hele natten (ingen måneforstyrrelse)';
    } else if (moon.fraction <= 15) {
      moonImpact = 'Nymåne / ultrasvagt segl (' + moon.fraction + '%) – intet generende måneskin';
    } else if (moon.fraction <= 45) {
      points -= Math.round((moon.fraction / 100) * 15);
      moonImpact = 'Svag månefase (' + moon.fraction + '%) – kun moderat lyspåvirkning';
    } else {
      points -= Math.round((moon.fraction / 100) * 35);
      moonImpact = 'Kraftigt måneskin (' + moon.fraction + '%) oplyser natten og udvisker svage stjerner';
    }

    if (!hasAstroNight) {
      points = Math.min(points, 50);
      moonImpact += ' • Bemærk: Lyse nætter forhindrer kulsort astronomisk mørke';
    }

    var finalScore = Math.min(100, Math.max(0, Math.round(points)));

    var status = 'Ugunstig';
    var icon = '☁️';
    var text = '';

    if (roundClouds >= 75) {
      status = 'Ugunstig';
      icon = '☁️';
      if (moonUpHours === 0 || moon.fraction <= 20) {
        text = 'Tæt skydække (' + roundClouds + '%) dækker himlen i nat. Månen er ellers under horisonten, men skyerne blokerer udsynet.';
      } else {
        text = 'Tæt skydække (' + roundClouds + '%) og måneskin forhindrer stjernekiggeri og astrofotografering i nat.';
      }
    } else if (roundClouds >= 50) {
      status = 'Svag';
      icon = '⛅';
      if (moonUpHours === 0 || moon.fraction <= 20) {
        text = 'Overvejende skyet (' + roundClouds + '%). Kun spredte kighuller til enkelte klare stjerner og planeter mellem skyerne.';
      } else {
        text = 'Vanskelige stjerneforhold: Skyet (' + roundClouds + '%) kombineret med oplysende måneskin (' + moon.fraction + '%).';
      }
    } else if (roundClouds >= 25) {
      status = 'Moderat';
      icon = '🌤️';
      if (moonUpHours === 0 || moon.fraction <= 20) {
        text = 'Blandede stjerneforhold med spredte skyer (' + roundClouds + '%). Fin kontrast til stjernebilleder i de klare passager.';
      } else {
        text = 'Delvist klart (' + roundClouds + '% skyer), men måneskinnet (' + moon.fraction + '%) svækker udsynet til Mælkevejen.';
      }
    } else {
      // Under 25% skyer - klart vejr!
      if (moonUpHours === 0 || moon.fraction <= 20) {
        status = 'Fremragende';
        icon = '✨';
        text = 'Krystalklar stjernehimmel uden månelys! Ideelle betingelser for Mælkevejen, stjerneskud og deep-sky.';
      } else if (moon.fraction <= 50) {
        status = 'God';
        icon = '🔭';
        text = 'Klar nattehimmel (' + roundClouds + '% skyer). Svagt måneskin dæmper de mest lyssvage stjerner.';
      } else {
        status = 'Moderat';
        icon = '🌕';
        text = 'Klar himmel (' + roundClouds + '% skyer), men kraftigt måneskin (' + moon.fraction + '%) oplyser atmosfæren.';
      }
    }

    if (!hasAstroNight) {
      text += ' (Lyse nætter: Himlen når ikke astronomisk mørke).';
    }

    return {
      score: finalScore,
      status: status,
      text: text,
      icon: icon,
      avgClouds: roundClouds,
      moonImpact: moonImpact,
      hasAstroNight: !!hasAstroNight,
      astroStart: sun.astronomicalDusk ? AstroCalc.formatTime(sun.astronomicalDusk) : null,
      astroEnd: sun.astronomicalDawn ? AstroCalc.formatTime(sun.astronomicalDawn) : null
    };
  }

  // Vurderer generel vejrkode til dansk tekst og ikon
  function getWeatherCodeDescription(code) {
    var map = {
      0: { text: 'Skyfrit', icon: '☀️' },
      1: { text: 'Overvejende klart', icon: '🌤️' },
      2: { text: 'Delvist skyet', icon: '⛅' },
      3: { text: 'Skyet', icon: '☁️' },
      45: { text: 'Tåge', icon: '🌫️' },
      48: { text: 'Rimtåge', icon: '🌫️' },
      51: { text: 'Let støvregn', icon: '🌦️' },
      53: { text: 'Støvregn', icon: '🌦️' },
      55: { text: 'Tæt støvregn', icon: '🌧️' },
      61: { text: 'Let regn', icon: '🌦️' },
      63: { text: 'Regn', icon: '🌧️' },
      65: { text: 'Kraftig regn', icon: '🌧️' },
      71: { text: 'Let sne', icon: '🌨️' },
      73: { text: 'Sne', icon: '🌨️' },
      75: { text: 'Kraftig sne', icon: '❄️' },
      80: { text: 'Lette byger', icon: '🌦️' },
      81: { text: 'Byger', icon: '🌧️' },
      82: { text: 'Voldsomme byger', icon: '⛈️' },
      95: { text: 'Tordenvejr', icon: '⛈️' }
    };
    return map[code] || { text: 'Skiftende', icon: '🌤️' };
  }

  return {
    fetchForecast: fetchForecast,
    searchLocation: searchLocation,
    reverseGeocode: reverseGeocode,
    parseDayData: parseDayData,
    getWeatherCodeDescription: getWeatherCodeDescription
  };
});
