"use client";
import { useEffect, useState } from "react";
import Overlay from "./Overlay";
import Avatar from "./Avatar";
import { LikeButton, StatusDot, domainLabel } from "./PostCard";
import { SendIcon, TrashIcon } from "./Icons";
import { api } from "@/lib/api";

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  const units = [["y", 31536000], ["mo", 2592000], ["d", 86400], ["h", 3600], ["m", 60]];
  for (const [label, secs] of units) if (s >= secs) return `${Math.floor(s / secs)}${label} ago`;
};

// Full project view: description, skills, like, and the comment thread.
export default function PostDrawer({ post, user, onClose, onToggleLike, onCommentCountChange }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const postId = post?.id;
  useEffect(() => {
    if (!postId) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setComments([]);
    api(`/api/comments/${postId}`, { signal: controller.signal })
      .then(setComments)
      .catch((err) => !controller.signal.aborted && setError(err.message))
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [postId]);

  const submit = async (e) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setSending(true);
    setError("");
    try {
      const comment = await api("/api/comments", { method: "POST", body: { postId, content } });
      setComments((c) => [...c, comment]);
      setDraft("");
      onCommentCountChange(postId, +1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const remove = async (id) => {
    const before = comments;
    setComments((c) => c.filter((x) => x.id !== id)); // optimistic
    try {
      await api(`/api/comments/${id}`, { method: "DELETE" });
      onCommentCountChange(postId, -1);
    } catch (err) {
      setComments(before);
      setError(err.message);
    }
  };

  return (
    <Overlay
      open={Boolean(post)}
      onClose={onClose}
      variant="drawer"
      title={
        post && (
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="chip">{domainLabel(post.domain)}</span>
              <StatusDot status={post.status} />
            </div>
            <h2 className="display text-4xl sm:text-5xl">{post.title}</h2>
          </div>
        )
      }
    >
      {post && (
        <>
          <div className="mb-6 flex items-center justify-between">
            <span className="flex items-center gap-2.5 text-sm text-ink-2">
              <Avatar name={post.author?.name} size={30} />
              {post.author?.name ?? "Unknown"}
            </span>
            <LikeButton liked={post.likedByMe} count={post._count?.likes ?? 0} onToggle={() => onToggleLike(post)} />
          </div>

          <p className="mb-6 whitespace-pre-line leading-relaxed text-ink-2">{post.description}</p>

          {post.skills?.length > 0 && (
            <div className="mb-10">
              <p className="eyebrow mb-3">Looking for</p>
              <div className="flex flex-wrap gap-2">
                {post.skills.map((s) => <span key={s} className="chip">{s}</span>)}
              </div>
            </div>
          )}

          <section aria-labelledby="comments-heading" className="border-t border-line pt-6">
            <h3 id="comments-heading" className="eyebrow mb-5">Comments · {comments.length}</h3>

            {loading ? (
              <div className="space-y-4" aria-hidden="true">
                {[0, 1].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-field" />)}
              </div>
            ) : comments.length === 0 ? (
              <p className="mb-6 text-sm text-faint">No comments yet. Say hi, ask a question, or offer to help.</p>
            ) : (
              <ul className="mb-6 space-y-5">
                {comments.map((c) => (
                  <li key={c.id} className="group flex gap-3 animate-rise">
                    <Avatar name={c.author?.name} size={30} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">{c.author?.name ?? "Unknown"}</span>
                        <span className="ml-2 text-xs text-faint">{timeAgo(c.createdAt)}</span>
                      </p>
                      <p className="mt-0.5 whitespace-pre-line text-sm text-ink-2 break-words">{c.content}</p>
                    </div>
                    {c.author?.id === user?.id && (
                      <button type="button" onClick={() => remove(c.id)} aria-label="Delete comment"
                        className="self-start rounded-full p-1.5 text-faint opacity-0 transition-opacity hover:text-danger group-hover:opacity-100 focus-visible:opacity-100">
                        <TrashIcon size={15} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {error && <p role="alert" className="mb-4 text-sm text-danger">{error}</p>}

            <form onSubmit={submit} className="flex items-end gap-2">
              <label htmlFor="comment" className="sr-only">Write a comment</label>
              <textarea
                id="comment"
                rows={1}
                maxLength={1000}
                placeholder="Write a comment…"
                className="field min-h-[48px] resize-none"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit(e);
                  }
                }}
              />
              <button type="submit" disabled={sending || !draft.trim()} aria-label="Post comment" className="btn btn-primary h-12 w-12 shrink-0 p-0">
                <SendIcon size={17} />
              </button>
            </form>
          </section>
        </>
      )}
    </Overlay>
  );
}
