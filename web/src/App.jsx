import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import "leaflet/dist/leaflet.css";

// Resorts with coordinates
const RESORTS = [
  { name: "Zermatt", lat: 46.0207, lon: 7.7491 },
  { name: "Verbier", lat: 46.096, lon: 7.228 },
  { name: "Chamonix", lat: 45.9237, lon: 6.8694 },
  { name: "StAnton", lat: 47.128, lon: 10.263 },
  { name: "Whistler", lat: 50.1163, lon: -122.9574 },
  { name: "Niseko", lat: 42.804, lon: 140.687 },
  { name: "Aspen", lat: 39.1911, lon: -106.8175 },
  { name: "Cortina", lat: 46.5405, lon: 12.1357 },
  { name: "Laax", lat: 46.836, lon: 9.258 },
  { name: "Åre", lat: 63.399, lon: 13.081 },
];

const API = "https://skisignal-dev-api.azurewebsites.net/api";

export default function App() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [best, setBest] = useState(null);
  const [sortBy, setSortBy] = useState("snowScore");
  const [favorites, setFavorites] = useState([]);

  // Fetch scores for all resorts
  async function fetchScores() {
    setLoading(true);

    const results = await Promise.all(
      RESORTS.map(async (r) => {
        try {
          const res = await fetch(`${API}/score-day?resort=${encodeURIComponent(r.name)}`);
          const dayData = await res.json();

          // Mock weekly snow data
          const weekly = Array.from({ length: 7 }).map((_, i) => ({
            day: `Day ${i + 1}`,
            snow: Math.floor(Math.random() * 30),
          }));

          return { ...r, ...dayData, weekly };
        } catch {
          return { ...r, error: true };
        }
      })
    );

    const obj = Object.fromEntries(results.map(r => [r.name, r]));
    setData(obj);
    setLoading(false);
  }

  // Fetch best resort today
  async function fetchBest() {
    try {
      const res = await fetch(`${API}/best-day`);
      const json = await res.json();
      setBest(json);
    } catch {
      setBest(null);
    }
  }

  useEffect(() => {
    fetchScores();
    fetchBest();
  }, []);

  // Sorting resorts
  const sortedResorts = RESORTS
    .map(r => data[r.name])
    .filter(d => d && !d.error)
    .sort((a, b) => b[sortBy] - a[sortBy]);

  function verdictColor(v) {
    if (v === "GO") return "#22c55e";
    if (v === "MEH") return "#eab308";
    return "#ef4444";
  }

  function toggleFavorite(resort) {
    setFavorites(prev =>
      prev.includes(resort) ? prev.filter(f => f !== resort) : [...prev, resort]
    );
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🎿 SkiSignal v3</h1>

      {/* Best Resort Today */}
      {best && (
        <div style={styles.bestCard}>
          <h2>🏆 Best resort today</h2>
          <h1>{best.resort}</h1>
          <h2 style={{ color: verdictColor(best.verdict) }}>{best.verdict}</h2>
          <p>Snow: {best.snow} cm</p>
        </div>
      )}

      {/* Controls */}
      <div style={{ marginBottom: 20, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button
          onClick={() => { fetchScores(); fetchBest(); }}
          style={styles.button}
        >
          Refresh
        </button>
        <select
          onChange={e => setSortBy(e.target.value)}
          value={sortBy}
          style={styles.select}
        >
          <option value="snowScore">Sort by Snow</option>
          <option value="crowdScore">Sort by Crowd</option>
        </select>
      </div>

      {loading && <p>Loading snow data...</p>}

      {/* Resort Cards Grid */}
      <div style={styles.grid}>
        {sortedResorts.map(d => (
          <div key={d.name} style={styles.card}>
            <h2 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {d.name}
              <span style={{ cursor: "pointer" }} onClick={() => toggleFavorite(d.name)}>
                {favorites.includes(d.name) ? "⭐" : "☆"}
              </span>
            </h2>

            {d.error ? (
              <p>Error fetching data</p>
            ) : (
              <>
                <p>Snow: {d.snow} cm</p>
                <p>Temp: {d.temp}°C</p>
                <p>Wind: {d.wind} km/h</p>
                <p>{d.dayOfWeek}</p>

                <div style={{ ...styles.verdict, background: verdictColor(d.verdict) }}>
                  {d.verdict}
                </div>

                <p>Snow Score: {d.snowScore}</p>
                <p>Crowd Score: {d.crowdScore}</p>

                {/* Weekly Snow Chart */}
                {d.weekly && (
                  <LineChart width={200} height={80} data={d.weekly}>
                    <Line type="monotone" dataKey="snow" stroke="#38bdf8" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                  </LineChart>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Map */}
      <h2 style={{ marginTop: 40 }}>📍 Map of Resorts</h2>
      <div style={{ width: "100%", height: 500 }}>
        <MapContainer
          center={[46, 7]}
          zoom={4}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {RESORTS.map(r => (
            <Marker key={r.name} position={[r.lat, r.lon]}>
              <Popup>
                {r.name}<br />
                Snow: {data[r.name]?.snow ?? "?"} cm<br />
                Temp: {data[r.name]?.temp ?? "?"}°C
              </Popup>
            </Marker>
          ))}
        </MapContainer>
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
    minHeight: "100vh",
    width: "100%",  // important
  },
  title: { fontSize: 42, marginBottom: 20 },
  bestCard: {
    background: "#1e293b",
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    width: "100%",
  },
  button: {
    padding: "10px 16px",
    borderRadius: 8,
    border: "none",
    background: "#38bdf8",
    cursor: "pointer",
  },
  select: { padding: "8px 12px", borderRadius: 6 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 16,
    width: "100%",
  },
  card: {
    background: "#1e293b",
    padding: 16,
    borderRadius: 12,
    width: "100%",
    boxSizing: "border-box",
  },
  verdict: { padding: "6px 10px", borderRadius: 8, display: "inline-block", marginTop: 6 },
};
