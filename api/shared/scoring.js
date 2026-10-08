const PRIORITIES = {
  balanced: {
    weekendCrowdPenalty: 5,
    powderCrowdPenalty: 5,
    powderBonus: 0,
    windSensitivity: 1
  },
  powder: {
    weekendCrowdPenalty: 2,
    powderCrowdPenalty: 2,
    powderBonus: 0.75,
    windSensitivity: 1
  },
  quiet: {
    weekendCrowdPenalty: 12,
    powderCrowdPenalty: 8,
    powderBonus: 0,
    windSensitivity: 1
  },
  "low-wind": {
    weekendCrowdPenalty: 5,
    powderCrowdPenalty: 5,
    powderBonus: 0,
    windSensitivity: 1.5
  }
};

function getPriority(priority) {
  if (!Object.hasOwn(PRIORITIES, priority)) {
    throw new Error(`Unknown priority: ${priority}`);
  }
  return PRIORITIES[priority];
}

module.exports = function scoreDay({
  snow,
  freshSnow,
  temp,
  wind,
  windGust = wind,
  rain = 0,
  dayOfWeek
}, priority = "balanced") {
  const preferences = getPriority(priority);
  let score = 0;
  const reasons = [];

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

  if (temp <= -8) {
    score += 10;
    reasons.push("cold snow");
  } else if (temp <= -2) {
    score += 5;
  } else if (temp > 5) {
    score -= 5;
    reasons.push("warm");
  }

  const effectiveWind = Math.max(wind, windGust * 0.75);
  if (effectiveWind > 80) {
    score -= 40;
    reasons.push("very high wind risk");
  } else if (effectiveWind > 60) {
    score -= 20;
    reasons.push("strong wind");
  } else if (effectiveWind > 40) {
    score -= 10;
    reasons.push("windy");
  }

  if (preferences.windSensitivity > 1 && effectiveWind > 25) {
    score -= Math.min(12, Math.round((effectiveWind - 25) * (preferences.windSensitivity - 1) * 0.5));
    reasons.push("wind-sensitive priority");
  }

  if (rain > 10 && temp > 0) {
    score -= 10;
    reasons.push("rain likely");
  }

  const isWeekend = ["Saturday", "Sunday"].includes(dayOfWeek);
  const crowdScore = (isWeekend ? 20 : 0) + (freshSnow > 20 ? 10 : 0);
  if (isWeekend) {
    score -= preferences.weekendCrowdPenalty;
    reasons.push("weekend crowd estimate");
  }
  if (freshSnow > 20) {
    score -= preferences.powderCrowdPenalty;
    reasons.push("powder-day crowd estimate");
  }

  if (preferences.powderBonus > 0 && freshSnow > 5) {
    score += Math.min(20, Math.round(freshSnow * preferences.powderBonus));
    reasons.push("powder priority");
  }

  if (freshSnow > 30 && effectiveWind < 50) {
    score += 10;
    reasons.push("storm day");
  }

  let verdict = "SKIP";
  if (score >= 21) verdict = "GO";
  else if (score >= 15) verdict = "MEH";

  return { score, crowdScore, verdict, reasons };
};

module.exports.PRIORITIES = Object.keys(PRIORITIES);
