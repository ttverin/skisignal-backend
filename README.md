# skisignal-backend

SkiSignal ranks resort forecasts for today and tomorrow using snowfall, snow depth, temperature, wind gusts, rain, and a crowd-pressure estimate.

## Recommendation priorities

The `/api/best-day` and `/api/score-day` endpoints accept a `priority` query parameter:

- `balanced` (default)
- `powder`
- `low-wind`
- `quiet`

The result includes a score and the reasons that affected it. If every resort scores below the recommendation threshold, `bestToday` or `bestTomorrow` is `null`. Snowfall values use Open-Meteo's centimeter units; rain is reported in millimeters. Elevation is the forecast grid elevation at the resort coordinate, not a model of every run or lift.

Crowd pressure is only a proxy based on weekends and fresh-snow demand. There is no live lift-closure feed or resort-wide observation integration.

## Condition feedback

The web app can submit a `poor`, `mixed`, or `good` condition rating to `/api/feedback`. The function stores the rating alongside the forecast inputs in the `ConditionFeedback` Azure Table, using the Function App's existing `AzureWebJobsStorage` setting. Feedback is collected for later scoring calibration; scores do not change automatically based on individual submissions.

## Development

Run API unit tests with `npm --prefix api test`. The Functions app and deployment workflow use Node.js 22.