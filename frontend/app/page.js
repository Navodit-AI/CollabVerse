"use client";
import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Logo from "@/components/Logo";
import Avatar from "@/components/Avatar";
import { ArrowIcon, HeartIcon, SparkIcon } from "@/components/Icons";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const SKILLS = ["React", "Figma", "Python", "Swift", "Node", "Unity", "PyTorch", "Next.js", "Kotlin", "Blender", "Go", "Product"];

const STEPS = [
  { n: "01", title: "Post the idea", body: "The one you keep thinking about in the shower. Say what it is and who you need." },
  { n: "02", title: "Find your people", body: "Designers, devs and PMs who have the skills you're missing, filtered and searchable." },
  { n: "03", title: "Plan with Verse", body: "Your AI co-pilot turns a rough idea into a scoped MVP, roles and a first sprint." },
];

// Split a string into spans so GSAP can animate each character.
function SplitChars({ text, className = "" }) {
  return (
    <span className={className} aria-label={text}>
      {[...text].map((ch, i) => (
        <span key={i} aria-hidden="true" className="char inline-block will-change-transform">
          {ch === " " ? " " : ch}
        </span>
      ))}
    </span>
  );
}

function FloatingCard({ className, depth, children }) {
  return (
    <div data-depth={depth} className={`float-card absolute card p-4 shadow-2xl ${className}`}>
      {children}
    </div>
  );
}

