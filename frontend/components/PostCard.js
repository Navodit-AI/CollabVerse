"use client";
import { useState } from "react";
import Avatar from "./Avatar";
import { CommentIcon, HeartIcon } from "./Icons";

export const DOMAINS = [
  { value: "Web", label: "Web" },
  { value: "AI", label: "AI / ML" },
  { value: "Mobile", label: "Mobile" },
  { value: "Game", label: "Games" },
];
export const domainLabel = (value) => DOMAINS.find((d) => d.value === value)?.label ?? value;

export function StatusDot({ status }) {
  const open = status === "Open";
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${open ? "text-mint" : "text-silver-500"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${open ? "bg-mint animate-pulse" : "bg-silver-500"}`} />
      {status}
    </span>
  );
}

export function LikeButton({ liked, count, onToggle, disabled }) {
  const [burst, setBurst] = useState(0);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (!liked) setBurst((n) => n + 1);
        onToggle();
      }}
      aria-pressed={liked}
      aria-label={liked ? `Unlike (${count} likes)` : `Like (${count} likes)`}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm transition-colors ${
        liked ? "text-sun" : "text-silver-400 hover:text-silver-100 hover:bg-ink-800"
      }`}
    >
      <span key={burst} className={burst ? "animate-pop" : ""}>
        <HeartIcon filled={liked} size={17} />
      </span>
      <span className="tabular-nums">{count}</span>
    </button>
  );
}

export default function PostCard({ post, onToggleLike, onOpen, index = 0 }) {
  return (
    <article
      style={{ animationDelay: `${index * 50}ms` }}
      className="card group relative flex flex-col p-6 text-left animate-rise transition-[transform,border-color,background-color] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-ink-600 hover:bg-ink-800/60"
    >
      <div className="mb-5 flex items-center justify-between">
        <span className="chip">{domainLabel(post.domain)}</span>
        <StatusDot status={post.status} />
      </div>

      <h3 className="text-xl font-semibold leading-snug mb-2 group-hover:text-sun transition-colors">
        {/* Stretched button: the whole card is clickable without nesting buttons */}
        <button type="button" onClick={onOpen} className="text-left after:absolute after:inset-0 after:rounded-[1.25rem] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-sun">
          {post.title}
        </button>
      </h3>
      <p className="text-sm text-silver-400 leading-relaxed line-clamp-3 mb-5">{post.description}</p>

      {post.skills?.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          {post.skills.slice(0, 4).map((s) => (
            <span key={s} className="rounded-md bg-ink-800 px-2 py-0.5 font-mono text-[11px] text-silver-300">{s}</span>
          ))}
          {post.skills.length > 4 && <span className="px-1 font-mono text-[11px] text-silver-500">+{post.skills.length - 4}</span>}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-ink-700 pt-4">
        <span className="flex min-w-0 items-center gap-2 text-sm text-silver-300">
          <Avatar name={post.author?.name} size={26} />
          <span className="truncate">{post.author?.name ?? "Unknown"}</span>
        </span>
        <span className="relative z-10 flex items-center">
          <LikeButton liked={post.likedByMe} count={post._count?.likes ?? 0} onToggle={() => onToggleLike(post)} />
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-silver-400">
            <CommentIcon size={16} />
            <span className="tabular-nums">{post._count?.comments ?? 0}</span>
          </span>
        </span>
      </div>
    </article>
  );
}

export function PeerCard({ peer, index = 0 }) {
  return (
    <article
      style={{ animationDelay: `${index * 50}ms` }}
      className="card p-6 animate-rise transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-ink-600"
    >
      <div className="mb-5 flex items-center gap-4">
        <Avatar name={peer.name} size={48} />
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold">{peer.name || "Unnamed"}</h3>
          <p className="text-sm text-silver-400">{peer.role || "User"}</p>
        </div>
      </div>
      {peer.skills?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {peer.skills.map((s) => (
            <span key={s} className="rounded-md bg-ink-800 px-2 py-0.5 font-mono text-[11px] text-silver-300">{s}</span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-silver-500">No skills listed yet</p>
      )}
    </article>
  );
}

export function CardSkeleton() {
  return (
    <div className="card p-6" aria-hidden="true">
      <div className="mb-5 h-6 w-16 animate-pulse rounded-full bg-ink-800" />
      <div className="mb-3 h-6 w-3/4 animate-pulse rounded bg-ink-800" />
      <div className="mb-2 h-4 w-full animate-pulse rounded bg-ink-800" />
      <div className="mb-8 h-4 w-2/3 animate-pulse rounded bg-ink-800" />
      <div className="h-8 w-full animate-pulse rounded bg-ink-800" />
    </div>
  );
}
