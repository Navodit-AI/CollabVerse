import Link from "next/link";

// Two overlapping orbits: two people, one shared space.
export function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="12" cy="16" r="9" fill="var(--color-sage)" />
      <circle cx="20" cy="16" r="9" fill="var(--color-tomato)" />
    </svg>
  );
}

export default function Logo({ href = "/", className = "" }) {
  return (
    <Link href={href} className={`group inline-flex items-center gap-2.5 ${className}`} aria-label="CollabVerse home">
      <span className="transition-transform duration-500 ease-[var(--ease-spring)] group-hover:rotate-[20deg]">
        <LogoMark />
      </span>
      <span className="text-lg font-semibold tracking-tight">
        Collab<span className="display italic text-xl">Verse</span>
      </span>
    </Link>
  );
}
