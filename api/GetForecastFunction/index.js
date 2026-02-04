module.exports = async function (context, req) {
  const resort = req.query.resort || "Zermatt";

  const latitude = 46.0207;
  const longitude = 7.7491;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=snowfall_sum&timezone=Europe/Zurich`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Tomorrow
    const snow = data.daily.snowfall_sum[1] ?? 0;
    const date = data.daily.time[1];

    const dayOfWeek = new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
    });

    context.res = {
      status: 200,
      body: {
        resort,
        snow,
        date,
        dayOfWeek,
        source: "open-meteo",
      },
    };
  } catch (err) {
    context.log.error("Open-Meteo error:", err);
    context.res = {
      status: 500,
      body: { error: "Failed to fetch weather data" },
    };
  }
};
