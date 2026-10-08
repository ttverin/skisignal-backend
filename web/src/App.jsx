import { useCallback, useEffect, useState } from "react";
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
// Verdict color + text
// ------------------
function verdictColor(v) {
  if (v === "GO") return "#22c55e";
  if (v === "MEH") return "#eab308";
  return "#ef4444";
}

function verdictLabel(v) {
  if (v === "GO") return "GO";
  if (v === "MEH") return "OK"; // text only change
  return "NO";
}

// ------------------
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
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [priority, setPriority] = useState("balanced");
  const [error, setError] = useState("");

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/best-day?priority=${encodeURIComponent(priority)}`);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const json = await res.json();
      const merged = json.all.map(r => {
        const coord = RESORTS.find(x => x.name === r.resort);
        return { ...r, lat: coord?.lat, lon: coord?.lon };
      });
      setData({ ...json, all: merged });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [priority]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const visibleResorts = data.all.slice(0, visibleCount);
  const hasMore = visibleCount < data.all.length;

  const winnerNames = [];
  if (data.bestToday) winnerNames.push(data.bestToday.resort);
  if (data.bestTomorrow && !winnerNames.includes(data.bestTomorrow.resort))
    winnerNames.push(data.bestTomorrow.resort);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🎿 SkiSignal</h1>

      <label style={styles.priorityLabel}>
        What matters most?
        <select
          value={priority}
          onChange={event => setPriority(event.target.value)}
          style={styles.prioritySelect}
        >
          <option value="balanced">Balanced</option>
          <option value="powder">Fresh powder</option>
          <option value="low-wind">Lower wind</option>
          <option value="quiet">Fewer crowds</option>
        </select>
      </label>
      <p style={styles.disclaimer}>
        Wind and rain are forecast risk signals. Crowd pressure is estimated from weekends and fresh snow;
        live lift status and resort-wide conditions are not available.
      </p>

      {/* WINNER CARDS */}
      <div style={styles.bestGrid}>
        {data.all.length > 0 && (data.bestToday
          ? <BestCard title="Best Today" d={data.bestToday} isWinner priority={priority} />
          : <NoRecommendationCard title="Today" />)}
        {data.all.length > 0 && (data.bestTomorrow
          ? <BestCard title="Best Tomorrow" d={data.bestTomorrow} isWinner priority={priority} />
          : <NoRecommendationCard title="Tomorrow" />)}
      </div>

      <button style={styles.refresh} onClick={fetchData}>Refresh</button>
      {loading && <p>Loading snow…</p>}
      {error && <p role="alert" style={styles.error}>{error}</p>}

      {/* MOBILE MAP — BELOW WINNERS */}
      {isMobile && (
        <div style={{ height: 350, marginBottom: 20 }}>
          <MapComponent data={data.all} />
        </div>
      )}

      {/* MAIN LAYOUT */}
      <div style={{ display: isMobile ? "block" : "flex", gap: 20, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={styles.grid}>
            {visibleResorts.map(r => (
              <ResortCard
                key={r.resort}
                r={r}
                isWinner={winnerNames.includes(r.resort)}
                priority={priority}
              />
            ))}
          </div>

          {hasMore && (
            <button style={styles.loadMore} onClick={() => setVisibleCount(v => v + PAGE_SIZE)}>
              Load more resorts
            </button>
          )}
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
      {data.map(r => r.lat && r.lon && (
        <Marker key={r.resort} position={[r.lat, r.lon]} icon={markerIcon(verdictColor(r.today.verdict))}>
          <Popup>
            <strong>{r.resort}</strong><br />
            Today: {verdictLabel(r.today.verdict)} ({r.today.score} pts)<br />
            Tomorrow: {verdictLabel(r.tomorrow.verdict)} ({r.tomorrow.score} pts)<br />
            New snow: {r.today.freshSnow} cm · Wind/gust: {r.today.wind}/{r.today.windGust} km/h
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

// ------------------
// CARDS
// ------------------
function BestCard({ title, d, isWinner, priority }) {
  return (
    <div style={{ ...styles.bestCard, border: isWinner ? "3px solid gold" : "none" }}>
      {isWinner && <span style={styles.trophy}>🏆</span>}
      <h3>{title}</h3>
      <h1 style={styles.resortTitle}>{d.resort}</h1>
      <div style={{ ...styles.bigVerdict, background: verdictColor(d.verdict) }}>
        {verdictLabel(d.verdict)}
      </div>
      <p>{d.score} points · {d.verdict}</p>
      <p>Base: {d.snow} cm · New snow: {d.freshSnow} cm</p>
      <p>High: {d.temp}°C · Forecast point: {d.elevation} m</p>
      <p>Wind/gust: {d.wind}/{d.windGust} km/h</p>
      <p>Rain: {d.rain} mm · Precipitation chance: {d.precipitationProbability}%</p>
      <p>Estimated crowd pressure: {d.crowdScore}/30</p>
      <p>{d.dayOfWeek}</p>
      <ReasonList reasons={d.reasons} />
      <ConditionFeedback resort={d.resort} priority={priority} day={d} />
    </div>
  );
}

function NoRecommendationCard({ title }) {
  return (
    <div style={styles.bestCard}>
      <h3>Best {title}</h3>
      <p>No resort currently meets the minimum recommendation score.</p>
    </div>
  );
}

function ResortCard({ r, isWinner, priority }) {
  return (
    <div style={{ ...styles.card, border: isWinner ? "2px solid gold" : "none" }}>
      {isWinner && <span style={styles.trophySmall}>🏆</span>}
      <h2 style={styles.resortTitle}>{r.resort}</h2>
      <div style={styles.dayRow}>
        <DayBox title="Today" d={r.today} resort={r.resort} priority={priority} />
        <DayBox title="Tomorrow" d={r.tomorrow} resort={r.resort} priority={priority} />
      </div>
    </div>
  );
}

function DayBox({ title, d, resort, priority }) {
  return (
    <div style={styles.dayBox}>
      <h4>{title}</h4>
      <p>{d.score} points · Base: {d.snow} cm</p>
      <p>New snow: {d.freshSnow} cm · High: {d.temp}°C · Point: {d.elevation} m</p>
      <p>Wind/gust: {d.wind}/{d.windGust} km/h</p>
      <p>Rain: {d.rain} mm · Precipitation chance: {d.precipitationProbability}%</p>
      <p>Estimated crowd pressure: {d.crowdScore}/30</p>
      <div style={{ ...styles.verdict, background: verdictColor(d.verdict) }}>
        {verdictLabel(d.verdict)}
      </div>
      <ReasonList reasons={d.reasons} />
      <ConditionFeedback resort={resort} priority={priority} day={d} />
    </div>
  );
}

function ReasonList({ reasons }) {
  return (
    <p style={styles.reasons}>
      {reasons.length > 0 ? reasons.join(" · ") : "No strong positive or negative signals"}
    </p>
  );
}

function ConditionFeedback({ resort, priority, day }) {
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMessage("");
  }, [resort, priority, day.date, day.score]);

  async function submitRating(rating) {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`${API}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resort,
          date: day.date,
          priority,
          rating,
          score: day.score,
          verdict: day.verdict,
          snow: day.snow,
          freshSnow: day.freshSnow,
          temp: day.temp,
          wind: day.wind,
          windGust: day.windGust,
          rain: day.rain,
          precipitationProbability: day.precipitationProbability,
          crowdScore: day.crowdScore,
          reasons: day.reasons
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
      setMessage("Thanks — feedback saved");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.feedback}>
      <span>How were conditions?</span>
      {["poor", "mixed", "good"].map(rating => (
        <button
          key={rating}
          type="button"
          disabled={saving}
          onClick={() => submitRating(rating)}
          aria-label={`Rate ${resort} on ${day.date} as ${rating}`}
          style={styles.feedbackButton}
        >
          {rating}
        </button>
      ))}
      {message && <small role="status">{message}</small>}
    </div>
  );
}

