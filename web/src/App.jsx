import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix marker icons for Leaflet (works on Azure / production)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const API = "https://skisignal-dev-api.azurewebsites.net/api";

// Coordinates for resorts
const RESORTS = [
  { name: "Zermatt", lat: 46.0207, lon: 7.7491 },
  { name: "Verbier", lat: 46.096, lon: 7.228 },
  { name: "Chamonix", lat: 45.9237, lon: 6.8694 },
  { name: "StAnton", lat: 47.128, lon: 10.263 },
  { name: "Cortina", lat: 46.5405, lon: 12.1357 },
  { name: "Laax", lat: 46.836, lon: 9.258 },
  { name: "Engelberg", lat: 46.5905, lon: 8.3985 },
  { name: "AlagnaValsesia", lat: 45.8833, lon: 7.8833 },
  { name: "LaThuile", lat: 45.689, lon: 6.952 },
  { name: "ValThorens", lat: 45.2975, lon: 6.5803 },
  { name: "Courchevel", lat: 45.4167, lon: 6.6342 },
  { name: "Meribel", lat: 45.395, lon: 6.565 },
  { name: "LesArcs", lat: 45.5833, lon: 6.7967 },
  { name: "SaasFee", lat: 46.094, lon: 7.927 },
  { name: "Davos", lat: 46.8028, lon: 9.836 },
  { name: "Klosters", lat: 46.879, lon: 9.844 },
  { name: "Ischgl", lat: 46.977, lon: 10.300 },
  { name: "Gstaad", lat: 46.492, lon: 7.283 },
  { name: "Kitzbuhel", lat: 47.446, lon: 12.392 },
  { name: "Sestriere", lat: 44.883, lon: 7.160 },
  { name: "Grindelwald", lat: 46.624, lon: 8.041 },
  { name: "ValdIsere", lat: 45.448, lon: 6.980 },
  { name: "LesDeuxAlpes", lat: 45.0167, lon: 6.0667 },
  { name: "Obergurgl", lat: 46.870, lon: 11.011 }
];

export default function App() {
  const [data, setData] = useState({ best: null, all: [] });
  const [loading, setLoading] = useState(false);

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
          <p>
            Snow: {data.best.snow} cm ({data.best.freshSnow} cm new)
          </p>
          <p>Temp: {data.best.temp}°C</p>
          <p>Wind: {data.best.wind} km/h</p>
          <p>{data.best.dayOfWeek}</p>
        </div>
      )}

      {/* Refresh Button */}
      <div style={{ margin: "20px 0" }}>
        <button onClick={fetchData}>Refresh</button>
      </div>

      {loading && <p>Loading snow data...</p>}

      {/* Resorts Grid */}
      <div className="grid">
        {data.all.map(r => (
          <div key={r.resort} className="card">
            <h2>{r.resort}</h2>
            <p>
              Snow: {r.snow} cm ({r.freshSnow} cm new)
            </p>
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
      <div style={{ width: "100%", height: "500px" }}>
        <MapContainer
          center={[46, 7]}
          zoom={4}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {data.all.map(
            r =>
              r.lat != null &&
              r.lon != null && (
                <Marker key={r.resort} position={[r.lat, r.lon]}>
                  <Popup>
                    <strong>{r.resort}</strong>
                    <br />
                    Snow: {r.snow} cm ({r.freshSnow} cm new)
                    <br />
                    Temp: {r.temp}°C
                    <br />
                    Verdict: {r.verdict}
                  </Popup>
                </Marker>
              )
          )}
        </MapContainer>
      </div>
    </div>
  );
}
