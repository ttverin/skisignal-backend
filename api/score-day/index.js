const getForecast = require("../shared/forecast");
const scoreDay = require("../shared/scoring");

module.exports = async function (context, req) {
  const resort = req.query.resort || "Zermatt";
  const priority = req.query.priority || "balanced";

  if (!scoreDay.PRIORITIES.includes(priority)) {
    context.res = {
      status: 400,
      body: { error: "priority must be balanced, powder, quiet, or low-wind" }
    };
    return;
  }

  try {
    const forecast = await getForecast(resort);
    const todayScore = scoreDay(forecast.today, priority);
    const tomorrowScore = scoreDay(forecast.tomorrow, priority);

    context.res = {
      status: 200,
      body: {
        resort,
        priority,
        today: { ...forecast.today, ...todayScore },
        tomorrow: { ...forecast.tomorrow, ...tomorrowScore }
      }
    };

  } catch (err) {
    context.res = { status: 500, body: { error: err.message } };
  }
};
