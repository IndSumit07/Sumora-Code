"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (r) => {
        if (!r.ok) throw new Error("Not authenticated");
        return r.json();
      })
      .then((data) => {
        if (data.authenticated) {
          router.replace("/");
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.replace("/");
      } else {
        const data = await res.json();
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="login-loading">
        <div className="skeleton login-loading-brand" />
        <div className="skeleton login-loading-sub" />
        <div style={{ height: 24 }} />
        <div className="skeleton" style={{ width: "100%", maxWidth: 328, height: 44, borderRadius: 10 }} />
        <div className="skeleton" style={{ width: "100%", maxWidth: 328, height: 44, borderRadius: 10 }} />
        <div style={{ height: 8 }} />
        <div className="skeleton" style={{ width: "100%", maxWidth: 328, height: 44, borderRadius: 10 }} />
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">SUMORA CODE</div>
        <div className="login-subtitle">Sign in to continue</div>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            className="login-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <input
            type="password"
            className="login-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span className="spinner" />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
