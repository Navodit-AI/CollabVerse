// Initial-based avatar. Hue is derived from the name so each person keeps a consistent colour.
const HUES = ["#dce4d2", "#f6d5c9", "#e9e1c8", "#d4e0e6", "#e6d6e4", "#c9d8bd"];

export default function Avatar({ name, size = 36 }) {
  const clean = (name || "").trim();
  const initial = clean ? clean[0].toUpperCase() : "?";
  const hue = HUES[[...clean].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % HUES.length];

  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-ink"
      style={{ width: size, height: size, background: hue, fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  );
}
