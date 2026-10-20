"use client";

import * as React from "react";
import Matter from "matter-js";

/* ------------------------------------------------------------------ */
/*  Showcase Carousel — mobile-first case / product card slider        */
/*  Swipe with snap on phones (auto-advance + progress dots),          */
/*  arrows + dots on wide containers. Responds to its CONTAINER width, */
/*  not the viewport, so it works inside phone frames and sidebars.    */
/* ------------------------------------------------------------------ */

export type ShowcaseItem = {
  id?: string;
  title: string;
  description?: string;
  tags?: string[];
  /** Cover image URL */
  image?: string;
  /** Cover video URL (muted, looped). `image` is used as poster. */
  video?: string;
  /** Any custom cover (animated mockups, SVG…). Wins over image/video. */
  cover?: React.ReactNode;
  /** CSS background behind the cover (color or gradient). */
  background?: string;
  /** Link for the whole card. Without it the card is not clickable. */
  href?: string;
  /** Small label on the cover, e.g. "NDA", "Soon", "New". */
  badge?: string;
  /** Text of the link under the card on wide layouts. */
  cta?: string;
  alt?: string;
};

export type ShowcaseCarouselProps = {
  items?: ShowcaseItem[];
  /** Auto-advance interval on the mobile layout, ms. 0 disables it. */
  autoplay?: number;
  theme?: "dark" | "light";
  /** Accessible name of the slider. */
  label?: string;
  /** Default text for card links on wide layouts. */
  ctaLabel?: string;
  className?: string;
  onIndexChange?: (index: number) => void;
};

const MOBILE_MAX = 768; // container width under which the mobile layout is used

const CAROUSEL_THEMES = {
  dark: {
    card: "bg-[#101010]",
    title: "text-white",
    desc: "text-[#767676] @3xl:text-[#cdcdcd]",
    tag: "bg-[#242424] text-[#818181]",
    badge: "bg-[#141414] border-[#282828] text-white",
    dot: "bg-[#333] @3xl:bg-[#3a3a3a]",
    dotActive: "@3xl:bg-white",
    fill: "bg-white",
    done: "bg-[#666]",
    btn: "border-[#2a2a2a] bg-[#121212] text-white hover:bg-[#1e1e1e]",
    cta: "text-white",
    arrowDot: "bg-white text-black",
  },
  light: {
    card: "bg-[#f3f3f3]",
    title: "text-[#111]",
    desc: "text-[#6b6b6b] @3xl:text-[#3d3d3d]",
    tag: "bg-[#e6e6e6] text-[#5f5f5f]",
    badge: "bg-white border-[#e2e2e2] text-[#111]",
    dot: "bg-[#d4d4d4] @3xl:bg-[#cfcfcf]",
    dotActive: "@3xl:bg-[#111]",
    fill: "bg-[#111]",
    done: "bg-[#9a9a9a]",
    btn: "border-[#dedede] bg-white text-[#111] hover:bg-[#f2f2f2]",
    cta: "text-[#111]",
    arrowDot: "bg-[#111] text-white",
  },
} as const;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

