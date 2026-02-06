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

// Scoring function
function scoreDay({ freshSnow, snowDepth, temp, wind, dayOfWeek }) {
  let snowScore = Math.min(60, Math.round(snowDepth * 60)); // snowDepth in meters

  // freshSnow bonus (meters)
  if (freshSnow > 0.2) snowScore += 20;
  else if (freshSnow > 0.1) snowScore += 10;

  // Temperature effect
  if (temp < -5) snowScore += 10;
  else if (temp > 5) snowScore -= 10;

  // Wind effect
  if (wind > 60) snowScore -= 15;
  else if (wind > 40) snowScore -= 5;

  snowScore = Math.max(0, Math.min(100, snowScore));

  // Crowd score
  let crowdScore = 0;
  if (["Saturday", "Sunday"].includes(dayOfWeek)) crowdScore += 30;
  if (freshSnow > 0.1 || snowDepth > 0.5) crowdScore += 20;
  crowdScore = Math.min(100, crowdScore);

  // Verdict
  let verdict = "SKIP";
  if (snowScore >= 50 && wind < 60) verdict = "GO";
  else if (snowScore >= 30) verdict = "MEH";

  return { snowScore, crowdScore, verdict };
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

  // Fresh snowfall tomorrow (meters)
  const freshSnow = data.daily.snowfall_sum[1] ?? 0;

  // Temperature & wind tomorrow
  const temp = data.daily.temperature_2m_max[1];
  const wind = data.daily.windspeed_10m_max[1];
  const date = data.daily.time[1];

  // Compute smoothed max snow depth tomorrow
  const hourlySnow = data.hourly.snow_depth ?? [];
  let snowDepth = 0;

  if (hourlySnow.length >= 48) {
    const tomorrowSnow = hourlySnow.slice(24, 48).map(v => v ?? 0);
    const smoothed = smoothArray(tomorrowSnow, 3);
    snowDepth = Math.max(...smoothed);
  } else if (hourlySnow.length >= 24) {
    const lastTodaySnow = hourlySnow[23] ?? 0;
    snowDepth = lastTodaySnow + freshSnow;
  } else if (hourlySnow.length > 0) {
    snowDepth = hourlySnow[hourlySnow.length - 1] + freshSnow;
  } else {
    snowDepth = freshSnow;
  }

  const dayOfWeek = new Date(date).toLocaleDateString("en-US", { weekday: "long" });

  // Scoring
  const { snowScore, crowdScore, verdict } = scoreDay({
    freshSnow,
    snowDepth,
    temp,
    wind,
    dayOfWeek,
  });

  // Return unified object
  const result = {
    resort,
    snow: Math.round(snowDepth * 100),      // total snow in cm for UI
    freshSnow: Math.round(freshSnow * 100), // fresh snow in cm
    temp,
    wind,
    dayOfWeek,
    snowScore,
    crowdScore,
    verdict,
  };

  cache[key] = result;
  return result;
};
