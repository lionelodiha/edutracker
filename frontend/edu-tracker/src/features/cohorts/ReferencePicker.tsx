import { useState } from "react";

/** Existing contract accepts IDs; supplied directory options make them human-readable. */
export default function ReferencePicker({ label, options, value, onChange, optional, placeholder }: {
  label: string; options: Map<string, string>; value: string; onChange: (value: string) => void;
  optional?: boolean; placeholder: string;
}) {
  const [custom, setCustom] = useState(options.size === 0);
  return <div className="cohort-field">
    <label>{label}{optional && <span className="cohort-muted">Optional</span>}
      <select value={custom ? "__custom" : value} required={!optional} onChange={event => {
        const next = event.target.value;
        setCustom(next === "__custom");
        onChange(next === "__custom" ? "" : next);
      }}>
        <option value="">{optional ? "Not assigned" : `Select ${label.toLowerCase()}`}</option>
        {Array.from(options, ([id, name]) => <option key={id} value={id}>{name}</option>)}
        <option value="__custom">Enter an existing ID…</option>
      </select>
    </label>
    {custom && <label className="cohort-muted">{label} ID<input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={!optional} /></label>}
  </div>;
}
