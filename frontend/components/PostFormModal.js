"use client";
import { useState } from "react";
import Overlay from "./Overlay";
import { DOMAINS } from "./PostCard";
import { api } from "@/lib/api";

const EMPTY = { title: "", description: "", domain: "Web", skills: "" };

// Create a project, or edit one when `post` is passed. The parent remounts this via `key`,
// so the form is seeded fresh each time it opens.
export default function PostFormModal({ open, onClose, onSaved, post = null }) {
  const editing = Boolean(post);
  const [form, setForm] = useState(
    editing
      ? { title: post.title, description: post.description, domain: post.domain, skills: (post.skills || []).join(", ") }
      : EMPTY
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || !form.description.trim()) {
      setError("Give your project a title and a short description.");
      return;
    }
    setSaving(true);
    try {
      const saved = await api(editing ? `/api/posts/${post.id}` : "/api/posts", {
        method: editing ? "PUT" : "POST",
        body: {
          title: form.title.trim(),
          description: form.description.trim(),
          domain: form.domain,
          skills: [...new Set(form.skills.split(",").map((s) => s.trim()).filter(Boolean))],
        },
      });
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Overlay open={open} onClose={onClose} title={editing ? "Edit project" : "Start a project"}>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label htmlFor="np-title" className="label">Title</label>
          <input id="np-title" className="field" maxLength={120} placeholder="e.g. Campus lost & found app"
            value={form.title} onChange={set("title")} autoFocus />
        </div>

        <fieldset>
          <legend className="label">Domain</legend>
          <div className="flex flex-wrap gap-2">
            {DOMAINS.map((d) => (
              <button
                key={d.value}
                type="button"
                aria-pressed={form.domain === d.value}
                onClick={() => setForm({ ...form, domain: d.value })}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  form.domain === d.value
                    ? "border-ink bg-ink text-paper"
                    : "border-line-strong text-ink-2 hover:border-muted"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="np-skills" className="label">Skills you need <span className="text-faint">(comma separated)</span></label>
          <input id="np-skills" className="field" placeholder="React, Figma, Python" value={form.skills} onChange={set("skills")} />
        </div>

        <div>
          <label htmlFor="np-desc" className="label">What are you building?</label>
          <textarea id="np-desc" rows={5} maxLength={3000} className="field resize-y"
            placeholder="The problem, your idea, and who you're looking for."
            value={form.description} onChange={set("description")} />
          {!editing && <p className="mt-1.5 text-xs text-faint">Stuck? Ask Verse (bottom right) to help you write this.</p>}
        </div>

        {error && <p role="alert" className="text-sm text-danger">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn btn-primary flex-1 py-3">
            {saving ? (editing ? "Saving…" : "Launching…") : editing ? "Save changes" : "Launch project"}
          </button>
          <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
        </div>
      </form>
    </Overlay>
  );
}
