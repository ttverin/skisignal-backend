module.exports = async function (context, req) {
    context.log('ScoreDayFunction triggered');

    const { snow, dayOfWeek } = req.body || {};

    if (snow === undefined || dayOfWeek === undefined) {
        context.res = { status: 400, body: { error: "snow and dayOfWeek required" } };
        return;
    }

    // Snow score
    let snowScore = 0;
    if (snow > 10) snowScore += 40;
    if (snow > 5) snowScore += 20;
    if (snow <= 5) snowScore += 10;

    // Crowd score (lower is better)
    let crowdScore = 50;
    if (dayOfWeek >= 5) crowdScore += 20; // weekend
    else crowdScore += 10;

    // Verdict
    let verdict = "SKIP";
    if (snowScore > 60 && crowdScore < 50) verdict = "GO";
    else if (snowScore > 40) verdict = "MEH";

    context.res = {
        status: 200,
        body: { snowScore, crowdScore, verdict }
    };
};
