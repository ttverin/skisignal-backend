import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const API = "https://skisignal-dev-api.azurewebsites.net/api";

// Coordinates for resorts
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

export default function App() {
  const [data, setData] = useState({ best: null, all: [] });
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("snowScore");

  // Fetch best day + all resorts
  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/best-day`);
      const json = await res.json();

      // Merge lat/lon for map
      const mergedAll = json.all.map(r => {
        const coord = RESORTS.find(res => res.name === r.resort);
        return { ...r, lat: coord?.lat, lon: coord?.lon };
      });

      setData({ best: json.best, all: mergedAll });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Sort resorts
  const sortedResorts = [...data.all].sort((a, b) => b[sortBy] - a[sortBy]);

  function verdictColor(v) {
    if (v === "GO") return "#22c55e";
    if (v === "MEH") return "#eab308";
    return "#ef4444";
  }

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        padding: 30,
        minHeight: "100vh",
        width: "100%",
        background: "#0f172a",
        color: "white",
      }}
    >
      <h1 style={{ fontSize: 42 }}>🎿 SkiSignal</h1>

      {/* Best Resort */}
      {data.best && (
        <div className="bestCard">
          <h2>🏆 Best resort today</h2>
          <h1>{data.best.resort}</h1>
          <h2 style={{ color: verdictColor(data.best.verdict) }}>
            {data.best.verdict}
          </h2>
          <p>Snow: {data.best.snow} cm</p>
          <p>Temp: {data.best.temp}°C</p>
          <p>Wind: {data.best.wind} km/h</p>
          <p>{data.best.dayOfWeek}</p>
        </div>
      )}

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <button onClick={fetchData}>Refresh</button>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="snowScore">Sort by Snow</option>
          <option value="crowdScore">Sort by Crowd</option>
        </select>
      </div>

      {loading && <p>Loading snow data...</p>}

      {/* Resorts Grid */}
      <div className="grid">
        {sortedResorts.map(r => (
          <div key={r.resort} className="card">
            <h2>{r.resort}</h2>
            <p>Snow: {r.snow} cm</p>
            <p>Temp: {r.temp}°C</p>
            <p>Wind: {r.wind} km/h</p>
            <p>{r.dayOfWeek}</p>
            <div
              className="verdict"
              style={{ background: verdictColor(r.verdict) }}
            >
              {r.verdict}
            </div>
          </div>
        ))}
      </div>

      {/* Map */}
      <h2 style={{ marginTop: 40 }}>📍 Map of Resorts</h2>
      <div className="map-container">
        <MapContainer
          center={[46, 7]}
          zoom={4}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {data.all.map(r =>
            r.lat && r.lon ? (
              <Marker key={r.resort} position={[r.lat, r.lon]}>
                <Popup>
                  {r.resort}
                  <br />
                  Snow: {r.snow} cm
                  <br />
                  Temp: {r.temp}°C
                </Popup>
              </Marker>
            ) : null
          )}
        </MapContainer>
      </div>
    </div>
  );
}
