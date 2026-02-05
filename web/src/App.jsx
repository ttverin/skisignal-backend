import { useEffect, useState } from "react";

const API = "https://skisignal-dev-api.azurewebsites.net/api";

const RESORTS = [
  "Zermatt",
  "Verbier",
  "Chamonix",
  "St Anton",
  "Val Thorens",
  "Laax",
  "Cortina",
  "Whistler"
];

export default function App() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [best, setBest] = useState(null);

  async function fetchScores() {
    setLoading(true);

    const results = {};

    for (const resort of RESORTS) {
      try {
        const res = await fetch(`${API}/score-day?resort=${encodeURIComponent(resort)}`);
        const json = await res.json();
        results[resort] = json;
      } catch (e) {
        results[resort] = { error: true };
      }
    }

    setData(results);
    setLoading(false);

    // pick best
    let bestResort = null;
    let bestScore = -1;

    Object.values(results).forEach(r => {
      if (!r || r.error) return;
      if (r.snowScore > bestScore) {
        bestScore = r.snowScore;
        bestResort = r;
      }
    });

    setBest(bestResort);
  }

  useEffect(() => {
    fetchScores();
  }, []);

  function verdictColor(v) {
    if (v === "GO") return "#22c55e";
    if (v === "MEH") return "#eab308";
    return "#ef4444";
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🎿 SkiSignal</h1>

      {best && (
        <div style={styles.bestCard}>
          <h2>🏆 Best resort today</h2>
          <h1>{best.resort}</h1>
          <h2 style={{ color: verdictColor(best.verdict) }}>{best.verdict}</h2>
          <p>{best.snow} cm snow</p>
        </div>
      )}

      <button onClick={fetchScores} style={styles.button}>
        Refresh
      </button>

      {loading && <p>Loading snow data...</p>}

      <div style={styles.grid}>
        {RESORTS.map(r => {
          const d = data[r];
          if (!d) return null;

          return (
            <div key={r} style={styles.card}>
              <h2>{r}</h2>

              {d.error && <p>error</p>}

              {!d.error && (
                <>
                  <p>{d.snow} cm</p>
                  <p>{d.dayOfWeek}</p>

                  <div
                    style={{
                      ...styles.verdict,
                      background: verdictColor(d.verdict)
                    }}
                  >
                    {d.verdict}
                  </div>

                  <p>snow score: {d.snowScore}</p>
                  <p>crowd: {d.crowdScore}</p>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  page: {
    fontFamily: "sans-serif",
    padding: 30,
    background: "#0f172a",
    color: "white",
    minHeight: "100vh"
  },
  title: {
    fontSize: 42
  },
  bestCard: {
    background: "#1e293b",
    padding: 20,
    borderRadius: 12,
    marginBottom: 30
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: 16
  },
  card: {
    background: "#1e293b",
    padding: 16,
    borderRadius: 12
  },
  verdict: {
    padding: "6px 10px",
    borderRadius: 8,
    display: "inline-block",
    marginTop: 6
  },
  button: {
    marginBottom: 20,
    padding: "10px 16px",
    borderRadius: 8,
    border: "none",
    background: "#38bdf8",
    cursor: "pointer"
  }
};
