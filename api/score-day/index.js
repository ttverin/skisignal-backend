const resorts = require("../shared/resorts");
const images = require("../shared/images");
const getForecast = require("../shared/forecast");
const scoreDay = require("../shared/scoring");
const { calculateSlope } = require("../shared/scoring");

module.exports = async function (context, req) {
  const resort = req.query.resort;
  if (!resort || !resorts[resort]) {
    context.res = {
      status: 400,
      body: { error: "Unknown or missing resort" }
    };
    return;
  }

  try {
    const forecast = await getForecast(resort);
    const scores = scoreDay(forecast);
    const slopeCondition = calculateSlope(forecast);
    const img = images[resort] || "";

    context.res = {
      status: 200,
      body: {
        resort,
        ...forecast,
        ...scores,
        slopeCondition,
        img
      }
    };
  } catch (err) {
    context.res = {
      status: 500,
      body: { error: "Failed to fetch forecast", details: err.message }
    };
  }
};
