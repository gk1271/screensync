import { useEffect, useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { getLocalDateString, isSafeImageUrl } from "../../utils/scheduleUtils";

const EMPTY_FORM = {
  title: "",
  description: "",
  imageUrl: "",
  contentType: "announcement",
  startDate: getLocalDateString(),
  endDate: getLocalDateString(),
  startTime: "00:00",
  endTime: "23:59",
  screenId: "ALL",
  isActive: true,
};

export default function ContentFormModal({
  isOpen,
  initialData,
  screens = [],
  onClose,
  onSave,
}) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [showPreview, setShowPreview] = useState(true);
  const [validationError, setValidationError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        imageUrl: initialData.imageUrl || "",
        contentType: initialData.contentType || "announcement",
        startDate: initialData.startDate || getLocalDateString(),
        endDate: initialData.endDate || getLocalDateString(),
        startTime: initialData.startTime || "00:00",
        endTime: initialData.endTime || "23:59",
        screenId: initialData.screenId || "ALL",
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
      });
    } else {
      setFormData({
        ...EMPTY_FORM,
        startDate: getLocalDateString(),
        endDate: getLocalDateString(),
      });
    }
    setValidationError("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setValidationError("");

    if (!formData.title.trim()) {
      setValidationError("Title is required.");
      return;
    }

    if (formData.imageUrl.trim() && !isSafeImageUrl(formData.imageUrl)) {
      setValidationError("Image URL must be a valid http:// or https:// link.");
      return;
    }

    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      setValidationError("End date cannot be earlier than start date.");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        imageUrl: formData.imageUrl.trim(),
        screenId: (formData.screenId || "ALL").trim(),
      });
      onClose();
    } catch (err) {
      console.error("Error saving content:", err);
      setValidationError(err.message || "Failed to save content.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <div style={styles.topBar}>
          <h2 style={styles.heading}>
            {initialData ? "Edit Signage Content" : "Add Signage Content"}
          </h2>
          <div style={styles.topActions}>
            <button
              type="button"
              onClick={() => setShowPreview((prev) => !prev)}
              style={styles.secondaryBtn}
            >
              {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>{showPreview ? "Hide Preview" : "Show Preview"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={styles.iconBtn}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {validationError && <div style={styles.errorBox}>{validationError}</div>}

        <div
          style={{
            ...styles.grid,
            gridTemplateColumns: showPreview
              ? "repeat(auto-fit, minmax(300px, 1fr))"
              : "1fr",
          }}
        >
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Title *</label>
              <input
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Campus Tech Fest Registrations Open"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Description</label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Short details shown on the display screen..."
                style={styles.textarea}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Image URL (Optional)</label>
              <input
                name="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://images.unsplash.com/..."
                style={styles.input}
              />
            </div>

            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Content Type</label>
                <select
                  name="contentType"
                  value={formData.contentType}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="announcement">Announcement</option>
                  <option value="ad">Advertisement</option>
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Target Screen</label>
                <select
                  name="screenId"
                  value={formData.screenId}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="ALL">All Screens (ALL)</option>
                  {screens.map((scr) => (
                    <option key={scr.id} value={scr.id}>
                      {scr.name || scr.id} ({scr.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Start Date</label>
                <input
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>End Date</label>
                <input
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Start Time (24h)</label>
                <input
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>End Time (24h)</label>
                <input
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>

            <label style={styles.checkboxRow}>
              <input
                name="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={handleChange}
              />
              <span>Enabled (Active for scheduling)</span>
            </label>

            <div style={styles.footerActions}>
              <button type="button" onClick={onClose} style={styles.secondaryBtn}>
                Cancel
              </button>
              <button type="submit" disabled={saving} style={styles.primaryBtn}>
                {saving
                  ? "Saving..."
                  : initialData
                  ? "Update Content"
                  : "Publish Content"}
              </button>
            </div>
          </form>

          {showPreview && (
            <div style={styles.previewPane}>
              <div style={styles.previewLabel}>LIVE DISPLAY PREVIEW</div>
              <div style={styles.previewScreen}>
                <span style={styles.badge}>
                  {formData.contentType === "ad" ? "ADVERTISEMENT" : "ANNOUNCEMENT"}
                </span>
                {isSafeImageUrl(formData.imageUrl) && (
                  <img
                    src={formData.imageUrl}
                    alt={formData.title || "Preview"}
                    style={styles.previewImg}
                  />
                )}
                <h3 style={styles.previewTitle}>
                  {formData.title || "Your Headline Appears Here"}
                </h3>
                <p style={styles.previewDesc}>
                  {formData.description ||
                    "Your announcement or promotional message will be displayed cleanly for viewers."}
                </p>
                <div style={styles.previewMeta}>
                  <span>Screen: {formData.screenId || "ALL"}</span>
                  <span>
                    {formData.startTime} – {formData.endTime}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(2, 6, 23, 0.78)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
    zIndex: 50,
    overflowY: "auto",
  },
  modal: {
    width: "100%",
    maxWidth: "880px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#111827",
    color: "#f8fafc",
    border: "1px solid #1f2937",
    borderRadius: "12px",
    padding: "1.5rem",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "1rem",
    flexWrap: "wrap",
  },
  heading: { margin: 0, fontSize: "1.25rem" },
  topActions: { display: "flex", alignItems: "center", gap: "0.5rem" },
  iconBtn: {
    background: "#1f2937",
    color: "#e2e8f0",
    border: "none",
    borderRadius: "8px",
    padding: "0.45rem",
    cursor: "pointer",
    display: "inline-flex",
  },
  secondaryBtn: {
    background: "#1f2937",
    color: "#e2e8f0",
    border: "1px solid #374151",
    borderRadius: "8px",
    padding: "0.5rem 0.85rem",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "0.875rem",
  },
  primaryBtn: {
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "0.55rem 1rem",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.875rem",
  },
  errorBox: {
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.4)",
    color: "#fca5a5",
    padding: "0.7rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    fontSize: "0.875rem",
  },
  grid: { display: "grid", gap: "1.5rem", alignItems: "start" },
  form: { display: "flex", flexDirection: "column", gap: "0.85rem" },
  row: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "0.75rem",
  },
  field: { display: "flex", flexDirection: "column", gap: "0.35rem" },
  label: { fontSize: "0.82rem", color: "#cbd5e1" },
  input: {
    padding: "0.55rem 0.7rem",
    borderRadius: "8px",
    border: "1px solid #374151",
    background: "#0f172a",
    color: "#f8fafc",
    fontSize: "0.9rem",
  },
  textarea: {
    padding: "0.55rem 0.7rem",
    borderRadius: "8px",
    border: "1px solid #374151",
    background: "#0f172a",
    color: "#f8fafc",
    fontSize: "0.9rem",
    resize: "vertical",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  footerActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.6rem",
    marginTop: "0.5rem",
  },
  previewPane: {
    background: "#090d16",
    border: "1px solid #1e293b",
    borderRadius: "10px",
    padding: "1rem",
  },
  previewLabel: {
    fontSize: "0.72rem",
    letterSpacing: "0.08em",
    color: "#60a5fa",
    fontWeight: 700,
    marginBottom: "0.6rem",
  },
  previewScreen: {
    background: "linear-gradient(145deg, #111827, #1e293b)",
    borderRadius: "10px",
    padding: "1.25rem",
    minHeight: "260px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "0.65rem",
  },
  badge: {
    alignSelf: "flex-start",
    background: "rgba(37, 99, 235, 0.25)",
    color: "#93c5fd",
    padding: "0.2rem 0.55rem",
    borderRadius: "999px",
    fontSize: "0.7rem",
    fontWeight: 700,
  },
  previewImg: {
    width: "100%",
    maxHeight: "150px",
    objectFit: "cover",
    borderRadius: "8px",
  },
  previewTitle: { margin: 0, fontSize: "1.15rem" },
  previewDesc: { margin: 0, fontSize: "0.88rem", color: "#cbd5e1" },
  previewMeta: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.75rem",
    color: "#94a3b8",
    marginTop: "auto",
    paddingTop: "0.5rem",
    borderTop: "1px solid rgba(148, 163, 184, 0.15)",
  },
};