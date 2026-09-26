# Organization Workspace — Design System

Applies to the pages inside an organization: **Overview · Academic Structure · Staff & Teachers ·
School Settings**. Implemented in `frontend/edu-tracker/src/styles/workspace.css` (scoped to
`.dz-org-content`, so the main dashboard is untouched).

Built with Garden Skills `web-design-engineer` (design read, recipe, redesign protocol) and Emil
Kowalski's `emil-design-eng` (motion and interaction rules). See `DESIGN-SKILLS.md`.

## Design read

```yaml
artifact: operational admin workspace (school management)
audience: school owners, registrars, HODs — daily use, mostly non-technical
visual-language: Linear-derived modern tool, minus developer signals (no keyboard chips, mono only for codes)
mode: redesign · overhaul, brand preserved
visual-variance: 4
motion-intensity: 3
information-density: 7
asset-dependence: 2
brand-fidelity: 7
```

**Brand invariants kept:** dark ground `#0a0e14`, violet `#8b5cf6` as the only interactive accent,
cyan `#22d3ee` for data/signal only, Newsreader italic for page titles (the one identity-bearing
type choice — replacing it with a sans would make it generic).

**Anchor:** Garden recipe `linear` — hairline borders, restrained accent (< 5% of pixels), modest
radius, no glow. Adjusted because its "don't use when the audience is non-technical" warning
applies: we drop monospace/keyboard-first signals.

## Redesign record (Garden redesign protocol)

| | |
|---|---|
| **Preserve** | Routes, API calls, form fields, dark theme, violet/cyan roles, Newsreader titles, sidebar shell |
| **Improve** | Hierarchy, density, spacing rhythm, states, press feedback, motion curves |
| **Remove** | Gradient cards, glow shadows on buttons, one-card-per-number layouts ("cardification"), `transition: all`, ungated hover lifts, browser `confirm()`/`prompt()` for destructive actions |
| **Protected** | All routes and deep links; add-member form fields and submit; rename/delete API behaviour |
| **Highest risk** | Staff page restructure (two data sources merged into one directory) |
| **Rollback** | Remove the `workspace.css` import in `OrganizationLayout.tsx` to restore the old look |

## Tokens

| Role | Value |
|---|---|
| Ground | `#0a0e14` |
| Surface | `#0e141f` (flat — no gradient) |
| Surface raised / hover | `#131b2a` |
| Hairline | `rgba(255,255,255,0.07)` |
| Hairline strong | `rgba(255,255,255,0.12)` |
| Text | `#f1f5f9` / `#94a3b8` / `#64748b` |
| Accent (interactive) | `#8b5cf6`, light `#a78bfa` |
| Signal (data) | `#22d3ee` |
| Success / warn / danger | `#4ade80` / `#fbbf24` / `#f87171` |

**Spacing:** 4 · 8 · 12 · 16 · 24 · 32 · 48.
**Radius grammar:** 6 controls and badges · 10 cards and panels · 999 only for status pills and
avatars. Nothing above 12.
**Elevation:** hairline only. Shadow appears only on floating layers (drawer, modal, popover).
**Type:** Newsreader italic for page titles; Inter 14–15px body; tabular figures for numbers;
JetBrains Mono only for codes (course codes, staff numbers).

## Layout rules

- **One surface per section, not one card per item.** Group related numbers or rows on a single
  surface and separate them with hairlines.
- **Page anatomy:** header (breadcrumb · title · one line of meta · actions) → content. No page
  subtitle paragraphs.
- **Lists over cards** once there are more than ~8 items.
- **Detail opens in a right drawer**, not a new page, when the user will come straight back.
- Every data view has loading, empty and error states.

## Motion (Emil Kowalski)

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);      /* entering, feedback */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);  /* moving on screen */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);   /* drawers */
```

| Interaction | Rule |
|---|---|
| Button / card press | `scale(0.97)`, 140 ms, ease-out |
| Hover | colour/border only, 150 ms `ease`, gated by `(hover: hover) and (pointer: fine)` |
| Drawer | enter 320 ms `--ease-drawer`; exit faster |
| Modal | 200 ms from `scale(0.96)` + opacity, origin centre |
| Toast | 240 ms ease-out from below |
| Tabs, filters, level switching, search results | **no animation** (used constantly) |
| Page load | none; content appears immediately |
| Reduced motion | drop transforms, keep opacity/colour |

Never: `transition: all`, `ease-in`, `scale(0)`, glow shadows, animated hover lifts on rows.
