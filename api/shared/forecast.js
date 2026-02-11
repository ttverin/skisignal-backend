const resorts = require("./resorts");
const scoreDay = require("../shared/scoring");

let cache = {};

// Cache key by resort + current hour
function cacheKey(resort) {
  return resort + new Date().toISOString().slice(0, 13);
}

// Simple moving average smoothing
function smoothArray(arr, window = 3) {
  const smoothed = [];
  for (let i = 0; i < arr.length; i++) {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end = Math.min(arr.length, i + Math.floor(window / 2) + 1);
    const slice = arr.slice(start, end).map(v => v ?? 0);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    smoothed.push(avg);
  }
  return smoothed;
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

    // Fresh snow from daily snowfall_sum (mm -> cm)
    const freshSnow = Math.round((data.daily.snowfall_sum[dayIndex] ?? 0) / 10);

    // Snow from hourly snow depth (m -> cm)
    let snowDepth = freshSnow;
    const hourlySnow = data.hourly.snow_depth ?? [];
    if (hourlySnow.length > 0) {
      const slice = hourlySnow.slice(hourStart, hourStart + 24);
      const smoothed = smoothArray(slice, 3);
      snowDepth = Math.round(Math.max(...smoothed) * 100); // meters -> cm
    }

    const dayOfWeek = new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
    });

    // Use shared scoring logic
    const scoring = scoreDay({ snow: snowDepth, freshSnow, temp, wind, dayOfWeek });

    return {
      snow: snowDepth,
      freshSnow,
      temp,
      wind,
      dayOfWeek,
      ...scoring,
    };
  }

  const today = buildDay(0, 0);
  const tomorrow = buildDay(1, 24);

  const result = { today, tomorrow };
  cache[key] = result;
  return result;
};
