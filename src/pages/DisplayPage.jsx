import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { Clock, Maximize2, Minimize2, Tv } from "lucide-react";
import { db } from "../firebase/config";
import {
  getActiveScreenContents,
  isSafeImageUrl,
} from "../utils/scheduleUtils";

const ROTATION_INTERVAL_MS = 8000;

export default function DisplayPage() {
  const { screenId } = useParams();
  const activeScreenId = (screenId || "ALL").trim().toUpperCase();

  const [allContents, setAllContents] = useState([]);
  const [screenInfo, setScreenInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [nowTick, setNowTick] = useState(() => new Date());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch optional screen metadata when viewing a specific screenId
  useEffect(() => {
    let active = true;
    async function loadScreenMeta() {
      if (activeScreenId === "ALL") {
        setScreenInfo(null);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "screens", activeScreenId));
        if (active) {
          setScreenInfo(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        }
      } catch (err) {
        console.error("Screen lookup error:", err);
      }
    }
    loadScreenMeta();
    return () => {
      active = false;
    };
  }, [activeScreenId]);

  // Real-time Firestore listener for 'contents'
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "contents"),
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setAllContents(items);
        setLoading(false);
        setErrorMsg("");
      },
      (err) => {
        console.error("Display stream error:", err);
        setErrorMsg("Unable to connect to live signage feed.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Re-evaluate schedule windows every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Filter active items for this screen & current date/time
  const eligibleItems = useMemo(() => {
    return getActiveScreenContents(allContents, activeScreenId, nowTick);
  }, [allContents, activeScreenId, nowTick]);

  // Keep slide index within bounds when items change
  useEffect(() => {
    setCurrentIndex(0);
  }, [eligibleItems.length, activeScreenId]);

  // Automatically rotate slides when multiple items are active
  useEffect(() => {
    if (eligibleItems.length <= 1) return;

    const rotator = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % eligibleItems.length);
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(rotator);
  }, [eligibleItems.length]);

  // Sync fullscreen button icon with browser fullscreen state
  useEffect(() => {
    function handleFsChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen toggle failed:", err);
    }
  }

  const currentItem = eligibleItems[currentIndex] || null;
  const formattedClock = nowTick.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedDate = nowTick.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div style={styles.stage}>
      {/* Top Status & Controls Bar */}
      <header style={styles.topBar}>
        <div style={styles.channelBadge}>
          <Tv size={18} />
          <span>
            {screenInfo?.name
              ? `${screenInfo.name} (${activeScreenId})`
              : `Channel: ${activeScreenId}`}
          </span>
        </div>

        <div style={styles.rightControls}>
          <div style={styles.clockBox}>
            <Clock size={16} />
            <span>{formattedDate}</span>
            <strong>{formattedClock}</strong>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            style={styles.fsBtn}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span>{isFullscreen ? "Exit" : "Fullscreen"}</span>
          </button>
        </div>
      </header>

      {/* Main Signage Canvas */}
      <main style={styles.canvas}>
        {loading ? (
          <div style={styles.fallbackCard}>
            <h1 style={styles.fallbackTitle}>Syncing Display Feed...</h1>
            <p style={styles.fallbackText}>
              Connecting to ScreenSync real-time signage stream.
            </p>
          </div>
        ) : errorMsg ? (
          <div style={styles.fallbackCard}>
            <h1 style={styles.fallbackTitle}>Display Offline</h1>
            <p style={styles.fallbackText}>{errorMsg}</p>
          </div>
        ) : !currentItem ? (
          <div style={styles.fallbackCard}>
            <Tv size={44} style={{ color: "#60a5fa", marginBottom: "0.75rem" }} />
            <h1 style={styles.fallbackTitle}>ScreenSync Ready</h1>
            <p style={styles.fallbackText}>
              No active advertisements or announcements scheduled right now for{" "}
              <strong>{activeScreenId}</strong>.
            </p>
          </div>
        ) : (
          <article style={styles.slideCard}>
            <div style={styles.slideHeader}>
              <span style={styles.typeBadge}>
                {currentItem.contentType === "ad"
                  ? "ADVERTISEMENT"
                  : "ANNOUNCEMENT"}
              </span>
              {eligibleItems.length > 1 && (
                <span style={styles.counterText}>
                  Slide {currentIndex + 1} of {eligibleItems.length}
                </span>
              )}
            </div>

            <div
              style={{
                ...styles.slideBody,
                gridTemplateColumns: isSafeImageUrl(currentItem.imageUrl)
                  ? "repeat(auto-fit, minmax(320px, 1fr))"
                  : "1fr",
              }}
            >
              {isSafeImageUrl(currentItem.imageUrl) && (
                <div style={styles.imageWrapper}>
                  <img
                    src={currentItem.imageUrl}
                    alt={currentItem.title}
                    style={styles.slideImage}
                  />
                </div>
              )}

              <div style={styles.textColumn}>
                <h1 style={styles.slideTitle}>{currentItem.title}</h1>
                {currentItem.description && (
                  <p style={styles.slideDesc}>{currentItem.description}</p>
                )}
              </div>
            </div>

            {eligibleItems.length > 1 && (
              <div style={styles.dotsRow}>
                {eligibleItems.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={`Go to slide ${idx + 1}`}
                    onClick={() => setCurrentIndex(idx)}
                    style={{
                      ...styles.dot,
                      background:
                        idx === currentIndex
                          ? "#3b82f6"
                          : "rgba(148, 163, 184, 0.35)",
                      width: idx === currentIndex ? "24px" : "10px",
                    }}
                  />
                ))}
              </div>
            )}
          </article>
        )}
      </main>
    </div>
  );
}

