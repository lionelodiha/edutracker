/* Visual building blocks for the portal: rings, mark bars, the hero banner
   and course tiles. Numbers stay readable without the graphics. */
import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { monogramColour } from "../academics/helpers";
import type { AssessmentComponent, Scores } from "../assessment/scheme";

/** Circular progress. `value` of `max`; the centre shows `display`. */
export function Ring({ value, max, display, label, sub, colour = "var(--accent)", size = 92 }: {
  value: number; max: number; display: ReactNode; label: string; sub?: ReactNode; colour?: string; size?: number;
}) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return <figure className="pt-ring" style={{ "--ring": colour } as CSSProperties}>
    <span className="pt-ring-graphic" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} className="pt-ring-track" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius} className="pt-ring-value" strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - ratio)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <strong>{display}</strong>
    </span>
    <figcaption><span>{label}</span>{sub && <small>{sub}</small>}</figcaption>
  </figure>;
}

const PART_COLOURS = ["#8b5cf6", "#22d3ee", "#fbbf24", "#34d399"];

/**
 * One bar out of 100: each assessment is a segment sized by its weight,
 * filled by the mark earned. Unpublished segments stay empty and dashed.
 */
export function MarkBar({ scheme, scores }: { scheme: AssessmentComponent[]; scores: Scores }) {
  return <div className="pt-markbar" role="img" aria-label={scheme.map(component => `${component.label} ${typeof scores[component.key] === "number" ? `${scores[component.key]} of ${component.max}` : "not out yet"}`).join(", ")}>
    {scheme.map((component, index) => {
      const mark = scores[component.key];
      const known = typeof mark === "number";
      return <span key={component.key} className={known ? "" : "is-pending"} style={{ flexGrow: component.max, "--part": PART_COLOURS[index % PART_COLOURS.length] } as CSSProperties} title={`${component.label}: ${known ? `${mark}/${component.max}` : "not out yet"}`}>
        <i style={{ width: known ? `${((mark as number) / component.max) * 100}%` : 0 }} />
      </span>;
    })}
  </div>;
}

export function MarkLegend({ scheme }: { scheme: AssessmentComponent[] }) {
  return <p className="pt-legend">{scheme.map((component, index) => (
    <span key={component.key}><i style={{ background: PART_COLOURS[index % PART_COLOURS.length] }} />{component.label} {component.max}</span>
  ))}</p>;
}

/** Top-of-home banner: greeting, context and one "what's next" block. */
export function Hero({ eyebrow, title, meta, initials, children }: { eyebrow: string; title: string; meta: string; initials: string; children?: ReactNode }) {
  return <section className="pt-hero">
    <div className="pt-hero-top">
      <span className="pt-hero-avatar" aria-hidden="true">{initials}</span>
      <div className="pt-hero-copy">
        <span className="pt-hero-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{meta}</p>
      </div>
    </div>
    {children && <div className="pt-hero-slot">{children}</div>}
  </section>;
}

/** Colour-coded tile for a course or subject. */
export function CourseTile({ code, title, sub, to, children }: { code: string; title: string; sub?: string; to?: string; children?: ReactNode }) {
  const style = { "--slot": monogramColour(code) } as CSSProperties;
  const body = <>
    <span className="pt-tile-code">{code}</span>
    <strong className="pt-tile-title">{title}</strong>
    {sub && <small className="pt-tile-sub">{sub}</small>}
    {children}
  </>;
  return to ? <Link to={to} className="pt-tile" style={style}>{body}</Link> : <div className="pt-tile" style={style}>{body}</div>;
}

/** A horizontal row of rings that scrolls sideways on narrow phones. */
export function RingRow({ children }: { children: ReactNode }) {
  return <section className="pt-ring-row" aria-label="At a glance">{children}</section>;
}

/** The "what's next" strip inside the hero: badge, what it is, and a countdown. */
export function NextUp({ badge, colourKey, label, title, detail, countdown, countdownLabel, to }: {
  badge: string; colourKey: string; label: string; title: string; detail: string; countdown?: string; countdownLabel?: string; to: string;
}) {
  return <Link to={to} className="pt-hero-next" style={{ "--slot": monogramColour(colourKey) } as CSSProperties}>
    <span className="pt-next-icon" aria-hidden="true">{badge}</span>
    <span className="pt-next-copy"><small>{label}</small><strong>{title}</strong><span>{detail}</span></span>
    {countdown && <span className="pt-countdown"><b>{countdown}</b>{countdownLabel && <small>{countdownLabel}</small>}</span>}
  </Link>;
}
