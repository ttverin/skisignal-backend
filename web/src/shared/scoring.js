// src/shared/scoring.js
export function snowScore({ snow, temp, wind }) {
  let score = 0;
  if (snow > 100) score += 50;
  else if (snow > 50) score += 35;
  else if (snow > 20) score += 20;
  else if (snow > 0) score += 10;

  if (temp < -5) score += 10;
  if (temp > 5) score -= 15;
  if (wind > 60) score -= 20;

  return Math.max(0, score);
}

export function slopeCondition({ snow, temp, wind }) {
  // More intuitive: total snow + temp + wind
  let score = 0;
  score += Math.min(snow, 100) * 0.5;   // heavier snow = higher score
  score += Math.max(0, 5 - temp) * 5;    // cold is better, but not extreme
  score -= wind * 0.5;                   // high wind reduces score

  score = Math.max(0, Math.min(100, Math.round(score)));
  return score;
}
