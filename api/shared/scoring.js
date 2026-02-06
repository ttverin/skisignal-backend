module.exports = function scoreDay({ freshSnow, snowDepth, temp, wind, dayOfWeek }) {
  // Snow score based on snow depth (meters) + fresh snow
  let snowScore = Math.min(60, Math.round(snowDepth * 60)); 

  if (freshSnow > 0.2) snowScore += 20;
  else if (freshSnow > 0.1) snowScore += 10;

  // Temperature effect
  if (temp < -5) snowScore += 10;
  else if (temp > 5) snowScore -= 10;

  // Wind effect
  if (wind > 60) snowScore -= 15;
  else if (wind > 40) snowScore -= 5;

  // Cap snowScore
  snowScore = Math.max(0, Math.min(100, snowScore));

  // Crowd score: weekends + popular snow days
  let crowdScore = 0;
  if (["Saturday", "Sunday"].includes(dayOfWeek)) crowdScore += 30;
  if (freshSnow > 0.1 || snowDepth > 0.5) crowdScore += 20; // popular snow

  crowdScore = Math.min(100, crowdScore);

  // Verdict
  let verdict = "SKIP";
  if (snowScore >= 50 && wind < 60) verdict = "GO";
  else if (snowScore >= 30) verdict = "MEH";

  return { snowScore, crowdScore, verdict };
};
