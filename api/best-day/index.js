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

function verdictRank(v) {
  if (v === "GO") return 3;
  if (v === "GO (storm)") return 2;
  if (v === "MEH") return 1;
  return 0;
}

function pickBest(all, dayKey) {
  return [...all]
    .map(r => ({ resort: r.resort, ...r[dayKey] }))
    .sort((a, b) => {
      // verdict priority
      const vDiff = verdictRank(b.verdict) - verdictRank(a.verdict);
      if (vDiff !== 0) return vDiff;

      // main score
      if (b.score !== a.score) return b.score - a.score;

      // powder tie-break
      return (b.freshSnow ?? 0) - (a.freshSnow ?? 0);
    })[0];
}

const bestToday = pickBest(all, "today");
const bestTomorrow = pickBest(all, "tomorrow");

  context.res = {
    status: 200,
    body: {
      bestToday,
      bestTomorrow,
      all
    }
  };
};
