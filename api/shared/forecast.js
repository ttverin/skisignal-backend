const resorts = require("./resorts");

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
    const slice = arr.slice(start, end).filter(Number.isFinite);
    smoothed.push(slice.length ? slice.reduce((a, b) => a + b, 0) / slice.length : null);
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
    `&daily=snowfall_sum,rain_sum,temperature_2m_max,windspeed_10m_max,wind_gusts_10m_max,precipitation_probability_max` +
    `&hourly=snow_depth` +
    `&timezone=auto`;

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Weather forecast request failed (${resp.status})`);
  }
  const data = await resp.json();

  function requiredNumber(value, field) {
    if (!Number.isFinite(value)) {
      throw new Error(`Weather forecast is missing ${field} for ${resort}`);
    }
    return value;
  }

  function buildDay(dayIndex, hourStart) {
    const date = data.daily?.time?.[dayIndex];
    if (!date) throw new Error(`Weather forecast is missing the date for ${resort}`);

    const freshSnow = requiredNumber(data.daily.snowfall_sum[dayIndex], "snowfall");
    const temp = requiredNumber(data.daily.temperature_2m_max[dayIndex], "temperature");
    const wind = requiredNumber(data.daily.windspeed_10m_max[dayIndex], "wind speed");
    const windGust = requiredNumber(data.daily.wind_gusts_10m_max[dayIndex], "wind gust");
    const rain = requiredNumber(data.daily.rain_sum[dayIndex], "rainfall");
    const hourlySnow = data.hourly.snow_depth ?? [];
    const slice = hourlySnow.slice(hourStart, hourStart + 24);
    if (slice.length === 0) {
      throw new Error(`Weather forecast is missing snow depth for ${resort} on ${date}`);
    }
    const smoothedSnow = smoothArray(slice, 3).filter(Number.isFinite);
    if (smoothedSnow.length === 0) {
      throw new Error(`Weather forecast has no usable snow depth for ${resort} on ${date}`);
    }
    const snowDepth = Math.round(Math.max(...smoothedSnow) * 100);

    const dayOfWeek = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
      weekday: "long",
    });

    return {
      date,
      snow: snowDepth,
      freshSnow: Math.round(freshSnow * 10) / 10,
      temp,
      wind,
      windGust,
      rain: Math.round(rain * 10) / 10,
      precipitationProbability: requiredNumber(
        data.daily.precipitation_probability_max?.[dayIndex],
        "precipitation probability"
      ),
      elevation: requiredNumber(data.elevation, "resort elevation"),
      dayOfWeek,
    };
  }

  const today = buildDay(0, 0);
  const tomorrow = buildDay(1, 24);

  const result = { today, tomorrow };
  cache[key] = result;
  return result;
};
