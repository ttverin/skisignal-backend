module.exports = function scoreDay({ snow, freshSnow, temp, wind, dayOfWeek }) {
  let score = 0;
  let reasons = [];

  // -----------------------
  // 1. Fresh snow (MAIN DRIVER)
  // -----------------------
  if (freshSnow > 60) {
    score += 60;
    reasons.push("deep powder");
  } else if (freshSnow > 30) {
    score += 45;
    reasons.push("powder");
  } else if (freshSnow > 15) {
    score += 30;
    reasons.push("fresh snow");
  } else if (freshSnow > 5) {
    score += 15;
    reasons.push("dusting");
  }

  // -----------------------
  // 2. Base depth
  // -----------------------
  if (snow > 150) score += 20;
  else if (snow > 80) score += 15;
  else if (snow > 40) score += 10;
  else if (snow < 20) {
    score -= 20;
    reasons.push("thin cover");
  }

  // -----------------------
  // 3. Temperature quality
  // -----------------------
  if (temp <= -8) {
    score += 10;
    reasons.push("cold smoke");
  } else if (temp <= -2) {
    score += 5;
  } else if (temp > 3) {
    score -= 10;
    reasons.push("warm");
  } else if (temp > 7) {
    score -= 25;
    reasons.push("slushy");
  }

  // -----------------------
  // 4. Wind (huge factor)
  // -----------------------
  if (wind > 80) {
    score -= 50;
    reasons.push("lifts closed");
  } else if (wind > 60) {
    score -= 30;
    reasons.push("wind holds");
  } else if (wind > 40) {
    score -= 15;
    reasons.push("windy");
  }

  // -----------------------
  // 5. Crowds
  // -----------------------
  let crowdScore = 0;

  if (["Saturday", "Sunday"].includes(dayOfWeek)) {
    crowdScore += 25;
    score -= 10;
  }

  if (freshSnow > 30) {
    crowdScore += 15;
    score -= 5;
  }

  // -----------------------
  // 6. Storm skiing bonus
  // -----------------------
  if (freshSnow > 40 && wind < 50) {
    score += 10;
    reasons.push("storm day");
  }

  // -----------------------
  // FINAL VERDICT
  // -----------------------
  let verdict = "SKIP";

  if (score >= 80) verdict = "GO";
  else if (score >= 55) verdict = "GO (storm)";
  else if (score >= 35) verdict = "MEH";
  else verdict = "SKIP";

  return {
    score,
    crowdScore,
    verdict,
    reasons,
  };
};
