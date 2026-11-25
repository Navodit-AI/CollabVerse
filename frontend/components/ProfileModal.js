"use client";
import { useState } from "react";
import Overlay from "./Overlay";
import Avatar from "./Avatar";
import { CloseIcon } from "./Icons";
import { api, saveUser } from "@/lib/api";

export const ROLES = ["Developer", "Designer", "Manager"];
const SUGGESTED_SKILLS = ["React", "Next.js", "Node", "Python", "Figma", "UI Design", "Swift", "Kotlin", "Unity", "PyTorch", "Product", "Marketing"];
const MAX_SKILLS = 20;
const MAX_SKILL_LENGTH = 30;

// Type a skill and press Enter or comma to add it; Backspace on an empty field removes the last one.
function SkillInput({ skills, onChange }) {
  const [draft, setDraft] = useState("");

  const add = (raw) => {
    const skill = raw.trim().replace(/,$/, "").trim().slice(0, MAX_SKILL_LENGTH);
    if (!skill || skills.length >= MAX_SKILLS) return;
    if (!skills.some((s) => s.toLowerCase() === skill.toLowerCase())) onChange([...skills, skill]);
    setDraft("");
  };
  const remove = (skill) => onChange(skills.filter((s) => s !== skill));

  const suggestions = SUGGESTED_SKILLS.filter((s) => !skills.some((x) => x.toLowerCase() === s.toLowerCase()));

  return (
    <div>
      <div className="field flex min-h-[52px] flex-wrap items-center gap-2 py-2 focus-within:border-sun focus-within:shadow-[0_0_0_3px_rgb(255_201_60/0.15)]">
        {skills.map((s) => (
          <span key={s} className="inline-flex items-center gap-1 rounded-full bg-silver-100 py-1 pl-3 pr-1.5 text-sm font-medium text-ink-950 animate-[modal-in_0.25s_var(--ease-spring)_both]">
            {s}
            <button type="button" onClick={() => remove(s)} aria-label={`Remove ${s}`} className="rounded-full p-0.5 hover:bg-ink-950/10">
              <CloseIcon size={13} />
            </button>
          </span>
        ))}
        <input
          id="skill-input"
          className="min-w-[8rem] flex-1 bg-transparent py-1 text-silver-100 outline-none placeholder:text-silver-500"
          placeholder={skills.length ? "Add another…" : "Type a skill and press Enter"}
          value={draft}
          maxLength={MAX_SKILL_LENGTH + 1}
          disabled={skills.length >= MAX_SKILLS}
          onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setDraft(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && skills.length) {
              remove(skills[skills.length - 1]);
            }
          }}
          onBlur={() => draft.trim() && add(draft)}
        />
      </div>
      {suggestions.length > 0 && skills.length < MAX_SKILLS && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {suggestions.slice(0, 8).map((s) => (
            <button key={s} type="button" onClick={() => add(s)}
              className="rounded-full border border-dashed border-ink-600 px-3 py-1 text-xs text-silver-400 transition-colors hover:border-sun/60 hover:text-silver-100">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProfileModal({ open, onClose, onSaved, user, welcome = false }) {
  // Seeded from the user each time the modal opens (the parent remounts it via `key`).
  const [role, setRole] = useState(ROLES.includes(user?.role) ? user.role : "");
  const [skills, setSkills] = useState(user?.skills ?? []);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!role) {
      setError("Pick the role that fits you best.");
      return;
    }
    setSaving(true);
    try {
      const updated = await api("/api/users/profile", { method: "PUT", body: { role, skills } });
      saveUser({ ...user, ...updated });
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Overlay open={open} onClose={onClose} title={welcome ? "Welcome aboard" : "Your profile"}>
      <form onSubmit={submit} className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar name={user?.name} size={52} />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{user?.name}</p>
            <p className="truncate text-sm text-silver-400">{user?.email}</p>
          </div>
        </div>

        {welcome && (
          <p className="text-silver-300">
            Tell people what you do. Your role and skills show on the People tab and help Verse match you with projects.
          </p>
        )}

        <fieldset>
          <legend className="label">I&rsquo;m mostly a…</legend>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button key={r} type="button" aria-pressed={role === r} onClick={() => setRole(r)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  role === r ? "border-silver-100 bg-silver-100 text-ink-950" : "border-ink-600 text-silver-300 hover:border-silver-400"
                }`}>
                {r}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="skill-input" className="label">
            Skills <span className="text-silver-500">({skills.length}/{MAX_SKILLS})</span>
          </label>
          <SkillInput skills={skills} onChange={setSkills} />
        </div>

        {error && <p role="alert" className="text-sm text-rose">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn btn-primary flex-1 py-3">
            {saving ? "Saving…" : "Save profile"}
          </button>
          <button type="button" onClick={onClose} className="btn btn-ghost">{welcome ? "Later" : "Cancel"}</button>
        </div>
      </form>
    </Overlay>
  );
}