export default function Home() {
  const root = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Hero intro
        const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
        tl.from(".hero-eyebrow", { y: 20, opacity: 0, duration: 0.8 })
          .from(".hero-line .char", { yPercent: 110, rotate: 8, opacity: 0, duration: 1.1, stagger: 0.035 }, "-=0.5")
          .from(".hero-sage", { scale: 0, duration: 1.4, ease: "elastic.out(1, 0.6)" }, "-=1.1")
          .from(".hero-dot", { scale: 0, duration: 1, ease: "back.out(2)" }, "-=0.9")
          .from(".hero-ring", { scale: 0.6, opacity: 0, duration: 1.2 }, "-=1.2")
          .from(".float-card", { y: 60, opacity: 0, duration: 1, stagger: 0.12 }, "-=1")
          .from(".hero-sub, .hero-cta", { y: 20, opacity: 0, duration: 0.8, stagger: 0.1 }, "-=0.9");

        // Gentle idle bob on the floating cards
        gsap.utils.toArray(".float-card").forEach((el, i) => {
          gsap.to(el, { y: "+=14", duration: 2.4 + i * 0.4, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.5 });
        });

        // Mouse parallax: each card moves by its data-depth
        const movers = gsap.utils.toArray("[data-depth]").map((el) => ({
          depth: parseFloat(el.dataset.depth),
          x: gsap.quickTo(el, "x", { duration: 0.8, ease: "power3" }),
          rotate: gsap.quickTo(el, "rotate", { duration: 0.8, ease: "power3" }),
        }));
        const onMove = (e) => {
          const dx = e.clientX / window.innerWidth - 0.5;
          const dy = e.clientY / window.innerHeight - 0.5;
          movers.forEach((m) => {
            m.x(dx * 60 * m.depth);
            m.rotate(dx * 6 * m.depth + dy * 2);
          });
        };
        window.addEventListener("pointermove", onMove);

        // Scroll: tomato drifts and grows as you leave the hero
        gsap.to(".hero-sage", {
          yPercent: 30, scale: 1.25, ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
        });

        // Section reveals
        gsap.utils.toArray(".reveal").forEach((el) => {
          gsap.from(el, {
            y: 50, opacity: 0, duration: 1, ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 85%" },
          });
        });

        gsap.from(".step", {
          y: 80, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.15,
          scrollTrigger: { trigger: ".steps", start: "top 75%" },
        });

        gsap.from(".chat-bubble", {
          y: 30, opacity: 0, scale: 0.95, duration: 0.7, ease: "back.out(1.7)", stagger: 0.35,
          scrollTrigger: { trigger: ".chat-demo", start: "top 70%" },
        });

        gsap.from(".cta-line .char", {
          yPercent: 100, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.025,
          scrollTrigger: { trigger: ".cta", start: "top 70%" },
        });

        return () => window.removeEventListener("pointermove", onMove);
      });
    },
    { scope: root }
  );

  return (
    <div ref={root} className="overflow-x-clip">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-line/40 bg-paper/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Logo />
          <nav className="flex items-center gap-2">
            <Link href="/login" className="btn-quiet rounded-full text-sm font-medium">Log in</Link>
            <Link href="/signup" className="btn btn-primary text-sm">Get started</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="hero relative flex min-h-[100svh] items-center pt-28 pb-16">
        {/* Background composition */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="hero-sage absolute right-[-7rem] top-[7%] h-[18rem] w-[18rem] rounded-full bg-sage sm:right-[-6rem] sm:h-[34rem] sm:w-[34rem] lg:right-[4%] lg:top-[12%] lg:h-[38rem] lg:w-[38rem]" />
          <div className="hero-dot absolute right-[38%] top-[16%] hidden h-20 w-20 rounded-full bg-tomato md:block lg:right-[44%]" />
          <div className="hero-ring absolute right-[6rem] top-[30%] h-[26rem] w-[26rem] rounded-full border-[3px] border-ink/90 hidden md:block lg:right-[26%]" />
                  </div>

        {/* Floating UI fragments */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden md:block">
          <FloatingCard depth={1.2} className="right-[8%] top-[24%] w-64 rotate-[-4deg]">
            <div className="mb-3 flex items-center justify-between">
              <span className="chip">AI / ML</span>
              <span className="flex items-center gap-1 text-xs text-sage-deep"><span className="h-1.5 w-1.5 rounded-full bg-sage-deep" />Open</span>
            </div>
            <p className="mb-1 font-semibold">Study-buddy matcher</p>
            <p className="text-xs text-muted">Needs: Python, Figma</p>
          </FloatingCard>

          <FloatingCard depth={-0.8} className="right-[30%] top-[58%] w-56 rotate-[3deg]">
            <div className="flex items-center gap-3">
              <Avatar name="Maya" size={34} />
              <div>
                <p className="text-sm font-semibold">Maya joined</p>
                <p className="text-xs text-muted">Designer · Figma, Motion</p>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard depth={1.8} className="right-[5%] top-[66%] w-auto rotate-[6deg] rounded-full px-5 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-tomato-deep"><HeartIcon filled size={16} /> 128</span>
          </FloatingCard>

          <FloatingCard depth={-1.4} className="right-[40%] top-[20%] w-auto rotate-[-8deg] rounded-full border-tomato/40 px-4 py-2.5">
            <span className="flex items-center gap-2 text-sm"><SparkIcon size={15} className="text-tomato" /> Verse: &ldquo;here&rsquo;s a 4-week plan&rdquo;</span>
          </FloatingCard>
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
          <p className="hero-eyebrow eyebrow mb-8">Collaboration for students &amp; makers</p>
          <h1 className="display text-[clamp(4.5rem,15vw,13rem)] leading-[0.85]">
            <span className="hero-line block overflow-hidden pb-[0.08em]"><SplitChars text="Build it" /></span>
            <span className="hero-line block overflow-hidden pb-[0.12em] italic"><SplitChars text="together." /></span>
          </h1>
          <p className="hero-sub mt-8 max-w-md text-lg text-ink-2">
            Post the idea. Find the designer, the dev, the PM. Ship the thing you&rsquo;ve been putting off.
          </p>
          <div className="hero-cta mt-10 flex flex-wrap items-center gap-3">
            <Link href="/signup" className="btn btn-primary px-7 py-4 text-base">
              Start building <ArrowIcon size={18} />
            </Link>
            <Link href="/login" className="btn btn-ghost px-7 py-4 text-base">I have an account</Link>
          </div>
        </div>
      </section>

      {/* Skills marquee */}
      <div aria-hidden="true" className="relative bg-sage py-6 overflow-hidden">
        <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-12 pr-12">
          {[...SKILLS, ...SKILLS].map((s, i) => (
            <span key={i} className="display flex items-center gap-12 text-4xl text-ink whitespace-nowrap">
              {s} <span className="h-3 w-3 rounded-full bg-paper" />
            </span>
          ))}
        </div>
      </div>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-5 py-32 sm:px-8">
        <p className="reveal eyebrow mb-6">How it works</p>
        <h2 className="reveal display mb-20 max-w-4xl text-5xl sm:text-7xl">
          From &ldquo;what if&rdquo; to <em className="text-tomato">shipped</em>, in three moves.
        </h2>
        <div className="steps grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="step card group p-8 transition-colors duration-500 hover:border-tomato/50">
              <p className="display mb-16 text-8xl text-line-strong transition-colors duration-500 group-hover:text-tomato">{s.n}</p>
              <h3 className="mb-3 text-2xl font-semibold">{s.title}</h3>
              <p className="text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI section */}
      <section className="bg-sage-soft">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-32 sm:px-8 lg:grid-cols-2">
          <div>
            <p className="reveal eyebrow mb-6 flex items-center gap-2"><SparkIcon size={14} className="text-tomato" /> Meet Verse</p>
            <h2 className="reveal display mb-8 text-5xl sm:text-7xl">
              An AI co-pilot that knows <em className="text-tomato">who&rsquo;s here.</em>
            </h2>
            <p className="reveal max-w-md text-lg text-muted">
              Verse sees the open projects and the people on CollabVerse, so it can match you with a team,
              tighten your pitch, and plan your first sprint.
            </p>
          </div>

          <div className="chat-demo card mx-auto w-full max-w-md space-y-4 p-6">
            <div className="chat-bubble ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-sm text-paper">
              I know React. Any projects I could join?
            </div>
            <div className="chat-bubble mr-6 space-y-2 text-sm text-ink-2">
              <p className="flex items-center gap-2 font-semibold text-ink"><SparkIcon size={14} className="text-tomato" /> Verse</p>
              <p>Two open projects need React right now:</p>
              <ul className="list-disc space-y-1 pl-5 marker:text-tomato">
                <li><strong className="text-ink">Campus lost &amp; found</strong>: needs a frontend lead</li>
                <li><strong className="text-ink">Study-buddy matcher</strong>: React + Python</li>
              </ul>
              <p>Want me to draft an intro message to the first one?</p>
            </div>
            <div className="chat-bubble ml-auto w-fit rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-sm text-paper">
              Yes please 🙌
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta relative overflow-hidden px-5 pt-40 pb-64 text-center sm:px-8">
        <div aria-hidden="true" className="absolute left-1/2 top-full h-[60rem] w-[60rem] -translate-x-1/2 -translate-y-[16%] rounded-full bg-sage" />
        <div className="relative">
          <h2 className="display mx-auto mb-12 max-w-5xl text-[clamp(3.5rem,9vw,8rem)] leading-[0.9]">
            <span className="cta-line block overflow-hidden"><SplitChars text="Your next team is" /></span>
            <span className="cta-line block overflow-hidden italic text-tomato"><SplitChars text="one post away." /></span>
          </h2>
          <Link href="/signup" className="btn btn-primary px-8 py-4 text-base">
            Create your free account <ArrowIcon size={18} />
          </Link>
        </div>
      </section>

      <footer className="relative border-t border-line bg-paper">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-faint sm:flex-row sm:px-8">
          <Logo />
          <p>&copy; {new Date().getFullYear()} CollabVerse. Made by makers, for makers.</p>
        </div>
      </footer>
    </div>
  );
}
