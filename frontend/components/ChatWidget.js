"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { CloseIcon, SendIcon, SparkIcon } from "./Icons";

const STORAGE_KEY = "verse-chat";
const SUGGESTIONS = [
  "Which open projects match my skills?",
  "Help me write a project post for my idea",
  "Plan a 4-week MVP for a web app",
  "Who here could design a UI for me?",
];

// Minimal markdown → React (bold, italics, inline code, bullet/numbered lists, paragraphs).
// Builds elements directly, so model output can never inject HTML.
function renderInline(text, keyPrefix) {
  const parts = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyPrefix}-${m.index}`;
    if (tok.startsWith("**")) parts.push(<strong key={key} className="font-semibold text-silver-100">{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) parts.push(<code key={key} className="rounded bg-ink-700 px-1 py-0.5 font-mono text-[0.85em]">{tok.slice(1, -1)}</code>);
    else parts.push(<em key={key}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function Markdown({ text }) {
  const blocks = [];
  let list = null;
  text.split("\n").forEach((line, i) => {
    const bullet = line.match(/^\s*[-*•]\s+(.*)/);
    const numbered = line.match(/^\s*(\d+)[.)]\s+(.*)/);
    if (bullet || numbered) {
      const type = bullet ? "ul" : "ol";
      if (!list || list.type !== type) {
        list = { type, items: [] };
        blocks.push(list);
      }
      list.items.push(renderInline(bullet ? bullet[1] : numbered[2], `l${i}`));
      return;
    }
    list = null;
    const heading = line.match(/^#{1,6}\s+(.*)/);
    if (heading) blocks.push({ type: "h", content: renderInline(heading[1], `h${i}`) });
    else if (line.trim()) blocks.push({ type: "p", content: renderInline(line, `p${i}`) });
  });

  return blocks.map((b, i) => {
    if (b.type === "ul" || b.type === "ol") {
      const Tag = b.type;
      return (
        <Tag key={i} className={`my-2 space-y-1 pl-5 ${b.type === "ul" ? "list-disc" : "list-decimal"} marker:text-silver-500`}>
          {b.items.map((item, j) => <li key={j}>{item}</li>)}
        </Tag>
      );
    }
    if (b.type === "h") return <p key={i} className="mt-3 mb-1 font-semibold text-silver-100">{b.content}</p>;
    return <p key={i} className="my-1.5">{b.content}</p>;
  });
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  // Keep the conversation for this browser tab session.
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) setMessages(saved);
    } catch {}
  }, []);
  useEffect(() => {
    if (!streaming) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages, streaming]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = async (text) => {
    const content = text.trim();
    if (!content || streaming) return;
    setError("");
    setInput("");

    const history = [...messages, { role: "user", content }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await api("/api/ai/chat", { method: "POST", body: { messages: history }, raw: true, signal: controller.signal });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: reply }]);
      }
      if (!reply.trim()) throw new Error("Verse didn't reply. Try again.");
    } catch (err) {
      if (controller.signal.aborted) {
        // Stopped by the user: keep any partial reply, but drop an empty placeholder
        // (the API rejects empty messages in the history).
        setMessages((msgs) => (msgs.at(-1)?.role === "assistant" && !msgs.at(-1).content.trim() ? msgs.slice(0, -1) : msgs));
        return;
      }
      setError(err.message);
      setMessages(history.slice(0, -1)); // drop the failed turn...
      setInput(content); // ...and give the text back so it can be resent
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  const reset = () => {
    stop();
    setMessages([]);
    setError("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="verse-panel"
        className={`btn btn-primary fixed bottom-6 right-6 z-40 py-3.5 pl-4 pr-5 shadow-[0_12px_40px_-12px_rgb(255_201_60/0.7)] ${open ? "scale-0 opacity-0" : ""}`}
      >
        <SparkIcon size={18} />
        Ask Verse
      </button>

      {open && (
        <section
          id="verse-panel"
          aria-label="Verse AI assistant"
          className="fixed inset-x-3 bottom-3 z-50 flex h-[min(640px,calc(100dvh-1.5rem))] flex-col overflow-hidden rounded-3xl border border-ink-700 bg-ink-900 shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[420px] origin-bottom-right animate-[modal-in_0.35s_var(--ease-spring)_both]"
        >
          <header className="flex items-center justify-between border-b border-ink-700 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sun text-on-sun"><SparkIcon size={18} /></span>
              <div>
                <p className="font-semibold leading-tight">Verse</p>
                <p className="text-xs text-silver-500">Your AI co-pilot</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button type="button" onClick={reset} className="btn-quiet whitespace-nowrap rounded-full text-xs">New chat</button>
              )}
              <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="rounded-full p-2 text-silver-400 hover:bg-ink-800 hover:text-silver-100">
                <CloseIcon />
              </button>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5" aria-live="polite">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col justify-end">
                <p className="display mb-2 text-4xl">What are we <em className="text-sun">building?</em></p>
                <p className="mb-6 text-sm text-silver-400">Ask me to find projects, shape your idea, or plan the work.</p>
                <div className="flex flex-col items-start gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" onClick={() => send(s)}
                      className="rounded-2xl border border-ink-700 px-3.5 py-2 text-left text-sm text-silver-300 transition-colors hover:border-sun/60 hover:text-silver-100">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ul className="space-y-4">
                {messages.map((m, i) =>
                  m.role === "user" ? (
                    <li key={i} className="ml-10 w-fit max-w-[85%] self-end rounded-2xl rounded-br-md bg-silver-100 px-4 py-2.5 text-sm text-ink-950 whitespace-pre-wrap break-words ml-auto">
                      {m.content}
                    </li>
                  ) : (
                    <li key={i} className="mr-6 text-sm leading-relaxed text-silver-300 break-words">
                      {m.content ? (
                        <Markdown text={m.content} />
                      ) : (
                        <span className="inline-flex gap-1 py-2" aria-label="Verse is thinking">
                          {[0, 1, 2].map((d) => (
                            <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-sun" style={{ animationDelay: `${d * 120}ms` }} />
                          ))}
                        </span>
                      )}
                    </li>
                  )
                )}
              </ul>
            )}
          </div>

          {error && <p role="alert" className="mx-5 mb-2 rounded-xl bg-rose/10 px-3 py-2 text-xs text-rose">{error}</p>}

          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-end gap-2 border-t border-ink-700 p-3">
            <label htmlFor="verse-input" className="sr-only">Message Verse</label>
            <textarea
              id="verse-input"
              ref={inputRef}
              rows={1}
              maxLength={4000}
              placeholder="Ask anything…"
              className="field max-h-32 min-h-[46px] resize-none border-transparent bg-ink-800"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
            />
            {streaming ? (
              <button type="button" onClick={stop} aria-label="Stop generating" className="btn btn-ghost h-[46px] w-[46px] shrink-0 p-0">
                <span className="h-3 w-3 rounded-sm bg-silver-100" />
              </button>
            ) : (
              <button type="submit" disabled={!input.trim()} aria-label="Send" className="btn btn-primary h-[46px] w-[46px] shrink-0 p-0">
                <SendIcon size={17} />
              </button>
            )}
          </form>
        </section>
      )}
    </>
  );
}
