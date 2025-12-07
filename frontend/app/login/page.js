"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      console.log("API URL:", apiUrl);
      console.log("Full URL:", `${apiUrl}/api/auth/login`);
      
      // First, test if backend is reachable
      try {
        const healthCheck = await fetch(`${apiUrl}/`, {
          method: "GET",
          mode: "cors",
          signal: AbortSignal.timeout(10000), // 10 second timeout for health check
        });
        console.log("Health check status:", healthCheck.status);
      } catch (healthError) {
        console.warn("Health check failed, but continuing:", healthError);
      }
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for Render wake-up
      
      console.log("Sending login request...");
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ email, password }),
        mode: "cors",
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log("Response status:", res.status);

      if (!res.ok) {
        // Check if response is HTML (error page) or JSON
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          const text = await res.text();
          console.error("Server returned HTML error page:", text);
          setError("Server error. Please try again or check backend logs.");
          setLoading(false);
          return;
        }
        
        const data = await res.json().catch(() => ({ message: "Server error" }));
        setError(data.message || data.error || `Login failed (${res.status})`);
        setLoading(false);
        return;
      }

      const data = await res.json();
      console.log("Response data:", data);
      
      if (data.token) {
        localStorage.setItem("token", data.token);
        router.push("/dashboard");
      } else {
        setError("No token received from server");
        setLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      console.error("Error details:", {
        message: err.message,
        name: err.name,
        stack: err.stack,
        apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      });
      
      // More helpful error message
      if (err.name === 'AbortError' || err.name === 'TimeoutError') {
        setError("Request timed out after 60 seconds. The Render server may be starting up. Please wait a moment and try again.");
      } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('Network request failed')) {
        setError(`Cannot connect to server. Possible reasons:
        • Backend is sleeping (Render free tier) - wait 30-60 seconds and try again
        • Check your internet connection
        • Open browser console (F12) and check for CORS errors
        • API URL: ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}`);
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-6 py-12">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 px-6 py-4 sm:px-8 sm:py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
            CollabVerse
          </Link>
          <Link
            href="/signup"
            className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-medium"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Login Card */}
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Log in to continue to CollabVerse
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <input
                placeholder="Email"
                type="email"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <input
                placeholder="Password"
                type="password"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {error && (
            <p className="mt-4 text-center text-red-600 dark:text-red-400 text-sm">
              {error}
            </p>
          )}

          <p className="mt-6 text-center text-gray-600 dark:text-gray-400 text-sm">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
