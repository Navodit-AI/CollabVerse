// Initial-based avatar. Hue is derived from the name so each person keeps a consistent colour.
const HUES = ["#ffc93c", "#c3c7cc", "#6fdc8c", "#8ab4ff", "#ff9e7a", "#c9a7ff"];

export default function Avatar({ name, size = 36 }) {
  const clean = (name || "").trim();
  const initial = clean ? clean[0].toUpperCase() : "?";
  const hue = HUES[[...clean].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % HUES.length];

  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-on-sun"
      style={{ width: size, height: size, background: hue, fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  );
}
