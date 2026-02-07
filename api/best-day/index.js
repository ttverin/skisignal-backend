const resorts = require("../shared/resorts");
const getForecast = require("../shared/forecast");
const scoreDay = require("../shared/scoring");

module.exports = async function (context) {
  const names = Object.keys(resorts);

  const forecasts = await Promise.all(names.map(r => getForecast(r)));

  let all = [];

  for (let i = 0; i < names.length; i++) {
    const resort = names[i];
    const forecast = forecasts[i];

    const todayScore = scoreDay(forecast.today);
    const tomorrowScore = scoreDay(forecast.tomorrow);

    all.push({
      resort,
      today: { ...forecast.today, ...todayScore },
      tomorrow: { ...forecast.tomorrow, ...tomorrowScore }
    });
  }

  const bestToday = [...all]
    .map(r => ({ resort: r.resort, ...r.today }))
    .sort((a, b) => b.snowScore - a.snowScore)[0];

  const bestTomorrow = [...all]
    .map(r => ({ resort: r.resort, ...r.tomorrow }))
    .sort((a, b) => b.snowScore - a.snowScore)[0];

  context.res = {
    status: 200,
    body: {
      bestToday,
      bestTomorrow,
      all
    }
  };
};
