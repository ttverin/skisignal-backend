import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API = "https://skisignal-dev-api.azurewebsites.net/api";
const PAGE_SIZE = 6;

// Resort coordinates
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
  { name: "Ischgl", lat: 46.977, lon: 10.3 },
  { name: "Gstaad", lat: 46.492, lon: 7.283 },
  { name: "Kitzbuhel", lat: 47.446, lon: 12.392 },
  { name: "Sestriere", lat: 44.883, lon: 7.16 },
  { name: "Grindelwald", lat: 46.624, lon: 8.041 },
  { name: "ValdIsere", lat: 45.448, lon: 6.98 },
  { name: "LesDeuxAlpes", lat: 45.0167, lon: 6.0667 },
  { name: "Obergurgl", lat: 46.87, lon: 11.011 }
];

// Verdict color
function verdictColor(v) {
  if (v === "GO") return "#22c55e";
  if (v === "MEH") return "#eab308";
  return "#ef4444";
}

// Colored map marker
function markerIcon(color) {
  return new L.DivIcon({
    html: `<div style="
      background:${color};
      width:16px;
      height:16px;
      border-radius:50%;
      border:3px solid white;"></div>`,
    className: ""
  });
}

export default function App() {
  const [data, setData] = useState({ bestToday: null, bestTomorrow: null, all: [] });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/best-day`);
      const json = await res.json();

      const merged = json.all.map(r => {
        const coord = RESORTS.find(x => x.name === r.resort);
        return { ...r, lat: coord?.lat, lon: coord?.lon };
      });

      setData({ ...json, all: merged });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  const visibleResorts = data.all.slice(0, visibleCount);
  const hasMore = visibleCount < data.all.length;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🎿 SkiSignal</h1>

      {/* BEST TODAY/TOMORROW */}
      <div style={styles.bestWrap}>
        {data.bestToday && <BestCard title="Best Today" d={data.bestToday} />}
        {data.bestTomorrow && <BestCard title="Best Tomorrow" d={data.bestTomorrow} />}
      </div>

      <button style={styles.refresh} onClick={fetchData}>Refresh</button>
      {loading && <p>Loading snow…</p>}

      {/* MAIN LAYOUT */}
      <div style={styles.mainLayout}>
        {/* CARDS */}
        <div style={styles.cardsColumn}>
          <div style={styles.grid}>
            {visibleResorts.map(r => <ResortCard key={r.resort} r={r} />)}
          </div>

          {hasMore && (
            <button style={styles.loadMore} onClick={() => setVisibleCount(v => v + PAGE_SIZE)}>
              Load more resorts
            </button>
          )}
        </div>

        {/* MAP */}
        <div style={styles.mapColumn}>
          <MapContainer center={[46.8, 8.2]} zoom={6} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {data.all.map(r => r.lat && r.lon && (
              <Marker key={r.resort} position={[r.lat, r.lon]} icon={markerIcon(verdictColor(r.today.verdict))}>
                <Popup>
                  <strong>{r.resort}</strong><br />
                  Today: {r.today.verdict} | Snow: {r.today.snow} cm | Wind: {r.today.wind} km/h<br />
                  Tomorrow: {r.tomorrow.verdict} | Snow: {r.tomorrow.snow} cm | Wind: {r.tomorrow.wind} km/h
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

// ------------------
// Components
// ------------------

function BestCard({ title, d }) {
  return (
    <div style={{ 
      ...styles.bestCard, 
      border: `2px solid ${verdictColor(d.verdict)}`, 
      boxShadow: `0 0 12px ${verdictColor(d.verdict)}50` 
    }}>
      <h3 style={{ marginBottom: 8 }}>🏆 {title}</h3>
      <h2 style={{ margin: 0, wordBreak: "break-word" }}>{d.resort}</h2>

      <div style={{ ...styles.bigVerdict, background: verdictColor(d.verdict) }}>
        {d.verdict}
      </div>

      <p style={{ margin: "8px 0 0 0" }}>Day: {d.dayOfWeek}</p>
      <p style={{ margin: "2px 0" }}>Snow: {d.snow} cm (New: {d.freshSnow} cm)</p>
      <p style={{ margin: "2px 0" }}>Temp: {d.temp}°C</p>
      <p style={{ margin: "2px 0" }}>Wind: {d.wind} km/h</p>
    </div>
  );
}

function ResortCard({ r }) {
  return (
    <div style={styles.card}>
      <h2 style={{ margin: 0, wordBreak: "break-word" }}>{r.resort}</h2>
      <div style={styles.dayRow}>
        <DayBox title="Today" d={r.today} />
        <DayBox title="Tomorrow" d={r.tomorrow} />
      </div>
    </div>
  );
}

function DayBox({ title, d }) {
  return (
    <div style={styles.dayBox}>
      <h4 style={{ margin: 0 }}>{title}</h4>
      <p style={{ margin: "2px 0" }}>{d.dayOfWeek}</p>
      <p style={{ margin: "2px 0" }}>Snow: {d.snow} cm</p>
      <p style={{ margin: "2px 0" }}>New: {d.freshSnow} cm</p>
      <p style={{ margin: "2px 0" }}>Temp: {d.temp}°C</p>
      <p style={{ margin: "2px 0" }}>Wind: {d.wind} km/h</p>
      <div style={{ ...styles.verdict, background: verdictColor(d.verdict) }}>
        {d.verdict}
      </div>
    </div>
  );
}

// ------------------
// Styles
// ------------------

const styles = {
  page: { padding: 20, background: "#0f172a", color: "white", minHeight: "100vh", fontFamily: "sans-serif" },
  title: { fontSize: 42, marginBottom: 10 },
  bestWrap: { display: "flex", gap: 20, marginBottom: 20, flexWrap: "wrap" },
  bestCard: { background: "#1e293b", padding: 20, borderRadius: 16, width: 240, minWidth: 0 },
  bigVerdict: { padding: 10, borderRadius: 12, fontWeight: "bold", marginTop: 10, textAlign: "center" },
  refresh: { marginBottom: 20, padding: 10, borderRadius: 10, background: "#334155", color: "white" },
  mainLayout: { display: "flex", gap: 20, alignItems: "flex-start" },
  cardsColumn: { flex: 1 },
  mapColumn: { width: "45%", height: "80vh", position: "sticky", top: 20 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 16 },
  card: { background: "#1e293b", padding: 16, borderRadius: 16, minWidth: 0 },
  dayRow: { display: "flex", gap: 10 },
  dayBox: { flex: 1, background: "#0f172a", padding: 10, borderRadius: 12, minWidth: 0 },
  verdict: { marginTop: 8, padding: 6, borderRadius: 8, textAlign: "center", fontWeight: "bold" },
  loadMore: { marginTop: 20, padding: 12, borderRadius: 10, background: "#334155", color: "white", width: "100%" }
};
