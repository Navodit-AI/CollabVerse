"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        router.push("/dashboard");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-[#0f172a] flex items-center justify-center px-6 py-12">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 border-b border-[#e2e8f0] dark:border-[#1e293b] bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-[#1a1d29] dark:text-white">
            CollabVerse
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors font-medium"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Login Card */}
      <div className="w-full max-w-md mt-16">
        <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-[#e2e8f0] dark:border-[#334155] p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-[#1a1d29] dark:text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
              Log in to continue to CollabVerse
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                placeholder="Email"
                type="email"
                className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0f172a] text-[#1a1d29] dark:text-white placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent transition-all text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <input
                placeholder="Password"
                type="password"
                className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0f172a] text-[#1a1d29] dark:text-white placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent transition-all text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2.5 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors font-medium text-sm"
            >
              Login
            </button>
          </form>

          {error && (
            <p className="mt-4 text-center text-red-600 dark:text-red-400 text-xs">
              {error}
            </p>
          )}

          <p className="mt-6 text-center text-sm text-[#64748b] dark:text-[#94a3b8]">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-[#4f46e5] dark:text-[#6366f1] hover:text-[#4338ca] dark:hover:text-[#818cf8] font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
