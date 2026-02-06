const resorts = require("./resorts");

let cache = {};

function cacheKey(resort) {
  return resort + new Date().toISOString().slice(0, 13); // hourly cache
}

module.exports = async function getForecast(resort) {
  const key = cacheKey(resort);
  if (cache[key]) return cache[key];

  const r = resorts[resort];
  if (!r) throw new Error("Unknown resort");

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${r.lat}&longitude=${r.lon}` +
    `&daily=snowfall_sum,temperature_2m_max,windspeed_10m_max` +
    `&timezone=auto`;

  const resp = await fetch(url);
  const data = await resp.json();

  // daily snowfall for tomorrow
  const snow = data.daily.snowfall_sum[1] ?? 0;
  const temp = data.daily.temperature_2m_max[1];
  const wind = data.daily.windspeed_10m_max[1];
  const date = data.daily.time[1];

  const dayOfWeek = new Date(date).toLocaleDateString("en-US", { weekday: "long" });

  const result = { snow, temp, wind, date, dayOfWeek, source: "open-meteo" };
  cache[key] = result;
  return result;
};
