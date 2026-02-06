const resorts = require("../shared/resorts");
const images = require("../shared/images");
const getForecast = require("../shared/forecast");
const scoreDay = require("../shared/scoring");
const { calculateSlope } = require("../shared/scoring");

module.exports = async function (context) {
  let results = [];

  for (const resort of Object.keys(resorts)) {
    const forecast = await getForecast(resort);
    const scores = scoreDay(forecast);

    results.push({
      resort,
      ...forecast,
      ...scores,
      img: images[resort] || "",
      slopeCondition: calculateSlope(forecast)
    });
  }

  results.sort((a, b) => b.snowScore - a.snowScore);

  context.res = {
    status: 200,
    body: {
      best: results[0],
      all: results
    }
  };
};
