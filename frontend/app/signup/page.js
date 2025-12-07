"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      console.log("API URL:", apiUrl);
      console.log("Full URL:", `${apiUrl}/api/auth/signup`);
      console.log("Form data:", form);
      
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
      
      console.log("Sending signup request...");
      const res = await fetch(`${apiUrl}/api/auth/signup`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(form),
        mode: "cors",
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log("Response status:", res.status);

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Server error" }));
        setMessage(data.message || data.error || `Signup failed (${res.status})`);
        return;
      }

      const data = await res.json();
      console.log("Response data:", data);
      
      if (data.token) {
        localStorage.setItem("token", data.token);
        router.push("/dashboard");
      } else {
        setMessage("Account created but no token received. Please login.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Signup error:", err);
      console.error("Error details:", {
        message: err.message,
        name: err.name,
        stack: err.stack,
        apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      });
      
      // More helpful error message
      if (err.name === 'AbortError' || err.name === 'TimeoutError') {
        setMessage("Request timed out after 60 seconds. The Render server may be starting up. Please wait a moment and try again.");
      } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('Network request failed')) {
        setMessage(`Cannot connect to server. Possible reasons:
        • Backend is sleeping (Render free tier) - wait 30-60 seconds and try again
        • Check your internet connection
        • Open browser console (F12) and check for CORS errors
        • API URL: ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}`);
      } else {
        setMessage(`Error: ${err.message}`);
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
            href="/login"
            className="px-6 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 rounded-full hover:border-blue-600 dark:hover:border-blue-500 transition-colors font-medium"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Signup Card */}
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Create Account
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Join CollabVerse and start collaborating
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                name="name"
                placeholder="Name"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <input
                name="email"
                type="email"
                placeholder="Email"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <input
                name="password"
                type="password"
                placeholder="Password"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          {message && (
            <p className="mt-4 text-center text-red-600 dark:text-red-400 text-sm">
              {message}
            </p>
          )}

          <p className="mt-6 text-center text-gray-600 dark:text-gray-400 text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