const styles = {
  stage: {
    minHeight: "100vh",
    width: "100%",
    background: "radial-gradient(circle at top right, #172554, #070b14 65%)",
    color: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    fontFamily: "system-ui, -apple-system, sans-serif",
    boxSizing: "border-box",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 1.75rem",
    background: "rgba(15, 23, 42, 0.65)",
    backdropFilter: "blur(8px)",
    borderBottom: "1px solid rgba(148, 163, 184, 0.14)",
    gap: "1rem",
    flexWrap: "wrap",
  },
  channelBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.55rem",
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#e2e8f0",
  },
  rightControls: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    flexWrap: "wrap",
  },
  clockBox: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.95rem",
    color: "#cbd5e1",
  },
  fsBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.45rem",
    background: "rgba(37, 99, 235, 0.25)",
    color: "#bfdbfe",
    border: "1px solid rgba(96, 165, 250, 0.4)",
    borderRadius: "8px",
    padding: "0.45rem 0.8rem",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  canvas: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
  },
  fallbackCard: {
    maxWidth: "600px",
    width: "100%",
    textAlign: "center",
    background: "rgba(15, 23, 42, 0.72)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    borderRadius: "18px",
    padding: "3rem 2rem",
  },
  fallbackTitle: {
    margin: 0,
    fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
  },
  fallbackText: {
    margin: "0.85rem 0 0",
    fontSize: "1.1rem",
    color: "#94a3b8",
    lineHeight: 1.5,
  },
  slideCard: {
    width: "100%",
    maxWidth: "1200px",
    background: "rgba(15, 23, 42, 0.78)",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    borderRadius: "20px",
    padding: "2rem",
    boxShadow: "0 25px 60px rgba(0, 0, 0, 0.5)",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  slideHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
  },
  typeBadge: {
    background: "rgba(59, 130, 246, 0.22)",
    color: "#93c5fd",
    border: "1px solid rgba(96, 165, 250, 0.35)",
    padding: "0.3rem 0.8rem",
    borderRadius: "999px",
    fontSize: "0.8rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
  },
  counterText: {
    fontSize: "0.9rem",
    color: "#94a3b8",
  },
  slideBody: {
    display: "grid",
    gap: "2rem",
    alignItems: "center",
  },
  imageWrapper: {
    width: "100%",
    maxHeight: "55vh",
    overflow: "hidden",
    borderRadius: "14px",
    background: "#020617",
  },
  slideImage: {
    width: "100%",
    height: "100%",
    maxHeight: "55vh",
    objectFit: "cover",
    display: "block",
  },
  textColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  slideTitle: {
    margin: 0,
    fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
    lineHeight: 1.15,
    letterSpacing: "-0.02em",
  },
  slideDesc: {
    margin: 0,
    fontSize: "clamp(1.1rem, 2vw, 1.5rem)",
    color: "#cbd5e1",
    lineHeight: 1.5,
  },
  dotsRow: {
    display: "flex",
    justifyContent: "center",
    gap: "0.5rem",
    paddingTop: "0.25rem",
  },
  dot: {
    height: "10px",
    borderRadius: "999px",
    border: "none",
    cursor: "pointer",
    transition: "all 0.25s ease",
  },
};