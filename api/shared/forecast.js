const resorts = require("./resorts");

let cache = {};

function cacheKey(resort) {
  return resort + new Date().toISOString().slice(0, 13);
}

// Snow smoothing helper (optional)
function smoothArray(arr, window = 3) {
  const smoothed = [];
  for (let i = 0; i < arr.length; i++) {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end = Math.min(arr.length, i + Math.floor(window / 2) + 1);
    const vals = arr.slice(start, end).map(v => v ?? 0);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    smoothed.push(avg);
  }
  return smoothed;
}

// Scoring logic
function computeScore({ snow, freshSnow, temp, wind }) {
  let score = 0;

  // Snow depth
  if (snow > 150) score += 40;
  else if (snow > 100) score += 30;
  else if (snow > 50) score += 20;
  else if (snow > 20) score += 10;
  else score -= 20; // very thin

  // Fresh snow
  if (freshSnow > 50) score += 20;
  else if (freshSnow > 20) score += 10;

  // Temperature
  if (temp >= -5 && temp <= 2) score += 10; // ideal skiing temp
  else if (temp > 5 || temp < -10) score -= 10;

  // Wind penalty
  if (wind > 50) score -= 20;
  else if (wind > 30) score -= 10;

  return score;
}

// Convert score to verdict and reasons
function verdictFromScore(score, snow, freshSnow, temp, wind) {
  const reasons = [];

  if (freshSnow > 50) reasons.push("deep powder");
  else if (freshSnow > 10) reasons.push("fresh snow");

  if (snow < 20) reasons.push("thin cover");
  if (temp > 5) reasons.push("warm");
  if (wind > 30) reasons.push("windy");
  if (wind > 50) reasons.push("storm day");

  let verdict = "SKIP";
  if (score >= 70) verdict = "GO";
  else if (score >= 50) verdict = "MEH";

  return { verdict, reasons };
}

module.exports = async function getForecast(resort) {
  const key = cacheKey(resort);
  if (cache[key]) return cache[key];

  const r = resorts[resort];
  if (!r) throw new Error("Unknown resort");

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${r.lat}&longitude=${r.lon}` +
    `&daily=snowfall_sum,temperature_2m_max,windspeed_10m_max` +
    `&hourly=snow_depth` +
    `&timezone=auto`;

  const resp = await fetch(url);
  const data = await resp.json();

  function buildDay(dayIndex, hourStart) {
    const temp = data.daily.temperature_2m_max[dayIndex];
    const wind = data.daily.windspeed_10m_max[dayIndex];
    const date = data.daily.time[dayIndex];

    const freshSnow = Math.round((data.daily.snowfall_sum[dayIndex] ?? 0) * 1.2);

    const hourlySnow = data.hourly.snow_depth ?? [];
    let snowDepth = 0;

    if (hourlySnow.length > 0) {
      const slice = hourlySnow.slice(hourStart, hourStart + 24);
      snowDepth = Math.max(...slice.map(v => v ?? 0));
    }

    const dayOfWeek = new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
    });

    const score = computeScore({ snow: snowDepth, freshSnow, temp, wind });
    const { verdict, reasons } = verdictFromScore(score, snowDepth, freshSnow, temp, wind);

    return {
      snow: Math.round(snowDepth),
      freshSnow,
      temp,
      wind,
      dayOfWeek,
      score,
      crowdScore: 15, // keep your original
      verdict,
      reasons,
    };
  }

  const today = buildDay(0, 0);
  const tomorrow = buildDay(1, 24);

  const result = { today, tomorrow };
  cache[key] = result;
  return result;
};
