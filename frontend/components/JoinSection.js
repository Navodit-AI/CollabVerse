"use client";
import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import { api } from "@/lib/api";

const MAX_MESSAGE = 500;

function Person({ person, children }) {
  return (
    <div className="flex items-start gap-3">
      <Avatar name={person?.name} size={34} />
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-semibold">{person?.name ?? "Unknown"}</span>
          {person?.role && person.role !== "User" && <span className="ml-2 text-muted">{person.role}</span>}
        </p>
        {person?.skills?.length > 0 && <p className="truncate text-xs text-faint">{person.skills.slice(0, 5).join(" · ")}</p>}
        {children}
      </div>
    </div>
  );
}

// Team + "Ask to join" for one project. The owner sees and answers requests;
// everyone else can send one request and follow its status.
export default function JoinSection({ post }) {
  const [data, setData] = useState(null); // { isOwner, team, mine, requests }
  const [error, setError] = useState("");
  const [composing, setComposing] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(""); // which action is in flight

  const postId = post.id;
  useEffect(() => {
    const controller = new AbortController();
    api(`/api/posts/${postId}/requests`, { signal: controller.signal })
      .then(setData)
      .catch((err) => !controller.signal.aborted && setError(err.message));
    return () => controller.abort();
  }, [postId]);

  const run = async (key, fn) => {
    setBusy(key);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const send = () =>
    run("send", async () => {
      const mine = await api(`/api/posts/${postId}/requests`, { method: "POST", body: { message } });
      setData((d) => ({ ...d, mine }));
      setComposing(false);
      setMessage("");
    });

  const withdraw = () =>
    run("withdraw", async () => {
      await api(`/api/requests/${data.mine.id}`, { method: "DELETE" });
      setData((d) => ({ ...d, mine: null }));
    });

  const respond = (request, status) =>
    run(request.id, async () => {
      const updated = await api(`/api/requests/${request.id}`, { method: "PATCH", body: { status } });
      setData((d) => ({
        ...d,
        requests: d.requests.map((r) => (r.id === updated.id ? updated : r)),
        team: status === "Accepted" ? [...d.team, updated.user] : d.team,
      }));
    });

  if (!data) {
    return error ? <p className="text-sm text-danger">{error}</p> : <div className="h-16 animate-pulse rounded-xl bg-field" aria-hidden="true" />;
  }

  const pending = data.requests.filter((r) => r.status === "Pending");
  const answered = data.requests.filter((r) => r.status !== "Pending");
  const owner = data.team[0];

  return (
    <div className="space-y-6">
      {/* Team */}
      <div>
        <p className="eyebrow mb-3">Team · {data.team.length}</p>
        <div className="flex flex-wrap gap-2">
          {data.team.map((member, i) => (
            <span key={member.id} className="chip py-1 pl-1 pr-3">
              <Avatar name={member.name} size={22} />
              {member.name}
              {i === 0 && <span className="text-faint">· owner</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Owner: incoming requests */}
      {data.isOwner && (
        <div>
          <p className="eyebrow mb-3">Requests to join · {pending.length}</p>
          {pending.length === 0 && answered.length === 0 && (
            <p className="text-sm text-muted">No requests yet. They&rsquo;ll show up here when people ask to join.</p>
          )}
          <ul className="space-y-3">
            {pending.map((r) => (
              <li key={r.id} className="rounded-2xl border border-line bg-card p-4 animate-rise">
                <Person person={r.user}>
                  {r.message && <p className="mt-2 whitespace-pre-line text-sm text-ink-2">&ldquo;{r.message}&rdquo;</p>}
                  <div className="mt-3 flex gap-2">
                    <button type="button" disabled={busy === r.id} onClick={() => respond(r, "Accepted")} className="btn btn-primary px-4 py-1.5 text-sm">
                      Accept
                    </button>
                    <button type="button" disabled={busy === r.id} onClick={() => respond(r, "Declined")} className="btn btn-ghost px-4 py-1.5 text-sm">
                      Decline
                    </button>
                  </div>
                </Person>
              </li>
            ))}
            {answered.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-1">
                <Person person={r.user} />
                <span className={`text-xs font-medium ${r.status === "Accepted" ? "text-sage-deep" : "text-faint"}`}>{r.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Everyone else: ask to join / request status */}
      {!data.isOwner && (
        <div className="rounded-2xl border border-line bg-sage-soft/50 p-4">
          {data.mine?.status === "Accepted" ? (
            <p className="text-sm font-medium text-sage-deep">You&rsquo;re on the team. 🎉</p>
          ) : data.mine?.status === "Declined" ? (
            <p className="text-sm text-muted">{owner?.name ?? "The owner"} passed on this one. Plenty of other projects are looking for people.</p>
          ) : data.mine?.status === "Pending" ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink-2">
                <span className="font-semibold text-ink">Request sent.</span> Waiting for {owner?.name ?? "the owner"} to reply.
              </p>
              <button type="button" disabled={busy === "withdraw"} onClick={withdraw} className="btn btn-ghost px-4 py-1.5 text-sm">
                {busy === "withdraw" ? "Withdrawing…" : "Withdraw"}
              </button>
            </div>
          ) : post.status !== "Open" ? (
            <p className="text-sm text-muted">This project isn&rsquo;t taking new members right now.</p>
          ) : composing ? (
            <div className="space-y-3">
              <label htmlFor="join-message" className="label">
                Why do you want to join? <span className="text-faint">(optional)</span>
              </label>
              <textarea id="join-message" rows={3} maxLength={MAX_MESSAGE} autoFocus className="field resize-none bg-card"
                placeholder="What you'd bring, how much time you have…" value={message} onChange={(e) => setMessage(e.target.value)} />
              <div className="flex gap-2">
                <button type="button" disabled={busy === "send"} onClick={send} className="btn btn-primary px-5 py-2 text-sm">
                  {busy === "send" ? "Sending…" : "Send request"}
                </button>
                <button type="button" onClick={() => setComposing(false)} className="btn btn-ghost px-4 py-2 text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink-2">Want to build this with {owner?.name ?? "them"}?</p>
              <button type="button" onClick={() => setComposing(true)} className="btn btn-primary px-5 py-2 text-sm">Ask to join</button>
            </div>
          )}
        </div>
      )}

      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}
