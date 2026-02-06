import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Fallback images for resorts
const resortImages = {
  Zermatt: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Zermatt_Matterhorn_2020.jpg",
  Verbier: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Verbier_-_Ski_resort.jpg",
  Chamonix: "https://upload.wikimedia.org/wikipedia/commons/f/fd/Mont_Blanc_Chamonix_2015.jpg",
  StAnton: "https://upload.wikimedia.org/wikipedia/commons/4/49/St._Anton_Ski_Area.jpg",
  Laax: "https://upload.wikimedia.org/wikipedia/commons/1/15/Laax-Snowpark_2020.jpg",
  Cortina: "https://upload.wikimedia.org/wikipedia/commons/b/b7/Cortina_d%27Ampezzo_-_Dolomiti.jpg",
  Niseko: "https://upload.wikimedia.org/wikipedia/commons/2/22/Niseko_Ski_Resort.jpg",
  Aspen: "https://upload.wikimedia.org/wikipedia/commons/8/87/Aspen_Ski_Resort.jpg"
};

const verdictColor = (v) => (v === "GO" ? "#22c55e" : v === "MEH" ? "#eab308" : "#ef4444");
const slopeColor = (s) => (s >= 60 ? "#22c55e" : s >= 35 ? "#eab308" : "#ef4444");

// Simple slopeCondition calculation
const calculateSlope = ({ snow, temp, wind }) => {
  let score = 0;
  score += snow * 2;              // more snow = better
  score += Math.max(0, 5 - temp) * 5; // cold is good
  score -= wind * 0.5;            // high wind reduces
  return Math.max(0, Math.min(100, Math.round(score)));
};

export default function App() {
  const [data, setData] = useState({ best: null, all: [] });
  const [loading, setLoading] = useState(false);

  async function fetchScores() {
    setLoading(true);
    try {
      const res = await fetch("https://skisignal-dev-api.azurewebsites.net/api/best-day");
      const json = await res.json();

      // Add slopeCondition and fallback image
      const allWithExtras = json.all.map(r => ({
        ...r,
        slopeCondition: calculateSlope(r),
        img: resortImages[r.resort] || "https://upload.wikimedia.org/wikipedia/commons/e/e0/Zermatt_Matterhorn_2020.jpg"
      }));

      setData({
        best: allWithExtras[0],
        all: allWithExtras
      });
    } catch (e) {
      console.error("Error fetching data:", e);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchScores();
  }, []);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🎿 SkiSignal</h1>

      {data.best ? (
        <div style={{ ...styles.bestCard, display: "flex", gap: 20, alignItems: "center" }}>
          <img src={data.best.img} alt={data.best.resort} style={{ width: 200, borderRadius: 12 }} />
          <div>
            <h2>🏆 Best resort today</h2>
            <h1>{data.best.resort}</h1>
            <h2 style={{ color: verdictColor(data.best.verdict) }}>{data.best.verdict}</h2>
            <p>Total snow: {Math.round(data.best.snow)} cm</p>
            <p>Temp: {data.best.temp.toFixed(1)}°C</p>
            <p>Wind: {data.best.wind.toFixed(1)} km/h</p>
            <p>Forecast for {data.best.dayOfWeek}, {data.best.date}</p>
            <p>Slope condition: {data.best.slopeCondition}%</p>
          </div>
        </div>
      ) : (
        <p>Loading resort data...</p>
      )}

      <button onClick={fetchScores} style={styles.button}>Refresh</button>
      {loading && <p>Loading snow data...</p>}

      <div style={styles.grid}>
        {data.all.map(r => (
          <div key={r.resort} style={styles.card}>
            <h2>{r.resort}</h2>
            <p>Total snow: {Math.round(r.snow)} cm</p>
            <p>Temp: {r.temp.toFixed(1)}°C</p>
            <p>Wind: {r.wind.toFixed(1)} km/h</p>
            <div style={{ ...styles.verdict, background: slopeColor(r.slopeCondition) }}>Slope: {r.slopeCondition}%</div>
            <div style={{ ...styles.verdict, background: verdictColor(r.verdict) }}>Verdict: {r.verdict}</div>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 40 }}>Map of resorts</h2>
      <MapContainer style={{ height: 500, width: "100%" }} center={[46.8, 9.8]} zoom={6} scrollWheelZoom={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        {data.all.map(r => (
          <Marker key={r.resort} position={[r.lat, r.lon]}>
            <Popup>
              <b>{r.resort}</b><br />
              Total snow: {Math.round(r.snow)} cm<br />
              Temp: {r.temp.toFixed(1)}°C<br />
              Wind: {r.wind.toFixed(1)} km/h<br />
              Slope condition: {r.slopeCondition}%
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

const styles = {
  page: { fontFamily: "sans-serif", padding: 30, background: "#0f172a", color: "white", minHeight: "100vh" },
  title: { fontSize: 42, marginBottom: 20 },
  bestCard: { background: "#1e293b", padding: 20, borderRadius: 12, marginBottom: 30 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginTop: 20 },
  card: { background: "#1e293b", padding: 16, borderRadius: 12 },
  verdict: { padding: "6px 10px", borderRadius: 8, display: "inline-block", marginTop: 6 },
  button: { marginBottom: 20, padding: "10px 16px", borderRadius: 8, border: "none", background: "#38bdf8", cursor: "pointer" },
};
