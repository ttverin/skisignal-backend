// simple snow and crowd scoring
module.exports = function scoreDay({ snow, temp, wind, dayOfWeek }) {
  let snowScore = 0;

  if (snow > 20) snowScore += 50;
  else if (snow > 10) snowScore += 35;
  else if (snow > 5) snowScore += 20;
  else if (snow > 0) snowScore += 10;

  if (temp < -5) snowScore += 10;
  if (temp > 5) snowScore -= 15;
  if (wind > 60) snowScore -= 20;

  let crowdScore = 0;
  if (["Saturday", "Sunday"].includes(dayOfWeek)) crowdScore += 40;
  if (snow > 15) crowdScore += 20;

  let verdict = "SKIP";
  if (snowScore > 60 && wind < 60) verdict = "GO";
  else if (snowScore > 35) verdict = "MEH";

  return { snowScore, crowdScore, verdict };
};

// slopeCondition: 0-100, higher = better slopes
module.exports.calculateSlope = function({ snow, temp, wind }) {
  let score = 0;
  score += snow * 2;
  score += Math.max(0, 5 - temp) * 5;
  score -= wind * 0.5;
  return Math.max(0, Math.min(100, Math.round(score)));
};
