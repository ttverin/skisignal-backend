const resorts = require("../shared/resorts");
const getForecast = require("../shared/forecast");
const scoreDay = require("../shared/scoring");
const { compareDays, pickBest } = require("../shared/recommendations");

module.exports = async function (context, req) {
  const priority = req.query.priority || "balanced";
  if (!scoreDay.PRIORITIES.includes(priority)) {
    context.res = {
      status: 400,
      body: { error: "priority must be balanced, powder, quiet, or low-wind" }
    };
    return;
  }

  const names = Object.keys(resorts);

  let forecasts;
  try {
    forecasts = await Promise.all(names.map(r => getForecast(r)));
  } catch (err) {
    context.res = { status: 502, body: { error: err.message } };
    return;
  }

  let all = [];

  for (let i = 0; i < names.length; i++) {
    const resort = names[i];
    const forecast = forecasts[i];

    const todayScore = scoreDay(forecast.today, priority);
    const tomorrowScore = scoreDay(forecast.tomorrow, priority);

    all.push({
      resort,
      today: { ...forecast.today, ...todayScore },
      tomorrow: { ...forecast.tomorrow, ...tomorrowScore }
    });
  }

all.sort((a, b) => compareDays(a.today, b.today));
const bestToday = pickBest(all, "today");
const bestTomorrow = pickBest(all, "tomorrow");

context.res = {
  status: 200,
  body: {
    priority,
    bestToday,
      bestTomorrow,
      all
    }
  };
};
