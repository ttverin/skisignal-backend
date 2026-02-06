const resorts = require("./resorts");

let cache = {};

function cacheKey(resort) {
  return resort + new Date().toISOString().slice(0, 13); // hourly cache
}

// Simple moving average smoothing
function smoothArray(arr, window = 3) {
  const smoothed = [];
  for (let i = 0; i < arr.length; i++) {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end = Math.min(arr.length, i + Math.floor(window / 2) + 1);
    const windowValues = arr.slice(start, end).map(v => v ?? 0);
    const avg = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
    smoothed.push(avg);
  }
  return smoothed;
}

module.exports = async function getForecast(resort) {
  const key = cacheKey(resort);
  if (cache[key]) return cache[key];

  const r = resorts[resort];
  if (!r) throw new Error("Unknown resort");

  // Fetch both daily and hourly parameters
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${r.lat}&longitude=${r.lon}` +
    `&daily=snowfall_sum,temperature_2m_max,windspeed_10m_max` +
    `&hourly=snow_depth` +
    `&timezone=auto`;

  const resp = await fetch(url);
  const data = await resp.json();

  // Fresh snowfall for tomorrow
  const freshSnow = data.daily.snowfall_sum[1] ?? 0;

  // Daily max temperature & wind for tomorrow
  const temp = data.daily.temperature_2m_max[1];
  const wind = data.daily.windspeed_10m_max[1];
  const date = data.daily.time[1];

  // Compute snow depth
  const hourlySnow = data.hourly.snow_depth ?? [];
  let snowDepth = 0;

  if (hourlySnow.length >= 48) {
    // Use hours 24-47 as tomorrow's snow depth
    const tomorrowSnow = hourlySnow.slice(24, 48).map(v => v ?? 0);

    // Smooth the values to remove spikes
    const smoothed = smoothArray(tomorrowSnow, 3);

    // Take the maximum after smoothing
    snowDepth = Math.max(...smoothed);
  } else if (hourlySnow.length >= 24) {
    const lastTodaySnow = hourlySnow[23] ?? 0;
    snowDepth = lastTodaySnow + freshSnow;
  } else if (hourlySnow.length > 0) {
    snowDepth = hourlySnow[hourlySnow.length - 1] + freshSnow;
  } else {
    snowDepth = freshSnow;
  }

  const dayOfWeek = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
  });

  const result = {
    freshSnow,
    snowDepth,
    temp,
    wind,
    date,
    dayOfWeek,
    source: "open-meteo",
  };

  cache[key] = result;
  return result;
};
