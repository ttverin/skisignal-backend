const getForecast = require("../shared/forecast");
const scoreDay = require("../shared/scoring");

module.exports = async function (context, req) {
  const resort = req.query.resort || "Zermatt";

  try {
    const forecast = await getForecast(resort);
    const scores = scoreDay(forecast);

    context.res = {
      status: 200,
      body: {
        resort,
        ...forecast,
        ...scores 
      }
    };
  } catch (err) {
    context.res = { status: 500, body: { error: err.message } };
  }
};

