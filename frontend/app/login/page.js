"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell, { AuthError, AuthLink } from "@/components/AuthShell";
import { api, saveSession } from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api("/api/auth/login", { method: "POST", body: form });
      if (!data?.token) throw new Error("No token received from the server.");
      saveSession(data);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={<>Welcome <em>back</em></>}
      subtitle="Log in to pick up where your team left off."
      footer={<>New here? <AuthLink href="/signup">Create an account</AuthLink></>}
      aside={
        <p className="display text-6xl xl:text-7xl max-w-lg">
          Good ideas are <em className="text-sun">better</em> with company.
        </p>
      }
    >
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" autoComplete="email" required className="field"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" type="password" autoComplete="current-password" required className="field"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary w-full py-3.5">
          {loading ? "Logging in…" : "Log in"}
        </button>
        {loading && <p className="text-xs text-silver-500 text-center">First login of the day can take up to a minute while the server wakes up.</p>}
      </form>
      <AuthError>{error}</AuthError>
    </AuthShell>
  );
}
