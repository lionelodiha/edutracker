import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { monogramColour } from "./helpers";
import type { AcademicSession } from "./types";

/* Shared building blocks for the academic structure screens (ACADEMIC-DESIGN §2). */

export function Monogram({ code, size = 40 }: { code: string; size?: number }) {
  const colour = monogramColour(code || "?");
  return <span className="ac-monogram" style={{ width: size, height: size, color: colour, background: `${colour}2e`, fontSize: size * 0.34 }} aria-hidden="true">{(code || "?").slice(0, 3)}</span>;
}

type BadgeTone = "code" | "neutral" | "warn" | "current" | "upcoming" | "closed";
export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`ac-badge ac-badge-${tone}`}>{children}</span>;
}
export function StatusBadge({ status }: { status: AcademicSession["status"] }) {
  return <Badge tone={status.toLowerCase() as BadgeTone}>{status}</Badge>;
}

export type Crumb = { label: string; to?: string };
export function AcHeader({ crumbs, title, badge, meta, actions, lead }: { crumbs?: Crumb[]; title: ReactNode; badge?: ReactNode; meta?: ReactNode[]; actions?: ReactNode; lead?: ReactNode }) {
  const shownMeta = (meta ?? []).filter(Boolean);
  return <header className="ac-header">
    {crumbs && crumbs.length > 0 && <nav className="ac-breadcrumb" aria-label="Breadcrumb">{crumbs.map((crumb, index) => <span key={index}>{index > 0 && <span className="ac-crumb-sep" aria-hidden="true">/</span>}{crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}</span>)}</nav>}
    <div className="ac-title-row">
      <div className="ac-title">{lead}<h1 className="dz-page-title">{title}</h1>{badge}</div>
      {actions && <div className="ac-actions">{actions}</div>}
    </div>
    {shownMeta.length > 0 && <p className="ac-meta">{shownMeta.map((item, index) => <span key={index}>{index > 0 && " · "}{item}</span>)}</p>}
  </header>;
}

export function SessionPicker({ sessions, value, onChange }: { sessions: AcademicSession[]; value: string | null; onChange: (id: string) => void }) {
  if (!sessions.length) return null;
  return <label className="ac-session-pill"><span className="sr-only">Session</span>
    <select value={value ?? ""} onChange={event => onChange(event.target.value)} aria-label="Session">
      {sessions.map(item => <option key={item.sessionId} value={item.sessionId}>{item.name} · {item.status}</option>)}
    </select>
  </label>;
}

export type Stat = { label: string; value: ReactNode; extra?: ReactNode };
export function StatCells({ stats, label }: { stats: Stat[]; label: string }) {
  return <section className="dz-card ac-stats" aria-label={label} style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
    {stats.map(stat => <div className="ac-stat" key={stat.label}><span className="dz-stat-label">{stat.label}</span><strong>{stat.value}</strong>{stat.extra}</div>)}
  </section>;
}

export function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  const ratio = max > 0 ? value / max : 0;
  const tone = ratio > 1 ? "over" : ratio >= 0.9 ? "high" : "ok";
  return <span className={`ac-meter ac-meter-${tone}`} role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}><span style={{ width: `${Math.min(100, ratio * 100)}%` }} /></span>;
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return <section className="dz-card ac-empty"><h2>{title}</h2>{text && <p>{text}</p>}{action && <div className="ac-actions">{action}</div>}</section>;
}

export function Skeleton({ variant }: { variant: "cards" | "department" | "list" }) {
  if (variant === "department") return <div className="ac-skeleton" aria-busy="true" aria-label="Loading"><div className="skeleton" style={{ height: 40, width: 320 }} /><div className="skeleton" style={{ height: 86 }} /><div className="ac-skel-split"><div className="skeleton" style={{ height: 240 }} /><div className="skeleton" style={{ height: 240 }} /></div></div>;
  if (variant === "list") return <div className="ac-skeleton" aria-busy="true" aria-label="Loading">{[0, 1, 2].map(i => <div key={i} className="skeleton" style={{ height: 72 }} />)}</div>;
  return <div className="ac-skeleton" aria-busy="true" aria-label="Loading"><div className="skeleton" style={{ height: 40, width: 280 }} /><div className="ac-card-grid">{[0, 1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 170 }} />)}</div></div>;
}

/** Right-side panel for editing without hiding the page behind it. */
export function Drawer({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key !== "Tab" || !panel.current) return;
      const focusable = panel.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]");
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); opener?.focus?.(); };
  }, []);
  return <div className="ac-drawer-layer">
    <div className="ac-drawer-scrim" onClick={() => onCloseRef.current()} />
    <aside className="ac-drawer" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={panel}>
      <header className="ac-drawer-head"><h2>{title}</h2><button type="button" className="ac-icon-btn" aria-label="Close" onClick={() => onCloseRef.current()}>×</button></header>
      <div className="ac-drawer-body">{children}</div>
      {footer && <footer className="ac-drawer-foot">{footer}</footer>}
    </aside>
  </div>;
}

