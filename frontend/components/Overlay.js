"use client";
import { useEffect, useRef } from "react";
import { CloseIcon } from "./Icons";

// Shared backdrop + panel. variant "drawer" slides in from the right, "modal" pops in centred.
// Closes on Escape and backdrop click, locks page scroll, and moves focus into the panel.
export default function Overlay({ open, onClose, title, variant = "modal", children }) {
  const panelRef = useRef(null);
  // Parents often pass a new onClose each render; keep the latest in a ref so the effect
  // below only runs when the overlay opens/closes (otherwise it would steal focus while typing).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement;
    const onKey = (e) => e.key === "Escape" && onCloseRef.current();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    if (!panelRef.current?.contains(document.activeElement)) panelRef.current?.focus(); // respect autoFocus fields
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const drawer = variant === "drawer";
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm animate-[fade-in_0.2s_ease-out_both]" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        className={
          drawer
            ? "absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-line bg-card shadow-2xl outline-none animate-[slide-in_0.45s_var(--ease-out-expo)_both]"
            : "absolute left-1/2 top-1/2 flex max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-3xl border border-line bg-card shadow-2xl outline-none animate-[modal-in_0.4s_var(--ease-spring)_both]"
        }
      >
        <div className="flex items-start justify-between gap-4 px-7 pt-7 pb-4">
          <div className="min-w-0 flex-1">{typeof title === "string" ? <h2 className="display text-4xl">{title}</h2> : title}</div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-muted hover:bg-field hover:text-ink">
            <CloseIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-7 pb-7">{children}</div>
      </div>
    </div>
  );
}
