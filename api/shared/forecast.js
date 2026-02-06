const url =
  `https://api.open-meteo.com/v1/forecast?latitude=${r.lat}&longitude=${r.lon}` +
  `&daily=snowfall_sum,snow_depth,temperature_2m_max,windspeed_10m_max` +
  `&timezone=auto`;

const resp = await fetch(url);
const data = await resp.json();

const snowfall = data.daily.snowfall_sum[1] ?? 0;
const baseSnow = data.daily.snow_depth[1] ?? 0;
const temp = data.daily.temperature_2m_max[1];
const wind = data.daily.windspeed_10m_max[1];
const date = data.daily.time[1];

const result = {
  snowfall,
  baseSnow,
  temp,
  wind,
  date,
  dayOfWeek,
  source: "open-meteo"
};