const Arrow = ({ dir }: { dir: "prev" | "next" }) => (
  <svg width="16" height="12" viewBox="0 0 48 14" fill="none" aria-hidden="true">
    <path
      d={dir === "prev" ? "M47 7H1M7 1 1 7l6 6" : "M1 7h46M41 1l6 6-6 6"}
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Empty state for a card without a cover: a few tones lighter than the card + image icon. */
export function EmptyCover({ className = "", theme = "dark" }: { className?: string; theme?: "dark" | "light" }) {
  const tone = theme === "dark" ? "bg-[#1e1e1e] text-[#4d4d4d]" : "bg-[#e3e3e3] text-[#b0b0b0]";
  return (
    <div className={`absolute inset-0 grid place-items-center ${tone} ${className}`} aria-hidden="true">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <circle cx="9" cy="9" r="1.8" />
        <path d="m21 15-4.6-4.6a1.5 1.5 0 0 0-2.1 0L5 19.5" />
      </svg>
    </div>
  );
}

export function ShowcaseCarousel({
  items = [],
  autoplay = 6000,
  theme = "dark",
  label = "Showcase",
  ctaLabel = "Read case",
  className = "",
  onIndexChange,
}: ShowcaseCarouselProps) {
  const t = CAROUSEL_THEMES[theme];
  const rootRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const fillRefs = React.useRef<(HTMLSpanElement | null)[]>([]);
  const reduced = usePrefersReducedMotion();

  const [index, setIndex] = React.useState(0);
  const [mobile, setMobile] = React.useState(true);
  const [visible, setVisible] = React.useState(false);
  const [userTook, setUserTook] = React.useState(false);
  const [edges, setEdges] = React.useState({ start: true, end: false });

  /* layout mode follows the container width */
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setMobile(e.contentRect.width < MOBILE_MAX));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* autoplay only while the slider is on screen */
  React.useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cards = () => Array.from(trackRef.current?.children ?? []) as HTMLElement[];

  const measure = React.useCallback(() => {
    const track = trackRef.current;
    const cs = cards();
    if (!track || !cs.length) return;
    const base = cs[0].offsetLeft;
    const x = track.scrollLeft;
    let best = 0;
    let bestD = Infinity;
    cs.forEach((c, i) => {
      const d = Math.abs(c.offsetLeft - base - x);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    const max = track.scrollWidth - track.clientWidth;
    setEdges({ start: x < 4, end: x > max - 4 });
    setIndex((prev) => (prev === best ? prev : best));
  }, []);

  React.useEffect(() => {
    onIndexChange?.(index);
  }, [index, onIndexChange]);

  React.useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, items.length, mobile]);

  const goTo = React.useCallback(
    (i: number) => {
      const track = trackRef.current;
      const cs = cards();
      if (!track || !cs.length) return;
      const n = Math.max(0, Math.min(cs.length - 1, i));
      track.scrollTo({ left: cs[n].offsetLeft - cs[0].offsetLeft, behavior: reduced ? "auto" : "smooth" });
    },
    [reduced]
  );

  const takeOver = () => setUserTook(true);

  const playing = mobile && visible && !userTook && !reduced && autoplay > 0 && items.length > 1;

  /* auto-advance + progress fill on the active dot */
  React.useEffect(() => {
    fillRefs.current.forEach((f) => f?.getAnimations().forEach((a) => a.cancel()));
    if (!playing) return;
    const fill = fillRefs.current[index];
    const anim = fill?.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
      duration: autoplay,
      easing: "linear",
      fill: "forwards",
    });
    const timer = window.setTimeout(() => {
      const track = trackRef.current;
      const atEnd = track ? track.scrollLeft > track.scrollWidth - track.clientWidth - 4 : false;
      goTo(atEnd ? 0 : (index + 1) % items.length);
    }, autoplay);
    return () => {
      window.clearTimeout(timer);
      anim?.cancel();
    };
  }, [playing, index, autoplay, items.length, goTo]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      takeOver();
      goTo(index + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      takeOver();
      goTo(index - 1);
    }
  };

  return (
    <div ref={rootRef} className={`@container w-full ${className}`}>
      <div
        ref={trackRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        tabIndex={0}
        onKeyDown={onKey}
        onScroll={measure}
        onPointerDown={takeOver}
        onWheel={(e) => Math.abs(e.deltaX) > Math.abs(e.deltaY) && takeOver()}
        className="flex flex-row items-stretch gap-4 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory px-4 scroll-px-4 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden focus-visible:outline-none @3xl:gap-6 @3xl:px-0 @3xl:scroll-px-0"
      >
        {items.map((item, i) => {
          const active = i === index;
          const Tag = (item.href ? "a" : "div") as React.ElementType;
          const linkProps = item.href ? { href: item.href } : {};
          return (
            <Tag
              key={item.id ?? i}
              {...linkProps}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${items.length}: ${item.title}`}
              className={[
                "group flex flex-none snap-start flex-col gap-5 overflow-hidden rounded-[20px] no-underline transition-opacity duration-[450ms]",
                "h-[510px] w-[min(340px,calc(100cqw-48px))]",
                t.card,
                mobile && !active ? "opacity-50" : "opacity-100",
                "@3xl:h-auto @3xl:w-[calc((100%-24px)/2.15)] @3xl:gap-0 @3xl:overflow-visible @3xl:rounded-none @3xl:bg-transparent @6xl:w-[calc((100%-48px)/2.6)]",
                item.href ? "cursor-pointer" : "cursor-default",
              ].join(" ")}
            >
              <div
                className={`relative h-[230px] flex-none overflow-hidden rounded-[20px] transition-transform duration-500 ease-[cubic-bezier(.2,.7,.2,1)] @3xl:h-auto @3xl:aspect-[16/10] ${
                  item.href ? "group-active:scale-[.98]" : ""
                }`}
                style={{ background: item.background ?? (item.cover || item.image || item.video ? "#1a1a1a" : theme === "dark" ? "#1e1e1e" : "#e3e3e3") }}
              >
                {item.cover ? (
                  item.cover
                ) : item.video ? (
                  <video
                    src={item.video}
                    poster={item.image}
                    muted
                    loop
                    playsInline
                    autoPlay
                    preload="metadata"
                    aria-label={item.alt ?? item.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : item.image ? (
                  <img
                    src={item.image}
                    alt={item.alt ?? item.title}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <EmptyCover theme={theme} />
                )}
                {item.badge && (
                  <span
                    className={`absolute left-2.5 top-3 z-10 flex h-[22px] items-center rounded-md border px-1.5 text-xs leading-5 tracking-[-0.05em] ${t.badge}`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-4 px-[15px] pb-[15px] @3xl:mt-5 @3xl:px-0 @3xl:pb-0">
                <h3
                  className={`m-0 text-[22px] font-medium leading-[29px] tracking-[-0.05em] text-balance transition-colors duration-[450ms] @3xl:text-[26px] ${t.title}`}
                >
                  {item.title}
                </h3>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span key={tag} className={`h-6 rounded-full px-2.5 py-0.5 text-sm leading-5 ${t.tag}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {item.description && (
                  <p
                    className={`m-0 line-clamp-3 text-base leading-6 @3xl:line-clamp-none ${t.desc}`}
                  >
                    {item.description}
                  </p>
                )}
                {item.href && (
                  <span
                    className={`-mt-1 hidden items-center gap-1.5 text-base font-medium @3xl:inline-flex ${t.cta}`}
                  >
                    {item.cta ?? ctaLabel}
                    <span className={`grid h-[18px] w-[18px] place-items-center rounded-full ${t.arrowDot}`}>
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                        <path d="M1 4h8M6 1l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </span>
                )}
              </div>
            </Tag>
          );
        })}
      </div>

      {items.length > 1 && (
        <div className="mt-5 flex items-center gap-3.5 @3xl:mt-7">
          <button
            type="button"
            aria-label="Previous"
            disabled={edges.start}
            onClick={() => {
              takeOver();
              goTo(index - 1);
            }}
            className={`hidden h-11 w-11 place-items-center rounded-full border transition disabled:cursor-default disabled:opacity-30 @3xl:grid ${t.btn}`}
          >
            <Arrow dir="prev" />
          </button>

          <div role="tablist" aria-label={label} className="flex flex-1 justify-center gap-1.5">
            {items.map((item, i) => {
              const active = i === index;
              return (
                <button
                  key={item.id ?? i}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`${i + 1}: ${item.title}`}
                  onClick={() => {
                    takeOver();
                    goTo(i);
                  }}
                  className={`relative h-1.5 cursor-pointer overflow-hidden rounded-[3px] transition-[width,background-color] duration-[350ms] ease-[cubic-bezier(.2,.8,.2,1)] before:absolute before:-inset-x-1 before:-inset-y-2.5 before:content-[''] ${
                    active ? `w-[22px] ${t.dotActive}` : "w-1.5"
                  } ${t.dot}`}
                >
                  {mobile && (
                    <span
                      ref={(el) => {
                        fillRefs.current[i] = el;
                      }}
                      aria-hidden="true"
                      className={`absolute inset-0 origin-left ${i < index ? t.done : t.fill}`}
                      style={{
                        transform: i < index || (active && !playing) ? "scaleX(1)" : "scaleX(0)",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            aria-label="Next"
            disabled={edges.end}
            onClick={() => {
              takeOver();
              goTo(index + 1);
            }}
            className={`hidden h-11 w-11 place-items-center rounded-full border transition disabled:cursor-default disabled:opacity-30 @3xl:grid ${t.btn}`}
          >
            <Arrow dir="next" />
          </button>
        </div>
      )}
    </div>
  );
}



/* ------------------------------------------------------------------ */
/*  Portfolio template — first screen of a designer's site:            */
/*  falling keyword badges (drag & throw), avatar + name + bio,        */
/*  social links and a mobile-first case carousel.                     */
/*  Layout follows the CONTAINER width (mobile < 768 < tablet < 1152). */
/* ------------------------------------------------------------------ */

export type PortfolioBadge = { label: string; bg?: string; border?: string; color?: string };
export type PortfolioLink = { label: string; href: string };

export type PortfolioTemplateProps = {
  name?: string;
  role?: string;
  /** Bio: parts wrapped in **double asterisks** are highlighted. */
  bio?: string;
  avatar?: string;
  links?: PortfolioLink[];
  badges?: PortfolioBadge[];
  cases?: ShowcaseItem[];
  /** "auto" follows the `dark` class on <html> (shadcn / 21st convention). */
  theme?: "dark" | "light" | "auto";
  /** Change this value to drop the badges again. */
  dropKey?: number;
  /** Show a "grab & throw" hint until the visitor touches a badge. */
  dragHint?: boolean;
  /** Case carousel auto-advance on mobile, ms. 0 turns it off. */
  autoplay?: number;
  className?: string;
  /** Element for the name, so a host page that already has an h1 keeps one. */
  nameAs?: "h1" | "h2" | "p";
};

export const DEFAULT_BADGES: PortfolioBadge[] = [
  { label: "PIXEL PERFECT" },
  { label: "UX/UI DESIGN" },
  { label: "BRANDING" },
  { label: "UI DESIGN" },
  { label: "TOUCHPOINT" },
  { label: "IMPROVEMENTS" },
  { label: "PAIN POINT", bg: "#ea582f", border: "#ea582f", color: "#fff" },
  { label: "CTA" },
  { label: "WEB 3.0", bg: "#d5ff00", border: "#566700", color: "#374200" },
  { label: "AI", bg: "#043ae5", border: "#043ae5", color: "#fff" },
  { label: "MARKETING" },
  { label: "USER FLOW" },
  { label: "USABILITY" },
  { label: "CREATIVE", bg: "#ff531f", border: "#ff531f", color: "#fff" },
  { label: "CJM", bg: "#6204e5", border: "#6204e5", color: "#fff" },
  { label: "DESIGN SYSTEM", bg: "#63d990", border: "#136231", color: "#073318" },
  { label: "COMPONENTS", bg: "#cd50ff", border: "#cd50ff", color: "#fff" },
  { label: "ATOMIC DESIGN" },
  { label: "TRENDS" },
  { label: "YOUR NAME", bg: "#d27ef9", border: "#d27ef9", color: "#fff" },
  { label: "SENIOR", bg: "#3c2cff", border: "#3c2cff", color: "#fff" },
  { label: "PRODUCT DESIGNER", bg: "#cd50ff", border: "#cd50ff", color: "#fff" },
];

const DEFAULT_CASES: ShowcaseItem[] = [
  {
    title: "How I designed [product] from scratch in [N] months",
    description: "One or two lines about the product: who it is for and what changed after the launch.",
    tags: ["Fintech", "SaaS", "B2B", "B2C"],
    href: "#",
  },
  {
    title: "Onboarding that helped [audience] make their first [action]",
    description: "What the problem was, what you did, and the metric that moved — for example +40% to activation.",
    tags: ["Fintech", "Mobile", "B2C"],
    badge: "NDA",
  },
  {
    title: "A [mechanic] that kept [result] after the release",
    description: "Short story of a key decision: the constraint, the idea and how it played out with real users.",
    tags: ["Marketplace", "B2C"],
    href: "#",
  },
  {
    title: "Designed a [type of product] for [audience]",
    description: "Number of screens, platforms and your role — research, UX, UI, design system, handoff.",
    tags: ["SaaS", "B2B"],
    href: "#",
  },
];

const DEFAULTS = {
  name: "Your Name",
  role: "Product Designer · UX/UI Designer",
  bio: "**N+ years designing digital products — **fintech and payments, marketplaces, B2B systems and e-commerce,** from the first idea to the release.**",
  links: [
    { label: "Telegram", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "E-mail", href: "#" },
  ],
  badges: DEFAULT_BADGES,
  cases: DEFAULT_CASES,
};

const THEMES = {
  dark: {
    bg: "#060606",
    ink: "#ffffff",
    muted: "#767676",
    plainBorder: "#414141",
    plainColor: "#ffffff",
    glow: "rgba(60,44,255,.45)",
    avatarBorder: "#0f0f0f",
    hint: "bg-[#161616]/90 border-[#2a2a2a] text-[#cfcfcf]",
  },
  light: {
    bg: "#f7f7f5",
    ink: "#111111",
    muted: "#8a8a8a",
    plainBorder: "#cfcfcf",
    plainColor: "#111111",
    glow: "rgba(60,44,255,.16)",
    avatarBorder: "#e6e6e6",
    hint: "bg-white/90 border-[#e2e2e2] text-[#3d3d3d]",
  },
} as const;

/* ---------- falling badges (Matter.js) ---------- */

const PHYS = { gravity: 2.1, restitution: 0.04, friction: 0.9, frictionStatic: 1.4, frictionAir: 0.012, density: 0.006, stagger: 55 };
const DT = 1000 / 120;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

function FallingBadges({
  badges,
  plain,
  onSettled,
  onGrab,
}: {
  badges: PortfolioBadge[];
  plain: { border: string; color: string };
  onSettled?: () => void;
  onGrab?: () => void;
}) {
  const zoneRef = React.useRef<HTMLDivElement>(null);
  const elRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const cb = React.useRef({ onSettled, onGrab });
  cb.current = { onSettled, onGrab };
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  const list = React.useMemo(() => [...badges].sort(() => Math.random() - 0.5), [badges]);

  React.useEffect(() => {
    const zone = zoneRef.current;
    if (!zone) return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      const h = Math.round(e.contentRect.height);
      setSize((s) => (Math.abs(s.w - w) > 8 || s.h !== h ? { w, h } : s));
    });
    ro.observe(zone);
    return () => ro.disconnect();
  }, []);

  React.useEffect(() => {
    const zone = zoneRef.current;
    if (!zone || !size.w) return;
    const { Engine, Bodies, Body, Composite, Constraint, Sleeping } = Matter;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const W = size.w;
    const H = size.h;
    const T = 200;

    const engine = Engine.create({ enableSleeping: true, positionIterations: 24, velocityIterations: 16, constraintIterations: 4 });
    engine.gravity.y = PHYS.gravity;
    Composite.add(engine.world, [
      Bodies.rectangle(W / 2, H - 3 + T / 2, W * 3, T, { isStatic: true, friction: 1, slop: 0.01 }),
      Bodies.rectangle(-T / 2, H / 2 - 600, T, H + 1600, { isStatic: true }),
      Bodies.rectangle(W + T / 2, H / 2 - 600, T, H + 1600, { isStatic: true }),
      Bodies.rectangle(W / 2, -1400 - T / 2, W * 3, T, { isStatic: true }),
    ]);

    type B = Matter.Body & { el: HTMLDivElement; w: number; h: number };
    const els = elRefs.current.slice(0, list.length).filter(Boolean) as HTMLDivElement[];
    els.forEach((el) => (el.style.visibility = "hidden"));
    const bodies: B[] = els.map((el) => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const b = Bodies.rectangle(rnd(w / 2 + 4, Math.max(w / 2 + 5, W - w / 2 - 4)), 0, w, h, {
        chamfer: { radius: 12 },
        restitution: PHYS.restitution,
        friction: PHYS.friction,
        frictionStatic: PHYS.frictionStatic,
        frictionAir: PHYS.frictionAir,
        density: PHYS.density,
        sleepThreshold: 40,
        slop: 0.01,
      }) as B;
      b.el = el;
      b.w = w;
      b.h = h;
      return b;
    });

    let raf = 0;
    let running = false;
    let last = 0;
    let acc = 0;
    let spawned = 0;
    let settledOnce = false;
    let drag: Matter.Constraint | null = null;
    const timers: number[] = [];

    const render = () => {
      for (const b of bodies)
        b.el.style.transform = `translate(${(b.position.x - b.w / 2).toFixed(1)}px,${(b.position.y - b.h / 2).toFixed(1)}px) rotate(${b.angle.toFixed(4)}rad)`;
    };
    const tick = (ts: number) => {
      if (!last) last = ts;
      acc += Math.min(50, ts - last);
      last = ts;
      while (acc >= DT) {
        Engine.update(engine, DT);
        acc -= DT;
      }
      render();
      if (spawned === bodies.length && !drag && bodies.every((b) => b.isSleeping)) {
        running = false;
        last = 0;
        acc = 0;
        if (!settledOnce) {
          settledOnce = true;
          cb.current.onSettled?.();
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!running) {
        running = true;
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };
    const place = (b: B, y: number) => {
      Body.setPosition(b, { x: b.position.x, y });
      Body.setAngle(b, rnd(-0.7, 0.7));
      Composite.add(engine.world, b);
      Body.setVelocity(b, { x: rnd(-1.2, 1.2), y: rnd(3, 6) });
      Body.setAngularVelocity(b, rnd(-0.04, 0.04));
    };

    const local = (e: PointerEvent) => {
      const r = zone.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const offs: (() => void)[] = [];
    bodies.forEach((b) => {
      const el = b.el;
      const down = (e: PointerEvent) => {
        if (!engine.world.bodies.includes(b)) return;
        e.preventDefault();
        cb.current.onGrab?.();
        el.setPointerCapture(e.pointerId);
        el.style.cursor = "grabbing";
        const p = local(e);
        const dx = p.x - b.position.x;
        const dy = p.y - b.position.y;
        const c = Math.cos(-b.angle);
        const s = Math.sin(-b.angle);
        drag = Constraint.create({ pointA: p, bodyB: b, pointB: { x: dx * c - dy * s, y: dx * s + dy * c }, stiffness: 0.12, damping: 0.08, length: 0 });
        Composite.add(engine.world, drag);
        Sleeping.set(b, false);
        wake();
      };
      const move = (e: PointerEvent) => {
        if (!drag || drag.bodyB !== b) return;
        drag.pointA = local(e);
        Sleeping.set(b, false);
      };
      const end = () => {
        if (drag && drag.bodyB === b) {
          Composite.remove(engine.world, drag);
          drag = null;
          el.style.cursor = "grab";
          bodies.forEach((x) => Sleeping.set(x, false));
          wake();
        }
      };
      el.addEventListener("pointerdown", down);
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", end);
      el.addEventListener("pointercancel", end);
      offs.push(() => {
        el.removeEventListener("pointerdown", down);
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", end);
        el.removeEventListener("pointercancel", end);
      });
    });

    if (reduce) {
      bodies.forEach((b, i) => place(b, -60 - i * 45));
      for (let i = 0; i < 1800; i++) Engine.update(engine, DT);
      render();
      bodies.forEach((b) => (b.el.style.visibility = "visible"));
      spawned = bodies.length;
      settledOnce = true;
      cb.current.onSettled?.();
    } else {
      bodies.forEach((b, i) =>
        timers.push(
          window.setTimeout(() => {
            place(b, -50 - rnd(0, 120));
            b.el.style.visibility = "visible";
            spawned++;
            wake();
          }, 300 + i * PHYS.stagger)
        )
      );
    }

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      offs.forEach((off) => off());
      Composite.clear(engine.world, false);
      Engine.clear(engine);
    };
  }, [size, list]);

  return (
    <div ref={zoneRef} className="absolute inset-x-0 top-0 h-[424px] overflow-hidden @6xl:h-[456px]" aria-label="Keywords">
      {list.map((b, i) => (
        <div
          key={b.label + i}
          ref={(el) => {
            elRefs.current[i] = el;
          }}
          className="absolute left-0 top-0 flex h-[34px] cursor-grab touch-none select-none items-center whitespace-nowrap rounded-xl border px-3.5 text-base tracking-[-0.05em] will-change-transform"
          style={{
            visibility: "hidden",
            background: b.bg ?? "transparent",
            borderColor: b.border ?? plain.border,
            color: b.color ?? plain.color,
          }}
        >
          {b.label}
        </div>
      ))}
    </div>
  );
}

/* ---------- small pieces ---------- */

const ArrowUpRight = ({ color }: { color: string }) => (
  <svg className="h-[15px] w-[15px] flex-none" viewBox="0 0 15 15" aria-hidden="true">
    <path d="M4 11 11 4M5 4h6v6" stroke={color} strokeWidth="1.4" fill="none" />
  </svg>
);

const HandIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 11V6a2 2 0 0 0-4 0v1M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </svg>
);

function Bio({ text, ink }: { text: string; ink: string }) {
  return (
    <>
      {text.split("**").map((p, i) =>
        i % 2 ? (
          <b key={i} className="font-medium" style={{ color: ink }}>
            {p}
          </b>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        )
      )}
    </>
  );
}

/* ---------- template ---------- */

/** Resolves "auto" from the `dark` class on <html>, and follows it live. */
function useResolvedTheme(theme: "dark" | "light" | "auto"): "dark" | "light" {
  const [auto, setAuto] = React.useState<"dark" | "light">("dark");
  React.useEffect(() => {
    if (theme !== "auto") return;
    const root = document.documentElement;
    const read = () => setAuto(root.classList.contains("dark") ? "dark" : "light");
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, [theme]);
  return theme === "auto" ? auto : theme;
}

export function PortfolioTemplate(props: PortfolioTemplateProps) {
  const { name, role, bio, links, badges, cases } = { ...DEFAULTS, ...props };
  const { avatar, theme: themeProp = "auto", dropKey = 0, dragHint = true, autoplay = 6000, className = "", nameAs: NameTag = "h1" } = props;
  const theme = useResolvedTheme(themeProp);
  const t = THEMES[theme];
  const [hint, setHint] = React.useState<"hidden" | "shown" | "done">("hidden");

  React.useEffect(() => {
    setHint((h) => (h === "done" ? h : "hidden"));
  }, [dropKey]);

  return (
    <div
      className={`@container relative w-full overflow-x-clip antialiased transition-colors duration-300 ${className}`}
      style={{
        background: t.bg,
        color: t.ink,
        fontFamily: "'Geist', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        letterSpacing: "-0.05em",
      }}
    >
      <main className="relative mx-auto max-w-[450px] @3xl:max-w-[820px] @6xl:max-w-[1280px]">
        {/* hero */}
        <section className="relative pt-[440px] @6xl:pt-[480px]">
          <div
            className="pointer-events-none absolute -left-[120px] -top-[160px] h-[360px] w-[420px] rounded-full @6xl:-left-20 @6xl:-top-[200px] @6xl:h-[620px] @6xl:w-[900px]"
            style={{ background: `radial-gradient(closest-side, ${t.glow}, transparent)` }}
          />
          <FallingBadges
            key={dropKey}
            badges={badges}
            plain={{ border: t.plainBorder, color: t.plainColor }}
            onSettled={() => dragHint && setHint((h) => (h === "done" ? h : "shown"))}
            onGrab={() => setHint("done")}
          />

          {dragHint && (
            <div className="pointer-events-none absolute inset-x-0 top-16 z-10 flex justify-center px-2.5 @3xl:top-[220px] @6xl:top-[260px]">
              <div
                aria-live="polite"
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm backdrop-blur-md transition-all duration-500 ${t.hint} ${
                  hint === "shown" ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
                }`}
              >
                <span className={hint === "shown" ? "animate-bounce" : ""}>
                  <HandIcon />
                </span>
                Grab a badge and throw it
              </div>
            </div>
          )}

          <div className="relative px-2.5 @3xl:px-8 @6xl:grid @6xl:grid-cols-[380px_1fr] @6xl:items-start @6xl:gap-x-20 @6xl:px-12">
            <div className="flex items-center gap-6 @6xl:col-start-1 @6xl:row-start-1">
              <div className="relative h-20 w-[60px] flex-none overflow-hidden rounded-[20px] border" style={{ borderColor: t.avatarBorder }}>
                {avatar ? (
                  <img src={avatar} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <EmptyCover theme={theme} className="[&_svg]:h-6 [&_svg]:w-6" />
                )}
              </div>
              <div>
                <NameTag className="m-0 text-[32px] font-normal leading-[42px]">{name}</NameTag>
                <p className="m-0 text-lg" style={{ color: t.muted }}>
                  {role}
                </p>
              </div>
            </div>

            <p
              className="mt-[30px] text-[26px] font-medium leading-[28px] @6xl:col-start-2 @6xl:row-span-2 @6xl:row-start-1 @6xl:m-0 @6xl:max-w-[820px] @6xl:text-[40px] @6xl:leading-[44px]"
              style={{ color: t.muted }}
            >
              <Bio text={bio} ink={t.ink} />
            </p>

            <div className="mt-8 flex flex-wrap gap-4 @6xl:col-start-1 @6xl:row-start-2 @6xl:mt-7">
              {links.map((l) => (
                <a key={l.label} href={l.href} {...(/^https?:/.test(l.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="flex items-center gap-1.5 text-lg leading-5" style={{ color: t.ink }}>
                  {l.label} <ArrowUpRight color={t.muted} />
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* cases */}
        {cases.length > 0 && (
          <section className="mt-20 pb-24 @3xl:px-8 @6xl:mt-[120px] @6xl:px-12">
            <ShowcaseCarousel items={cases} theme={theme} label="Cases" autoplay={autoplay} />
          </section>
        )}
      </main>
    </div>
  );
}

export default PortfolioTemplate;
