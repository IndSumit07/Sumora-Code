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
        if (data.authenticated) router.replace("/");
        else setChecking(false);
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
      <div className="min-h-screen flex bg-white dark:bg-[#0d0d0d]">
        {/* Left skeleton */}
        <div className="hidden lg:block lg:w-[45%] xl:w-[40%] m-3 rounded-2xl bg-[#111] animate-pulse" />
        {/* Right skeleton */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16">
          <div className="w-full max-w-md space-y-5">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-md bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="w-32 h-6 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            </div>
            <div className="w-48 h-8 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="w-64 h-4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-6" />
            <div className="w-full h-11 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="w-full h-11 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="w-full h-11 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-[#0d0d0d]">
      {/* ── Left Panel — Hero (always dark) ────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative overflow-hidden rounded-2xl m-3 bg-[#0d0d0d] flex-col">
        {/* Animated gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/40 via-[#0d0d0d] to-[#0d0d0d]" />
          {/* Glowing orbs */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#e8600a]/20 rounded-full blur-[80px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-orange-500/10 rounded-full blur-[60px]" />
          {/* Code lines decoration */}
          <div className="absolute inset-0 overflow-hidden opacity-10">
            {["public class Solution {", "  public int twoSum(int[] n) {", "    Map<Integer, Integer> map", "    for (int i = 0; i < n.length; i++) {", "      int comp = target - n[i];", "      if (map.containsKey(comp))", "        return new int[]{map.get(comp), i};", "      map.put(n[i], i);", "    }", "  }", "}"].map((line, i) => (
              <div
                key={i}
                className="text-[11px] font-mono text-orange-300 whitespace-nowrap px-10"
                style={{ marginTop: i === 0 ? "30%" : "0.35rem" }}
              >
                {line}
              </div>
            ))}
          </div>
          {/* Top overlay for text */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 from-5% via-transparent via-40% to-transparent" />
        </div>

        {/* Hero text */}
        <div className="relative z-10 flex flex-col justify-between h-full p-10 pt-16">
          <div>
            {/* Brand mark on left panel */}
            <div className="flex items-center gap-2.5 mb-12">
              <div className="w-8 h-8 rounded-lg bg-[#e8600a] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <span className="text-white text-sm font-semibold tracking-tight opacity-70">Sumora Code</span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight drop-shadow-lg">
              Practice smarter,<br />code faster,<br />
              <span className="text-[#e8600a]">win every round.</span>
            </h1>
          </div>

          {/* Bottom stats */}
          <div className="flex gap-8 pb-4">
            {[["Java", "Full support"], ["C++", "Full support"], ["AI Editor", "Coming soon"]].map(([label, sub]) => (
              <div key={label}>
                <div className="text-white font-bold text-sm">{label}</div>
                <div className="text-white/40 text-xs mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel — Login Form ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16 transition-colors duration-300">
        <div className="w-full max-w-md">

          {/* Logo + Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-[#e8600a] flex items-center justify-center shadow-sm flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <span className="text-[#111] dark:text-white text-2xl font-bold tracking-tight transition-colors">
              Sumora Code
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#111] dark:text-white mb-1.5 transition-colors">
              Welcome Back
            </h2>
            <p className="text-[#666] dark:text-[#888] text-sm transition-colors">
              Sign in to your Sumora Code account
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="login-email" className="text-sm text-[#444] dark:text-[#ccc] font-medium transition-colors">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoFocus
                placeholder="hi@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 rounded-lg border border-[#ddd] dark:border-[#333] bg-white dark:bg-[#141414] px-3.5 text-sm text-[#111] dark:text-white placeholder:text-[#aaa] dark:placeholder:text-[#555] outline-none transition-colors focus:border-[#e8600a] dark:focus:border-[#e8600a] focus:ring-2 focus:ring-[#e8600a]/20"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="login-password" className="text-sm text-[#444] dark:text-[#ccc] font-medium transition-colors">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 rounded-lg border border-[#ddd] dark:border-[#333] bg-white dark:bg-[#141414] px-3.5 text-sm text-[#111] dark:text-white placeholder:text-[#aaa] dark:placeholder:text-[#555] outline-none transition-colors focus:border-[#e8600a] dark:focus:border-[#e8600a] focus:ring-2 focus:ring-[#e8600a]/20"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500 font-medium bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              id="login-submit-btn"
              className="w-full h-11 rounded-lg bg-[#e8600a] text-white text-sm font-semibold transition-all hover:bg-[#d45509] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  Signing in…
                </span>
              ) : (
                "Log in to your account"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
