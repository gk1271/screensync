import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Lock, Tv } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If already signed in, send straight to /admin
  if (user) {
    return <Navigate to="/admin" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate("/admin", { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid email or password. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.badge}>
            <Tv size={22} />
          </div>
          <h1 style={styles.title}>ScreenSync Admin</h1>
          <p style={styles.subtitle}>
            Sign in to manage digital signage schedules and screens
          </p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label htmlFor="email" style={styles.label}>
              Admin Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@screensync.local"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={submitting} style={styles.button}>
            <Lock size={16} />
            <span>{submitting ? "Signing in..." : "Sign In"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0b1120",
    color: "#f8fafc",
    padding: "1.5rem",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    background: "#111827",
    border: "1px solid #1f2937",
    borderRadius: "12px",
    padding: "2rem",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
  },
  header: {
    textAlign: "center",
    marginBottom: "1.5rem",
  },
  badge: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    background: "rgba(59, 130, 246, 0.15)",
    color: "#60a5fa",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "0.75rem",
  },
  title: {
    margin: 0,
    fontSize: "1.5rem",
  },
  subtitle: {
    margin: "0.4rem 0 0",
    fontSize: "0.9rem",
    color: "#94a3b8",
  },
  errorBox: {
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.4)",
    color: "#fca5a5",
    padding: "0.75rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    marginBottom: "1rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  label: {
    fontSize: "0.875rem",
    color: "#cbd5e1",
  },
  input: {
    padding: "0.65rem 0.8rem",
    borderRadius: "8px",
    border: "1px solid #374151",
    background: "#0f172a",
    color: "#f8fafc",
    fontSize: "0.95rem",
  },
  button: {
    marginTop: "0.5rem",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: 600,
    fontSize: "0.95rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  },
};