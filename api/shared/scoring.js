module.exports = function scoreDay({ snow, freshSnow, temp, wind, dayOfWeek }) {
  let score = 0;
  let reasons = [];

  // -----------------------
  // 1. Fresh snow (MAIN DRIVER)
  // -----------------------
  if (freshSnow > 30) {
    score += 40;
    reasons.push("powder");
  } else if (freshSnow > 15) {
    score += 25;
    reasons.push("fresh snow");
  } else if (freshSnow > 5) {
    score += 10;
    reasons.push("dusting");
  } else if (freshSnow > 0) {
    score += 5;
    reasons.push("light dusting");
  }

  // -----------------------
  // 2. Base depth
  // -----------------------
  if (snow > 150) {
    score += 25;
    reasons.push("deep base");
  } else if (snow > 100) {
    score += 20;
    reasons.push("good base");
  } else if (snow > 50) {
    score += 10;
    reasons.push("moderate base");
  } else if (snow < 20) {
    score -= 15;
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
  } else if (temp > 5) {
    score -= 5;
    reasons.push("warm");
  }

  // -----------------------
  // 4. Wind
  // -----------------------
  if (wind > 80) {
    score -= 40;
    reasons.push("lifts closed");
  } else if (wind > 60) {
    score -= 20;
    reasons.push("wind holds");
  } else if (wind > 40) {
    score -= 10;
    reasons.push("windy");
  }

  // -----------------------
  // 5. Crowds
  // -----------------------
  let crowdScore = 0;
  if (["Saturday", "Sunday"].includes(dayOfWeek)) {
    crowdScore += 20;
    score -= 5;
  }

  if (freshSnow > 20) {
    crowdScore += 10;
    score -= 5;
  }

  // -----------------------
  // 6. Storm skiing bonus
  // -----------------------
  if (freshSnow > 30 && wind < 50) {
    score += 10;
    reasons.push("storm day");
  }

  // -----------------------
  // FINAL VERDICT
  // -----------------------
  let verdict = "SKIP";
  if (score >= 21) verdict = "GO";
  else if (score >= 15) verdict = "MEH";

  return {
    score,
    crowdScore,
    verdict,
    reasons,
  };
};
