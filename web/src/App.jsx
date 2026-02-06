import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API = "https://skisignal-dev-api.azurewebsites.net/api/best-day";

const resortCoords = {
  Zermatt: [46.02, 7.75],
  Verbier: [46.096, 7.228],
  Laax: [46.836, 9.258],
  Chamonix: [45.9237, 6.8694],
  StAnton: [47.128, 10.263],
  Cortina: [46.54, 12.135]
};

// Fix leaflet marker bug
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

export default function App() {
  const [data, setData] = useState(null);

  async function load() {
    try {
      const res = await fetch(API);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("API failed", e);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (!data) {
    return (
      <div style={{ padding: 40, color: "white" }}>
        Loading SkiSignal…
      </div>
    );
  }

  const best = data.best;
  const resorts = data.all;

  return (
    <div style={styles.page}>
      <h1>🎿 SkiSignal</h1>

      {/* BEST RESORT */}
      {best && (
        <div style={styles.best}>
          <h2>🏆 Best resort today: {best.resort}</h2>
          <p>Snow: {best.snow ?? 0} cm</p>
          <p>Temp: {best.temp}°C</p>
          <p>Wind: {best.wind} km/h</p>
          <p>Date: {best.date}</p>
        </div>
      )}

      {/* MAP */}
      <div style={{ height: 400, marginBottom: 30 }}>
        <MapContainer
          center={[46.8, 8.3]}
          zoom={6}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {resorts.map(r => {
            const coords = resortCoords[r.resort];
            if (!coords) return null;

            return (
              <Marker key={r.resort} position={coords}>
                <Popup>
                  <b>{r.resort}</b>
                  <br />
                  Snow: {r.snow ?? 0} cm
                  <br />
                  Temp: {r.temp}°C
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* CARDS */}
      <div style={styles.grid}>
        {resorts.map(r => (
          <div key={r.resort} style={styles.card}>
            <h3>{r.resort}</h3>
            <p>Snow: {r.snow ?? 0} cm</p>
            <p>Temp: {r.temp}°C</p>
            <p>Wind: {r.wind}</p>
            <p>Score: {r.snowScore}</p>
            <p>Verdict: {r.verdict}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: 30,
    background: "#0f172a",
    color: "white",
    minHeight: "100vh"
  },
  best: {
    background: "#1e293b",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 16
  },
  card: {
    background: "#1e293b",
    padding: 16,
    borderRadius: 12
  }
};
