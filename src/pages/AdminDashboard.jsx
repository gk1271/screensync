import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  Edit3,
  ExternalLink,
  LogOut,
  Monitor,
  Plus,
  Power,
  Trash2,
} from "lucide-react";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import ContentFormModal from "../components/Admin/ContentFormModal";
import { isContentScheduledNow } from "../utils/scheduleUtils";

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  const [contents, setContents] = useState([]);
  const [screens, setScreens] = useState([]);
  const [loadingContents, setLoadingContents] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Modal state for Add/Edit content
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Quick screen registration state
  const [screenIdInput, setScreenIdInput] = useState("");
  const [screenNameInput, setScreenNameInput] = useState("");
  const [screenLocationInput, setScreenLocationInput] = useState("");
  const [savingScreen, setSavingScreen] = useState(false);

  // Real-time listener for 'contents'
  useEffect(() => {
    const q = query(collection(db, "contents"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rows = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setContents(rows);
        setLoadingContents(false);
        setErrorMsg("");
      },
      (err) => {
        console.error("Error listening to contents:", err);
        setErrorMsg("Unable to load signage contents from Firestore.");
        setLoadingContents(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Real-time listener for 'screens'
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "screens"),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setScreens(list);
      },
      (err) => {
        console.error("Error listening to screens:", err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Live dashboard statistics
  const stats = useMemo(() => {
    const total = contents.length;
    const activeNow = contents.filter((item) =>
      isContentScheduledNow(item)
    ).length;
    const ads = contents.filter((item) => item.contentType === "ad").length;
    const announcements = contents.filter(
      (item) => item.contentType !== "ad"
    ).length;

    return { total, activeNow, ads, announcements, screenCount: screens.length };
  }, [contents, screens]);

  const filteredContents = useMemo(() => {
    if (typeFilter === "all") return contents;
    return contents.filter((item) => item.contentType === typeFilter);
  }, [contents, typeFilter]);

  function openAddModal() {
    setEditingItem(null);
    setModalOpen(true);
  }

  function openEditModal(item) {
    setEditingItem(item);
    setModalOpen(true);
  }

  async function handleSaveContent(payload) {
    setErrorMsg("");
    if (editingItem) {
      await updateDoc(doc(db, "contents", editingItem.id), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } else {
      await addDoc(collection(db, "contents"), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }
  }

  async function handleToggleActive(item) {
    try {
      await updateDoc(doc(db, "contents", item.id), {
        isActive: !item.isActive,
      });
    } catch (err) {
      console.error("Toggle failed:", err);
      setErrorMsg("Failed to update active status.");
    }
  }

  async function handleDeleteContent(item) {
    const confirmed = window.confirm(
      `Delete "${item.title}"? This removes it from all screens immediately.`
    );
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "contents", item.id));
    } catch (err) {
      console.error("Delete failed:", err);
      setErrorMsg("Failed to delete content item.");
    }
  }

  async function handleAddScreen(e) {
    e.preventDefault();
    const cleanId = screenIdInput
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, "_");

    if (!cleanId || !screenNameInput.trim()) {
      setErrorMsg("Please provide both a Screen ID and Screen Name.");
      return;
    }

    setSavingScreen(true);
    setErrorMsg("");
    try {
      await setDoc(doc(db, "screens", cleanId), {
        name: screenNameInput.trim(),
        location: screenLocationInput.trim() || "General Area",
        createdAt: serverTimestamp(),
      });
      setScreenIdInput("");
      setScreenNameInput("");
      setScreenLocationInput("");
    } catch (err) {
      console.error("Failed to save screen:", err);
      setErrorMsg("Could not register screen.");
    } finally {
      setSavingScreen(false);
    }
  }

  async function handleDeleteScreen(id) {
    try {
      await deleteDoc(doc(db, "screens", id));
    } catch (err) {
      console.error("Failed to delete screen:", err);
      setErrorMsg("Could not remove screen.");
    }
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>ScreenSync Control Center</h1>
          <p style={styles.subtext}>
            Signed in as <strong>{user?.email}</strong>
          </p>
        </div>

        <div style={styles.headerActions}>
          <Link to="/display" target="_blank" style={styles.linkBtn}>
            <ExternalLink size={16} />
            <span>Open Display (All)</span>
          </Link>
          <button onClick={openAddModal} style={styles.primaryBtn}>
            <Plus size={16} />
            <span>New Content</span>
          </button>
          <button onClick={logout} style={styles.ghostBtn}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

      {/* Statistics Cards */}
      <section style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Total Items</span>
          <strong style={styles.statValue}>{stats.total}</strong>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Live Right Now</span>
          <strong style={{ ...styles.statValue, color: "#4ade80" }}>
            {stats.activeNow}
          </strong>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Advertisements</span>
          <strong style={styles.statValue}>{stats.ads}</strong>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Announcements</span>
          <strong style={styles.statValue}>{stats.announcements}</strong>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Registered Screens</span>
          <strong style={styles.statValue}>{stats.screenCount}</strong>
        </div>
      </section>

      {/* Content List Section */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Scheduled Content</h2>
          <div style={styles.filterGroup}>
            {["all", "ad", "announcement"].map((tab) => (
              <button
                key={tab}
                onClick={() => setTypeFilter(tab)}
                style={{
                  ...styles.filterBtn,
                  background: typeFilter === tab ? "#2563eb" : "#1f2937",
                  color: typeFilter === tab ? "#fff" : "#cbd5e1",
                }}
              >
                {tab === "all"
                  ? "All"
                  : tab === "ad"
                  ? "Ads"
                  : "Announcements"}
              </button>
            ))}
          </div>
        </div>

        {loadingContents ? (
          <div style={styles.emptyBox}>Loading signage content...</div>
        ) : filteredContents.length === 0 ? (
          <div style={styles.emptyBox}>
            No content items found. Click <strong>New Content</strong> to create
            your first announcement or advertisement.
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Title</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Screen</th>
                  <th style={styles.th}>Schedule</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContents.map((item) => {
                  const liveNow = isContentScheduledNow(item);
                  return (
                    <tr key={item.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.itemTitle}>{item.title}</div>
                        {item.description && (
                          <div style={styles.itemDesc}>{item.description}</div>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.typePill}>
                          {item.contentType === "ad" ? "Ad" : "Announcement"}
                        </span>
                      </td>
                      <td style={styles.td}>{item.screenId || "ALL"}</td>
                      <td style={styles.td}>
                        <div style={styles.mono}>
                          {item.startDate || "Any"} → {item.endDate || "Any"}
                        </div>
                        <div style={styles.mono}>
                          {item.startTime || "00:00"} – {item.endTime || "23:59"}
                        </div>
                      </td>
                      <td style={styles.td}>
                        {!item.isActive ? (
                          <span style={styles.statusDisabled}>Disabled</span>
                        ) : liveNow ? (
                          <span style={styles.statusLive}>Live Now</span>
                        ) : (
                          <span style={styles.statusScheduled}>Scheduled</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionRow}>
                          <button
                            type="button"
                            title={item.isActive ? "Disable" : "Enable"}
                            onClick={() => handleToggleActive(item)}
                            style={styles.iconAction}
                          >
                            <Power size={15} />
                          </button>
                          <button
                            type="button"
                            title="Edit"
                            onClick={() => openEditModal(item)}
                            style={styles.iconAction}
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => handleDeleteContent(item)}
                            style={styles.dangerAction}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Screen Management Section */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Digital Screens</h2>

        <form onSubmit={handleAddScreen} style={styles.screenForm}>
          <input
            type="text"
            placeholder="Screen ID (e.g. SCREEN_LOBBY)"
            value={screenIdInput}
            onChange={(e) => setScreenIdInput(e.target.value)}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Screen Name (e.g. Lobby Display)"
            value={screenNameInput}
            onChange={(e) => setScreenNameInput(e.target.value)}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Location (e.g. Ground Floor)"
            value={screenLocationInput}
            onChange={(e) => setScreenLocationInput(e.target.value)}
            style={styles.input}
          />
          <button type="submit" disabled={savingScreen} style={styles.primaryBtn}>
            <Monitor size={16} />
            <span>{savingScreen ? "Saving..." : "Add Screen"}</span>
          </button>
        </form>

        {screens.length === 0 ? (
          <div style={styles.emptyBox}>
            No custom screens registered yet. Screens can also open{" "}
            <code>/display</code> directly or <code>/display/SCREEN_LOBBY</code>.
          </div>
        ) : (
          <div style={styles.screensGrid}>
            {screens.map((scr) => (
              <div key={scr.id} style={styles.screenCard}>
                <div>
                  <div style={styles.itemTitle}>{scr.name}</div>
                  <div style={styles.mono}>{scr.id}</div>
                  <div style={styles.itemDesc}>{scr.location}</div>
                </div>
                <div style={styles.screenCardActions}>
                  <Link
                    to={`/display/${scr.id}`}
                    target="_blank"
                    style={styles.smallLink}
                  >
                    Launch View
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDeleteScreen(scr.id)}
                    style={styles.dangerAction}
                    title="Remove screen"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ContentFormModal
        isOpen={modalOpen}
        initialData={editingItem}
        screens={screens}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveContent}
      />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b1120",
    color: "#f8fafc",
    padding: "1.5rem",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
    flexWrap: "wrap",
    marginBottom: "1.5rem",
    paddingBottom: "1rem",
    borderBottom: "1px solid #1e293b",
  },
  title: { margin: 0, fontSize: "1.5rem" },
  subtext: { margin: "0.25rem 0 0", color: "#94a3b8", fontSize: "0.875rem" },
  headerActions: { display: "flex", gap: "0.6rem", flexWrap: "wrap" },
  primaryBtn: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "0.6rem 0.95rem",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.875rem",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  ghostBtn: {
    background: "#111827",
    color: "#e2e8f0",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "0.6rem 0.9rem",
    cursor: "pointer",
    fontSize: "0.875rem",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  linkBtn: {
    background: "#0f172a",
    color: "#93c5fd",
    border: "1px solid #1e3a8a",
    borderRadius: "8px",
    padding: "0.6rem 0.9rem",
    textDecoration: "none",
    fontSize: "0.875rem",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  errorBox: {
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.4)",
    color: "#fca5a5",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    marginBottom: "1.25rem",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "1rem",
    marginBottom: "1.75rem",
  },
  statCard: {
    background: "#111827",
    border: "1px solid #1f2937",
    borderRadius: "10px",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
  },
  statLabel: { fontSize: "0.8rem", color: "#94a3b8" },
  statValue: { fontSize: "1.6rem" },
  section: {
    background: "#111827",
    border: "1px solid #1f2937",
    borderRadius: "12px",
    padding: "1.25rem",
    marginBottom: "1.5rem",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
    flexWrap: "wrap",
    marginBottom: "1rem",
  },
  sectionTitle: { margin: 0, fontSize: "1.15rem" },
  filterGroup: { display: "flex", gap: "0.4rem" },
  filterBtn: {
    border: "1px solid #334155",
    borderRadius: "7px",
    padding: "0.35rem 0.7rem",
    cursor: "pointer",
    fontSize: "0.82rem",
  },
  emptyBox: {
    background: "#0f172a",
    border: "1px dashed #334155",
    borderRadius: "8px",
    padding: "1.5rem",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "0.9rem",
  },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" },
  th: {
    textAlign: "left",
    padding: "0.65rem",
    color: "#94a3b8",
    borderBottom: "1px solid #1f2937",
    fontWeight: 600,
  },
  tr: { borderBottom: "1px solid #1a2234" },
  td: { padding: "0.75rem 0.65rem", verticalAlign: "top" },
  itemTitle: { fontWeight: 600, color: "#f8fafc" },
  itemDesc: { fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.2rem" },
  typePill: {
    background: "#1e293b",
    color: "#cbd5e1",
    padding: "0.2rem 0.55rem",
    borderRadius: "999px",
    fontSize: "0.75rem",
  },
  mono: { fontFamily: "monospace", fontSize: "0.78rem", color: "#cbd5e1" },
  statusLive: {
    background: "rgba(34, 197, 94, 0.16)",
    color: "#4ade80",
    padding: "0.2rem 0.55rem",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  statusScheduled: {
    background: "rgba(59, 130, 246, 0.16)",
    color: "#93c5fd",
    padding: "0.2rem 0.55rem",
    borderRadius: "999px",
    fontSize: "0.75rem",
  },
  statusDisabled: {
    background: "rgba(148, 163, 184, 0.15)",
    color: "#94a3b8",
    padding: "0.2rem 0.55rem",
    borderRadius: "999px",
    fontSize: "0.75rem",
  },
  actionRow: { display: "flex", gap: "0.4rem" },
  iconAction: {
    background: "#1f2937",
    color: "#e2e8f0",
    border: "1px solid #334155",
    borderRadius: "6px",
    padding: "0.38rem",
    cursor: "pointer",
    display: "inline-flex",
  },
  dangerAction: {
    background: "rgba(239, 68, 68, 0.14)",
    color: "#fca5a5",
    border: "1px solid rgba(239, 68, 68, 0.35)",
    borderRadius: "6px",
    padding: "0.38rem",
    cursor: "pointer",
    display: "inline-flex",
  },
  screenForm: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "0.65rem",
    marginBottom: "1rem",
  },
  input: {
    padding: "0.55rem 0.75rem",
    borderRadius: "8px",
    border: "1px solid #374151",
    background: "#0f172a",
    color: "#f8fafc",
    fontSize: "0.88rem",
  },
  screensGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "0.85rem",
  },
  screenCard: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "10px",
    padding: "0.9rem",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "0.75rem",
  },
  screenCardActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  smallLink: {
    color: "#60a5fa",
    fontSize: "0.82rem",
    textDecoration: "none",
    fontWeight: 600,
  },
};