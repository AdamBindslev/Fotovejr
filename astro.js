/**
 * astro.js - Astronomiske beregninger for fotografer (sol, måne, tusmørke, azimut)
 * Kører 100% offline i browseren uden eksterne afhængigheder.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AstroCalc = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PI = Math.PI,
    sin = Math.sin,
    cos = Math.cos,
    tan = Math.tan,
    asin = Math.asin,
    atan2 = Math.atan2,
    acos = Math.acos,
    rad = PI / 180,
    deg = 180 / PI;

  var dayMs = 1000 * 60 * 60 * 24,
    J1970 = 2440588,
    J2000 = 2451545;

  function toJulian(date) {
    return date.valueOf() / dayMs - 0.5 + J1970;
  }
  function fromJulian(j) {
    return new Date((j + 0.5 - J1970) * dayMs);
  }
  function toDays(date) {
    return toJulian(date) - J2000;
  }

  // Sol-koordinater
  var e = rad * 23.4397; // Jordens skråning (obliquity)

  function safeAcos(x) {
    return acos(Math.max(-1, Math.min(1, x)));
  }
  function safeAsin(x) {
    return asin(Math.max(-1, Math.min(1, x)));
  }

  function rightAscension(l, b) {
    return atan2(sin(l) * cos(e) - tan(b) * sin(e), cos(l));
  }
  function declination(l, b) {
    return safeAsin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l));
  }
  function azimuth(H, phi, dec) {
    return atan2(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi));
  }
  function altitude(H, phi, dec) {
    return safeAsin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H));
  }
  function siderealTime(d, lw) {
    return rad * (280.16 + 360.9856235 * d) - lw;
  }

  function solarMeanAnomaly(d) {
    return rad * (357.5291 + 0.98560028 * d);
  }
  function eclipticLongitude(M) {
    var C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M)),
      P = rad * 102.9372;
    return M + C + P + PI;
  }

  function sunCoords(d) {
    var M = solarMeanAnomaly(d),
      L = eclipticLongitude(M);
    return {
      dec: declination(L, 0),
      ra: rightAscension(L, 0)
    };
  }

  // Soltider beregninger
  var J0 = 0.0009;

  function julianCycle(d, lw) {
    return Math.round(d - J0 - lw / (2 * PI));
  }
  function approxTransit(Ht, lw, n) {
    return J0 + (Ht + lw) / (2 * PI) + n;
  }
  function solarTransitJ(ds, M, L) {
    return J2000 + ds + 0.0053 * sin(M) - 0.0069 * sin(2 * L);
  }
  function hourAngle(h, phi, dec) {
    var val = (sin(h) - sin(phi) * sin(dec)) / (cos(phi) * cos(dec));
    if (val > 1.0001 || val < -1.0001) return NaN;
    return safeAcos(val);
  }

  // Vinkler for fotografer (i radianer)
  // -0.833° = standard solopgang/nedgang (medregner refraktion og solskivens diameter)
  // -0.3° = solens øverste kant
  // 6° = slutningen af morgenens gyldne time / start på aftenens gyldne time
  // -4° = overgang mellem gylden time og blå time
  // -6° = borgerligt tusmørke (civil twilight)
  // -12° = nautisk tusmørke
  // -18° = astronomisk tusmørke (start/slut på fuldstændigt mørke / stjerneklart)
  var angleDefs = [
    [-0.833 * rad, 'sunrise', 'sunset'],
    [-0.3 * rad, 'sunriseEnd', 'sunsetStart'],
    [-4 * rad, 'blueHourDawnEnd', 'blueHourDuskStart'], // Blå time grænse
    [-6 * rad, 'civilDawn', 'civilDusk'],               // Borgerligt daggry/skumring (og blå time start morgen / slut aften)
    [-12 * rad, 'nauticalDawn', 'nauticalDusk'],         // Nautisk tusmørke
    [-18 * rad, 'astronomicalDawn', 'astronomicalDusk'], // Astronomisk tusmørke (perfekt stjerneklart)
    [6 * rad, 'goldenHourDawnEnd', 'goldenHourDuskStart']// Gylden time grænse opad (solen står lavt på himlen, 0° til +6°)
  ];

  function getSunTimes(date, lat, lng) {
    var lw = rad * -lng,
      phi = rad * lat,
      d = toDays(date),
      n = julianCycle(d, lw),
      ds = approxTransit(0, lw, n),
      M = solarMeanAnomaly(ds),
      L = eclipticLongitude(M),
      dec = declination(L, 0),
      Jnoon = solarTransitJ(ds, M, L),
      i, len, time, h0, Jset, Jrise;

    var result = {
      solarNoon: fromJulian(Jnoon),
      nadir: fromJulian(Jnoon - 0.5)
    };

    for (i = 0, len = angleDefs.length; i < len; i += 1) {
      time = angleDefs[i];
      h0 = time[0];

      var w0 = hourAngle(h0, phi, dec);
      if (isNaN(w0)) {
        result[time[1]] = null;
        result[time[2]] = null;
        continue;
      }

      var a = approxTransit(w0, lw, n);
      Jset = solarTransitJ(a, M, L);
      Jrise = Jnoon - (Jset - Jnoon);

      result[time[1]] = fromJulian(Jrise);
      result[time[2]] = fromJulian(Jset);
    }

    // Fototider:
    // Gylden time morgen: fra solopgang (eller lige før) til solen når +6°
    result.goldenHourMorning = {
      start: result.sunrise || result.civilDawn,
      end: result.goldenHourDawnEnd
    };
    // Gylden time aften: fra solen rammer +6° til solnedgang
    result.goldenHourEvening = {
      start: result.goldenHourDuskStart,
      end: result.sunset || result.civilDusk
    };
    // Blå time morgen: mellem borgerligt daggry (-6°) og gylden time start (-4°)
    result.blueHourMorning = {
      start: result.civilDawn,
      end: result.blueHourDawnEnd || result.sunrise
    };
    // Blå time aften: mellem solnedgang / -4° og -6°
    result.blueHourEvening = {
      start: result.blueHourDuskStart || result.sunset,
      end: result.civilDusk
    };
    // Fuld astronomisk nat (stjerneklart vindue)
    result.nightSky = {
      start: result.astronomicalDusk,
      end: result.astronomicalDawn
    };

    return result;
  }

  function getSunPosition(date, lat, lng) {
    var lw = rad * -lng,
      phi = rad * lat,
      d = toDays(date),
      c = sunCoords(d),
      H = siderealTime(d, lw) - c.ra;

    var az = azimuth(H, phi, c.dec);
    var alt = altitude(H, phi, c.dec);

    // Konverter azimut så 0° = Nord, 90° = Øst, 180° = Syd, 270° = Vest
    var compassAz = (az * deg + 180) % 360;

    return {
      azimuth: compassAz,
      altitude: alt * deg
    };
  }

  // Måne-koordinater og belysning
  function moonCoords(d) {
    var L = rad * (218.316 + 13.176396 * d),
      M = rad * (134.963 + 13.064993 * d),
      F = rad * (93.272 + 13.22935 * d),
      l = L + rad * 6.289 * sin(M),
      b = rad * 5.128 * sin(F),
      dt = 385001 - 20905 * cos(M);

    return {
      ra: rightAscension(l, b),
      dec: declination(l, b),
      dist: dt
    };
  }

  function getMoonIllumination(date) {
    var d = toDays(date),
      s = sunCoords(d),
      m = moonCoords(d),
      sdist = 149598000, // km til solen
      phi = safeAcos(sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra)),
      inc = atan2(sdist * sin(phi), m.dist - sdist * cos(phi)),
      angle = atan2(cos(s.dec) * sin(s.ra - m.ra), sin(s.dec) * cos(m.dec) - cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra));

    var fraction = (1 + cos(inc)) / 2;
    var phase = 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / PI;
    if (phase >= 1) phase -= 1;

    // Fase-beskrivelse på dansk
    var phaseName = 'Nymåne';
    var icon = '🌑';
    if (phase < 0.03 || phase > 0.97) {
      phaseName = 'Nymåne';
      icon = '🌑';
    } else if (phase < 0.22) {
      phaseName = 'Tiltagende månesegl';
      icon = '🌒';
    } else if (phase < 0.28) {
      phaseName = 'Første kvarter';
      icon = '🌓';
    } else if (phase < 0.47) {
      phaseName = 'Tiltagende måne';
      icon = '🌔';
    } else if (phase < 0.53) {
      phaseName = 'Fuldmåne';
      icon = '🌕';
    } else if (phase < 0.72) {
      phaseName = 'Aftagende måne';
      icon = '🌖';
    } else if (phase < 0.78) {
      phaseName = 'Sidste kvarter';
      icon = '🌗';
    } else {
      phaseName = 'Aftagende månesegl';
      icon = '🌘';
    }

    return {
      fraction: Math.round(fraction * 100),
      phase: phase,
      name: phaseName,
      icon: icon
    };
  }

  function getMoonPosition(date, lat, lng) {
    var lw = rad * -lng,
      phi = rad * lat,
      d = toDays(date),
      c = moonCoords(d),
      H = siderealTime(d, lw) - c.ra,
      h = altitude(H, phi, c.dec),
      // parallakse-korrektion
      hCorr = h - rad * 0.017 / tan(h + rad * 10.26 / (h + rad * 5.10));

    var az = azimuth(H, phi, c.dec);
    var compassAz = (az * deg + 180) % 360;

    return {
      azimuth: compassAz,
      altitude: hCorr * deg
    };
  }

  // Måneopgang og månenedgang beregning for et givet døgn
  function getMoonTimes(date, lat, lng) {
    var t = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    var hc = 0.133 * rad;
    var h0 = getMoonPosition(t, lat, lng).altitude * rad - hc;
    var rise = null, set = null;
    var h1, h2, roots, dx;

    // Scan døgnet i 2-timers trin
    for (var i = 1; i <= 24; i += 2) {
      h1 = getMoonPosition(new Date(t.getTime() + i * 3600000), lat, lng).altitude * rad - hc;
      h2 = getMoonPosition(new Date(t.getTime() + (i + 1) * 3600000), lat, lng).altitude * rad - hc;

      var a = (h0 + h2) / 2 - h1;
      var b = (h2 - h0) / 2;
      var xe = -b / (2 * a);
      var ye = (a * xe + b) * xe + h1;
      var d = b * b - 4 * a * h1;
      roots = 0;

      if (d >= 0) {
        dx = Math.sqrt(d) / (Math.abs(a) * 2);
        var r1 = xe - dx;
        var r2 = xe + dx;
        if (Math.abs(r1) <= 1) roots++;
        if (Math.abs(r2) <= 1) roots++;
        if (r1 < -1) r1 = r2;

        if (roots === 1) {
          if (h0 < 0) rise = new Date(t.getTime() + (i + r1) * 3600000);
          else set = new Date(t.getTime() + (i + r1) * 3600000);
        } else if (roots === 2) {
          rise = new Date(t.getTime() + (i + (ye < 0 ? r2 : r1)) * 3600000);
          set = new Date(t.getTime() + (i + (ye < 0 ? r1 : r2)) * 3600000);
        }
      }

      h0 = h2;
    }

    return {
      rise: rise,
      set: set
    };
  }

  // Hjælper til kompasretning i tekst (f.eks. N, NØ, Ø, SØ...)
  function getCompassDirection(azimuthDegrees) {
    var directions = [
      'N', 'NNØ', 'NØ', 'ØNØ',
      'Ø', 'ØSØ', 'SØ', 'SSØ',
      'S', 'SSV', 'SV', 'VSV',
      'V', 'VNV', 'NV', 'NNV'
    ];
    var val = Math.floor((azimuthDegrees / 22.5) + 0.5);
    return directions[val % 16];
  }

  function formatTime(date) {
    if (!date || isNaN(date.getTime())) return '--:--';
    var h = date.getHours().toString().padStart(2, '0');
    var m = date.getMinutes().toString().padStart(2, '0');
    return h + ':' + m;
  }

  return {
    getSunTimes: getSunTimes,
    getSunPosition: getSunPosition,
    getMoonIllumination: getMoonIllumination,
    getMoonPosition: getMoonPosition,
    getMoonTimes: getMoonTimes,
    getCompassDirection: getCompassDirection,
    formatTime: formatTime
  };
});
