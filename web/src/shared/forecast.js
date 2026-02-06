// src/shared/forecast.js
export async function getForecast(resort) {
  // Find resort from local frontend list
  const r = resorts.find((x) => x.name === resort);
  if (!r) throw new Error("Unknown resort");

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${r.lat}&longitude=${r.lon}` +
    `&daily=snowfall_sum,snow_depth,temperature_2m_max,windspeed_10m_max&timezone=auto`;

  const resp = await fetch(url);
  const data = await resp.json();

  const snowDepth = data.daily.snow_depth[1] ?? 0;       // total snow on ground
  const newSnow = data.daily.snowfall_sum[1] ?? 0;       // daily snowfall
  const temp = data.daily.temperature_2m_max[1];
  const wind = data.daily.windspeed_10m_max[1];
  const date = data.daily.time[1];

  const dayOfWeek = new Date(date).toLocaleDateString("en-US", { weekday: "long" });

  return {
    snow: snowDepth,
    newSnow,
    temp,
    wind,
    date,
    dayOfWeek,
    source: "open-meteo"
  };
}