export function Stepper({ steps, current, onJump }: { steps: string[]; current: number; onJump?: (index: number) => void }) {
  return <>
    <ol className="ac-stepper" aria-label="Progress">{steps.map((step, index) => {
      const state = index < current ? "done" : index === current ? "current" : "todo";
      return <li key={step} className={`ac-step ac-step-${state}`} aria-current={state === "current" ? "step" : undefined}>
        <button type="button" disabled={!onJump || index > current} onClick={() => onJump?.(index)}><span className="ac-step-dot">{state === "done" ? "✓" : index + 1}</span>{step}</button>
      </li>;
    })}</ol>
    <div className="ac-stepper-mobile"><span>Step {current + 1} of {steps.length} · {steps[current]}</span><span className="ac-meter ac-meter-ok"><span style={{ width: `${((current + 1) / steps.length) * 100}%` }} /></span></div>
  </>;
}

export function TagInput({ value, onChange, suggestions = [], label, placeholder }: { value: string[]; onChange: (next: string[]) => void; suggestions?: string[]; label: string; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const tag = raw.trim().replace(/,$/, "");
    if (tag && !value.some(item => item.toLowerCase() === tag.toLowerCase())) onChange([...value, tag]);
    setDraft("");
  };
  const open = suggestions.filter(item => !value.includes(item) && item.toLowerCase().includes(draft.toLowerCase())).slice(0, 6);
  return <div className="ac-field"><span className="ac-label">{label}</span>
    <div className="ac-tags">
      {value.map(tag => <span className="ac-tag" key={tag}>{tag}<button type="button" aria-label={`Remove ${tag}`} onClick={() => onChange(value.filter(item => item !== tag))}>×</button></span>)}
      <input aria-label={label} value={draft} placeholder={value.length ? "" : placeholder} onChange={event => { if (event.target.value.endsWith(",")) add(event.target.value); else setDraft(event.target.value); }}
        onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); add(draft); } else if (event.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1)); }} />
    </div>
    {draft && open.length > 0 && <div className="ac-tag-suggest">{open.map(item => <button type="button" key={item} onClick={() => add(item)}>{item}</button>)}</div>}
  </div>;
}

export function LevelTimeline({ levels, training, directEntry, internshipYears }: { levels: string[]; training?: string | null; directEntry?: string | null; internshipYears?: number | null }) {
  return <div className="ac-timeline" aria-label="Levels">
    <ol>{levels.map(level => <li key={level} className={level === training ? "is-training" : ""}>
      <span className="ac-timeline-dot" />
      <span>{level}</span>
      {level === directEntry && <small className="ac-timeline-mark">↑ Direct Entry</small>}
      {level === training && <small className="ac-timeline-mark">◇ Training</small>}
    </li>)}</ol>
    {internshipYears ? <p className="ac-timeline-after">+ {internshipYears} year{internshipYears === 1 ? "" : "s"} internship after graduation</p> : null}
  </div>;
}

export function LevelPips({ levels, training }: { levels: string[]; training?: string | null }) {
  return <span className="ac-pips" aria-hidden="true">{levels.map(level => <span key={level} className={level === training ? "hollow" : ""} />)}</span>;
}

export function Segmented<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string }[]; value: T; onChange: (next: T) => void; label: string }) {
  return <div className="ac-segmented" role="radiogroup" aria-label={label}>{options.map(option => <button type="button" role="radio" aria-checked={value === option.value} key={option.value} className={value === option.value ? "active" : ""} onClick={() => onChange(option.value)}>{option.label}</button>)}</div>;
}

/** Tab row with arrow-key navigation. */
export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { value: T; label: string }[]; value: T; onChange: (next: T) => void; label: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  function onKey(event: React.KeyboardEvent, index: number) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + tabs.length) % tabs.length;
    refs.current[next]?.focus();
    onChange(tabs[next].value);
  }
  return <div className="ac-tabs" role="tablist" aria-label={label}>{tabs.map((tab, index) => <button key={tab.value} ref={node => { refs.current[index] = node; }} type="button" role="tab" aria-selected={value === tab.value} tabIndex={value === tab.value ? 0 : -1} className={value === tab.value ? "active" : ""} onKeyDown={event => onKey(event, index)} onClick={() => onChange(tab.value)}>{tab.label}</button>)}</div>;
}
