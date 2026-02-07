import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API = "https://skisignal-dev-api.azurewebsites.net/api";
const PAGE_SIZE = 4;

// ------------------
// Resort coordinates
// ------------------
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

// ------------------
function verdictColor(v) {
  if (v === "GO") return "#22c55e";
  if (v === "MEH") return "#eab308";
  return "#ef4444";
}

function verdictLabel(v) {
  if (v === "GO") return "GO";
  if (v === "MEH") return "OK";
  return "NO";
}

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

// ------------------
// MAIN APP
// ------------------
export default function App() {
  const [data, setData] = useState({ bestToday: null, bestTomorrow: null, all: [] });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const resize = () => setIsMobile(window.innerWidth <= 768);
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  async function fetchData() {
    const res = await fetch(`${API}/best-day`);
    const json = await res.json();

    const merged = json.all.map(r => {
      const coord = RESORTS.find(x => x.name === r.resort);
      return { ...r, lat: coord?.lat, lon: coord?.lon };
    });

    setData({ ...json, all: merged });
  }

  useEffect(() => { fetchData(); }, []);

  const visibleResorts = data.all.slice(0, visibleCount);
  const winnerNames = [
    data.bestToday?.resort,
    data.bestTomorrow?.resort
  ];

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🎿 SkiSignal</h1>

      {/* WINNERS */}
      <div style={styles.bestGrid}>
        {data.bestToday && <BestCard title="Best Today" d={data.bestToday} />}
        {data.bestTomorrow && <BestCard title="Best Tomorrow" d={data.bestTomorrow} />}
      </div>

      {/* MOBILE MAP */}
      {isMobile && (
        <div style={{ height: 350, marginBottom: 20 }}>
          <MapComponent data={data.all} />
        </div>
      )}

      {/* MAIN */}
      <div style={{ display: isMobile ? "block" : "flex", gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={styles.grid}>
            {visibleResorts.map(r => (
              <ResortCard key={r.resort} r={r} isWinner={winnerNames.includes(r.resort)} />
            ))}
          </div>

          <button style={styles.loadMore} onClick={() => setVisibleCount(v => v + PAGE_SIZE)}>
            Load more
          </button>
        </div>

        {!isMobile && (
          <div style={{ width: "45%", height: "80vh", position: "sticky", top: 20 }}>
            <MapComponent data={data.all} />
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------
// MAP
// ------------------
function MapComponent({ data }) {
  return (
    <MapContainer center={[46.8, 8.2]} zoom={6} style={{ height: "100%", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {data.map(r => r.lat && (
        <Marker key={r.resort} position={[r.lat, r.lon]} icon={markerIcon(verdictColor(r.today.verdict))}>
          <Popup>
            <strong>{r.resort}</strong><br/>
            Today: {verdictLabel(r.today.verdict)} ({r.today.snow} cm)<br/>
            Tomorrow: {verdictLabel(r.tomorrow.verdict)} ({r.tomorrow.snow} cm)<br/>
            Wind: {r.today.wind}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

// ------------------
// CARDS
// ------------------
function BestCard({ title, d }) {
  return (
    <div style={styles.bestCard}>
      <span style={styles.trophy}>🏆</span>
      <h3>{title}</h3>
      <h1 style={styles.resortTitle}>{d.resort}</h1>

      <div style={{ ...styles.bigVerdict, background: verdictColor(d.verdict) }}>
        {verdictLabel(d.verdict)}
      </div>

      <p>Snow: {d.snow} cm</p>
      <p>Temp: {d.temp}°C</p>
      <p>Wind: {d.wind} km/h</p>
      <p>{d.dayOfWeek}</p>
    </div>
  );
}

function ResortCard({ r, isWinner }) {
  return (
    <div style={{ ...styles.card, border: isWinner ? "2px solid gold" : "none" }}>
      {isWinner && <span style={styles.trophySmall}>🏆</span>}
      <h2 style={styles.resortTitle}>{r.resort}</h2>

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
      <h4>{title}</h4>
      <p>Snow: {d.snow} cm</p>
      <p>Temp: {d.temp}°C</p>
      <p style={{ marginTop: 6 }}>Wind: {d.wind} km/h</p>
      <div style={{ ...styles.verdict, background: verdictColor(d.verdict) }}>
        {verdictLabel(d.verdict)}
      </div>
    </div>
  );
}

// ------------------
const styles = {
  page: { padding: 20, background: "#0f172a", color: "white", minHeight: "100vh", fontFamily: "sans-serif" },
  title: { fontSize: 42 },

  bestGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
    marginBottom: 20
  },

  bestCard: {
    background: "#1e293b",
    padding: 24,
    borderRadius: 16,
    position: "relative",
    overflow: "hidden",
    width: "100%"
  },

  trophy: { position: "absolute", top: 10, right: 12, fontSize: 26 },
  trophySmall: { position: "absolute", top: 8, right: 10 },

  resortTitle: {
    margin: 0,
    wordBreak: "break-word",
    overflowWrap: "anywhere"
  },

  bigVerdict: {
    padding: 10,
    borderRadius: 12,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
    gap: 16
  },

  card: {
    background: "#1e293b",
    padding: 16,
    borderRadius: 16,
    position: "relative",
    overflow: "hidden"
  },

  dayRow: { display: "flex", gap: 10 },
  dayBox: { flex: 1, background: "#0f172a", padding: 10, borderRadius: 12 },

  verdict: { marginTop: 8, padding: 6, borderRadius: 8, textAlign: "center", fontWeight: "bold" },

  loadMore: {
    marginTop: 20,
    padding: 12,
    borderRadius: 10,
    background: "#334155",
    color: "white",
    width: "100%"
  }
};
