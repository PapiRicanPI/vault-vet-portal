import { useState, useEffect } from "react";
import { useAuth } from "../_core/hooks/useAuth";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { user, loading: authLoading } = useAuth();

  // If already authenticated as admin, redirect to dashboard immediately
  useEffect(() => {
    if (!authLoading && user && user.role === "admin") {
      window.location.replace("/admin");
    }
  }, [authLoading, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Login failed. Please try again.");
        setLoading(false);
        return;
      }
      if (data.token) {
        // Persist token — this is the single source of truth for auth
        localStorage.setItem("vault_admin_token", data.token);
        // Navigate to dashboard. The tRPC client in main.tsx will pick up
        // the token from localStorage on the next page load.
        window.location.href = "/admin";
      } else {
        setError("No token received from server.");
        setLoading(false);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  // While checking existing auth, show a minimal loading state
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
        <div style={{ color: "#888", fontSize: "0.9rem" }}>Checking session...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", padding: "1.5rem" }}>
      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: "420px", background: "#141414", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "2.5rem 2rem" }}>
        <h1 style={{ color: "#e8d9b5", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem", textAlign: "center", letterSpacing: "0.02em" }}>THE VAULT INVESTIGATES</h1>
        <p style={{ color: "#888", fontSize: "0.9rem", textAlign: "center", marginBottom: "2rem" }}>Admin Access</p>
        <label htmlFor="password" style={{ display: "block", color: "#ccc", fontSize: "0.9rem", marginBottom: "0.5rem" }}>Password</label>
        <input
          id="password"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: "100%", padding: "0.9rem 1rem", fontSize: "1rem", background: "#1c1c1c", border: "1px solid #333", borderRadius: "8px", color: "#fff", marginBottom: "1.25rem", boxSizing: "border-box" }}
        />
        {error && <div style={{ color: "#ff6b6b", fontSize: "0.9rem", marginBottom: "1rem", textAlign: "center" }}>{error}</div>}
        <button
          type="submit"
          disabled={loading || !password}
          style={{ width: "100%", padding: "0.9rem", fontSize: "1rem", fontWeight: 600, background: loading || !password ? "#5a4a2a" : "#d4af37", color: "#0a0a0a", border: "none", borderRadius: "8px", cursor: loading || !password ? "not-allowed" : "pointer" }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
