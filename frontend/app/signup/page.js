"use client";
import { useState } from "react";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Registering...");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Signup successful!");
      } else {
        setMessage(`❌ ${data.message || "Signup failed"}`);
      }
    } catch (error) {
      console.error("Signup error:", error);
      setMessage("⚠️ Network error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-md w-80 space-y-4"
      >
        <h2 className="text-xl font-semibold text-center">Sign Up</h2>
        <input
          name="name"
          type="text"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Sign Up
        </button>
        <p className="text-sm text-center">{message}</p>
      </form>
    </div>
  );
}