// ------------------
// STYLES
// ------------------
const styles = {
  page: { padding: 20, background: "#0f172a", color: "white", minHeight: "100vh", fontFamily: "sans-serif" },
  title: { fontSize: 42, marginBottom: 10 },
  priorityLabel: { display: "flex", gap: 10, alignItems: "center", fontWeight: "bold" },
  prioritySelect: { padding: 8, borderRadius: 8, background: "#1e293b", color: "white" },
  disclaimer: { color: "#cbd5e1", maxWidth: 850, fontSize: 14 },
  error: { color: "#fecaca" },

  bestGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 20,
    marginBottom: 20
  },

  bestCard: {
    background: "#1e293b",
    padding: 20,
    borderRadius: 16,
    position: "relative",
    overflow: "hidden"
  },

  trophy: { position: "absolute", top: 8, right: 10, fontSize: 24 },
  trophySmall: { position: "absolute", top: 8, right: 10 },

  resortTitle: {
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    margin: 0
  },

  bigVerdict: { padding: 10, borderRadius: 12, fontWeight: "bold", marginTop: 10, textAlign: "center" },

  refresh: { marginBottom: 20, padding: 10, borderRadius: 10, background: "#334155", color: "white" },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 16 },

  card: { background: "#1e293b", padding: 16, borderRadius: 16, position: "relative", overflow: "hidden" },

  dayRow: { display: "flex", gap: 10, flexWrap: "wrap" },

  dayBox: { flex: 1, background: "#0f172a", padding: 10, borderRadius: 12, minWidth: 0 },

  verdict: { marginTop: 8, padding: 6, borderRadius: 8, textAlign: "center", fontWeight: "bold" },
  reasons: { color: "#cbd5e1", fontSize: 13, lineHeight: 1.5 },
  feedback: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", fontSize: 12 },
  feedbackButton: { padding: "4px 7px", borderRadius: 6, background: "#334155", color: "white" },

  loadMore: { marginTop: 20, padding: 12, borderRadius: 10, background: "#334155", color: "white", width: "100%" }
};
