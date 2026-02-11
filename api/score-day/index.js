const getForecast = require("../shared/forecast");
const scoreDay = require("../shared/scoring");

module.exports = async function (context, req) {
  const resort = req.query.resort || "Zermatt";

  try {
    const forecast = await getForecast(resort);
    const todayScore = scoreDay(forecast.today);
    const tomorrowScore = scoreDay(forecast.tomorrow);

    context.res = {
      status: 200,
      body: {
        resort,
        today: { ...forecast.today, ...todayScore },
        tomorrow: { ...forecast.tomorrow, ...tomorrowScore }
      }
    };

  } catch (err) {
    context.res = { status: 500, body: { error: err.message } };
  }
};

