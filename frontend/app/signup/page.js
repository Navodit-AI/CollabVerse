"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell, { AuthError, AuthLink } from "@/components/AuthShell";
import { api, saveSession } from "@/lib/api";

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api("/api/auth/signup", { method: "POST", body: form });
      if (!data?.token) {
        router.push("/login");
        return;
      }
      saveSession(data);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <AuthShell
      title={<>Join the <em>verse</em></>}
      subtitle="Post an idea, find your people, ship it together."
      footer={<>Already have an account? <AuthLink href="/login">Log in</AuthLink></>}
      aside={
        <div className="max-w-lg">
          <p className="display text-6xl xl:text-7xl mb-8">
            Stop building <em className="text-sun">alone.</em>
          </p>
          <ul className="space-y-3 text-silver-300">
            <li>01 · Post the idea you keep thinking about</li>
            <li>02 · Match with designers, devs and PMs</li>
            <li>03 · Plan it with Verse, your AI co-pilot</li>
          </ul>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="label">Name</label>
          <input id="name" autoComplete="name" required className="field" value={form.name} onChange={set("name")} />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" autoComplete="email" required className="field" value={form.email} onChange={set("email")} />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" type="password" autoComplete="new-password" required minLength={6} className="field"
            value={form.password} onChange={set("password")} />
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary w-full py-3.5">
          {loading ? "Creating your account…" : "Create account"}
        </button>
      </form>
      <AuthError>{error}</AuthError>
    </AuthShell>
  );
}
