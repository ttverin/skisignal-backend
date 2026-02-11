const resorts = require("./resorts");

let cache = {};

function cacheKey(resort) {
  return resort + new Date().toISOString().slice(0, 13);
}

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

    // Realistic conversion: 1 mm water ~ 1.5 cm snow
    const freshSnow = (data.daily.snowfall_sum[dayIndex] ?? 0) * 1.5;

    const hourlySnow = data.hourly.snow_depth ?? [];
    let snowDepth = 0;

    if (hourlySnow.length >= hourStart + 24) {
      const slice = hourlySnow.slice(hourStart, hourStart + 24).map(v => v ?? 0);
      const smoothed = smoothArray(slice, 3);
      snowDepth = Math.max(...smoothed);
    } else if (hourlySnow.length > 0) {
      snowDepth = hourlySnow[hourlySnow.length - 1] + freshSnow;
    } else {
      snowDepth = freshSnow;
    }

    const dayOfWeek = new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
    });

    return {
      snow: Math.round(snowDepth),       // cm, no crazy *100
      freshSnow: Math.round(freshSnow),  // realistic cm
      temp,
      wind,
      dayOfWeek,
    };
  }

  const today = buildDay(0, 0);
  const tomorrow = buildDay(1, 24);

  const result = { today, tomorrow };
  cache[key] = result;
  return result;
};
