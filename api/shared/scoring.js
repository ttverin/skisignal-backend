module.exports = function scoreDay({
  snowfall,
  baseSnow,
  temp,
  wind,
  weathercode
}) {
  let score = 0;

  //
  // BASE SNOW DEPTH (most important)
  //
  if (baseSnow > 250) score += 60;
  else if (baseSnow > 180) score += 50;
  else if (baseSnow > 120) score += 40;
  else if (baseSnow > 80) score += 25;
  else if (baseSnow > 40) score += 10;
  else score -= 20;

  //
  // NEW SNOW BONUS
  //
  if (snowfall > 30) score += 50;
  else if (snowfall > 20) score += 35;
  else if (snowfall > 10) score += 20;
  else if (snowfall > 5) score += 10;

  //
  // TEMPERATURE
  //
  if (temp < -8) score += 15;        // powder stays good
  else if (temp < -2) score += 10;
  else if (temp > 5) score -= 20;
  else if (temp > 10) score -= 40;

  //
  // WIND
  //
  if (wind > 90) score -= 60;
  else if (wind > 70) score -= 40;
  else if (wind > 50) score -= 25;
  else if (wind > 30) score -= 10;

  //
  // WEATHER (sun bonus)
  //
  if (weathercode === 0) score += 10; // clear sky

  //
  // SLOPE CONDITION %
  //
  let slopeCondition = 0;

  if (baseSnow > 200) slopeCondition = 95;
  else if (baseSnow > 150) slopeCondition = 90;
  else if (baseSnow > 100) slopeCondition = 80;
  else if (baseSnow > 60) slopeCondition = 65;
  else if (baseSnow > 30) slopeCondition = 45;
  else slopeCondition = 20;

  // warm damage
  if (temp > 6) slopeCondition -= 20;
  if (temp > 10) slopeCondition -= 30;

  // wind damage
  if (wind > 70) slopeCondition -= 20;

  slopeCondition = Math.max(0, Math.min(100, slopeCondition));

  //
  // VERDICT
  //
  let verdict = "SKIP";
  if (score > 80) verdict = "GO";
  else if (score > 50) verdict = "MEH";

  return {
    snowScore: Math.round(score),
    slopeCondition: Math.round(slopeCondition),
    verdict
  };
};
