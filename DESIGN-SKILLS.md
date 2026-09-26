# Designing the Organization Pages with Design Skills

> How to install **Emil Kowalski's skills** and **Garden Skills** into Claude Code, and how to
> use them to redesign the four organization pages:
> **Overview · Academic Structure · Staff & Teachers · School Settings**.

---

## 1. What these skills are

A *skill* is a folder with a `SKILL.md` file of instructions that Claude Code loads when a task
matches it. Installing one doesn't change the app — it changes how the agent designs and reviews.

| Collection | Author | What it's good at | Skills we'll use |
|---|---|---|---|
| **emilkowalski/skills** | Emil Kowalski (Sonner, Vaul, Linear) | Polish, motion, "invisible details", animation review | `emil-design-eng`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `prototype`, `animation-vocabulary` |
| **ConardLi/garden-skills** | ConardLi | Visual direction and layout: a design-system declaration step, a "five-dial design read" and 25 style recipes (Linear, Stripe Press, Bloomberg…) | `web-design-engineer` |

**How they fit together:** Garden's `web-design-engineer` decides **what the page looks like**
(direction, layout, type, colour, density). Emil's skills decide **how it feels** (motion, press
states, hover, transitions) and review the result. Use Garden first, Emil second.

---

## 2. Before you install — safety

Skills are instructions the agent follows with your permissions. Both repos are public and MIT
licensed, but treat them like any dependency:

1. Read the `SKILL.md` files once before installing:
   - https://github.com/emilkowalski/skills
   - https://github.com/ConardLi/garden-skills
2. Install **into this project** (not globally) so they only affect EduTracker, and commit the
   installed folders so everyone on the team gets the same version.
3. Re-read the diff when you update them.

---

## 3. Install

Run these from the **repo root** (`edutracker/`) in a normal terminal. You need Node 18+.

### Emil Kowalski's skills

```bash
npx skills@latest add emilkowalski/skills
```

> Note: `emilkowal.ski/skill` shows `emilkowalski/skill` (singular). The GitHub repo is
> `emilkowalski/skills` (plural) — use the plural.

The CLI asks which skills and which agent. Choose **Claude Code**, and at minimum:
`emil-design-eng`, `review-animations`, `improve-animations`, `find-animation-opportunities`,
`prototype`, `animation-vocabulary`. Skip `animate-expo`, `write-swift`, `mobile-native` — they're
for native mobile.

### Garden Skills (web-design-engineer only)

Either the CLI:

```bash
npx skills add ConardLi/garden-skills -s web-design-engineer -a claude-code
```

or, inside Claude Code, the plugin marketplace:

```
/plugin marketplace add ConardLi/garden-skills
/plugin install web-design-skills@garden-skills
```

We don't need Garden's presentation, image or knowledge-base skills.

### Manual fallback (no npx)

```bash
git clone https://github.com/emilkowalski/skills.git /tmp/emil
git clone https://github.com/ConardLi/garden-skills.git /tmp/garden
mkdir -p .claude/skills
cp -r /tmp/emil/skills/emil-design-eng /tmp/emil/skills/review-animations \
      /tmp/emil/skills/improve-animations /tmp/emil/skills/find-animation-opportunities \
      /tmp/emil/skills/prototype /tmp/emil/skills/animation-vocabulary .claude/skills/
cp -r /tmp/garden/skills/web-design-engineer .claude/skills/
```

### Check it worked

Restart Claude Code in the repo, then ask: **"Which skills do you have available?"**
`emil-design-eng` and `web-design-engineer` should be listed. You can also call one directly:
`/emil-design-eng` or `/web-design-engineer`.

---

## 4. Ground rules for this codebase

Paste this block at the start of any design session (or add it to `CLAUDE.md`) so the skills'
advice lands correctly in EduTracker:

```
Project constraints for design work:
- Frontend: frontend/edu-tracker (React 19 + Vite, plain CSS, no Tailwind).
- Dark theme only. Use the tokens on `:root .dz-scope` in src/layouts/Dashboard.css
  (--bg-primary, --bg-card, --border, --text-primary/secondary/muted, --accent #8b5cf6,
  cyan #22d3ee = data/signal only, violet = interactive only).
- Specificity trap: src/app-theme.css loads AFTER Dashboard.css and styles `.dz-scope .dz-*`
  (0,2,0). New rules must be prefixed `.dz-scope` or they silently lose.
- Page chrome is fixed: OrganizationLayout (sidebar) + DashboardLayout (top bar). Redesign the
  page content, not the shell, unless asked.
- Behaviour and API calls stay the same. Academic Structure uses src/features/academics/*
  (shared UI in ui.tsx, helpers in helpers.ts). Overview uses src/pages/organization/overview/*.
- Respect prefers-reduced-motion. No new dependencies without asking.
- Run the app with: set NODE_ENV=development && npm run dev  (VITE_USE_MOCKS=true in .env.local).
  NODE_ENV=production in the shell silently disables the mock backend.
- Verify with: npx tsc -b, npx vitest run, npx eslint <changed files>, npm run build.
```

---

## 5. The workflow (per page)

Do **one page at a time**, in this order: Academic Structure → Overview → Staff & Teachers →
School Settings. Structure first, because it has the most screens and sets the visual language
the others reuse.

### Step 1 — Design read and direction (Garden `web-design-engineer`)

> "/web-design-engineer Do a design read of the **Academic Structure** pages
> (src/features/academics, src/pages/organization/AcademicStructurePage.tsx). Set the five dials
> (variance, motion, density, asset dependence, brand fidelity) for an admin tool used daily by
> school registrars. Pick ONE style recipe that fits a dense, data-heavy dark admin app — propose
> 2 candidates (e.g. Linear, Bloomberg) and recommend one. Then write the design-system
> declaration: type scale, spacing scale, radius, border and elevation rules, colour roles mapped
> to our existing tokens. Don't write code yet."

**Recommended dial settings for these pages:** variance *low*, motion *low–medium*, density
*high*, asset dependence *none*, brand fidelity *high* (keep our violet/cyan roles).
**Recommended recipe:** Linear-style — quiet chrome, strong alignment, one accent, dense lists.
Linear's own redesign is the reference: fewer colours, tighter alignment of icons/labels, higher
navigation density, Inter Display for headings, Inter for body.

Save the declaration it produces to `docs/design-system.md` — every later page reuses it.

### Step 2 — Explore versions (Emil `prototype`)

> "/prototype Build 3 versions of the Academic Structure **faculties screen** using the design
> system in docs/design-system.md: (A) dense list, (B) card grid, (C) split view — list on the
> left, faculty detail on the right. Same data and API. Let me compare them live."

Pick one; delete the others.

### Step 3 — Build (Garden `web-design-engineer`)

> "/web-design-engineer Implement version B across all Academic Structure screens (faculties,
> faculty, department, department form, sessions, curriculum). Follow the design-system
> declaration and the constraints in DESIGN-SKILLS.md §4. Early version first, then full build,
> then verification."

### Step 4 — Motion (Emil `find-animation-opportunities`, then `emil-design-eng`)

> "/find-animation-opportunities Go through src/features/academics. List where motion helps
> orientation, feedback or continuity — and where it must NOT be added (things done many times a
> day, keyboard actions)."

Then apply the ones you agree with:

> "/emil-design-eng Implement the approved motion list."

### Step 5 — Review (Emil `review-animations` + `improve-animations`)

> "/review-animations Review all transitions and animations in src/features/academics and
> src/pages/organization. Be strict."

> "/improve-animations Produce a prioritised fix plan for everything the review flagged, then
> apply the top priority items."

### Step 6 — Verify

Run the checks in §4, open the page at 1440px, 1024px and 375px, and toggle
`prefers-reduced-motion` in DevTools (Rendering tab).

Then repeat Steps 1–6 for the next page, **reusing `docs/design-system.md`** so the four pages look
like one product.

---

## 6. What to ask for, page by page

### Overview (`src/pages/organization/overview/*`)

The school's front door. It should answer "what needs my attention?" in five seconds.

- Header with school identity, current session and one primary action.
- A single stat strip (not five cards), each stat clickable.
- The setup checklist as the hero for new schools; it disappears once complete.
- Current session with term progress ("Week 6 of 18").
- **Ask Garden for:** a "Bloomberg-lite" or Linear treatment — dense, aligned, numbers in tabular
  figures. **Ask Emil for:** a single 30–80 ms stagger on first load only; nothing on revisits.

> "/web-design-engineer Redesign the Overview so the most urgent item (unassigned courses,
> pending invites, incomplete setup) is the first thing on the page. Same data."

### Academic Structure (`src/features/academics/*`)

Already rebuilt functionally; this pass is visual polish.

- Faculty → department drill-down with breadcrumbs, one level per screen.
- Department page: level rail + semester columns, side drawer for editing.
- Curriculum grid: sticky level column, quiet offering chips, amber only for "unassigned".
- **Ask Emil for:** drawer enter with the iOS curve `cubic-bezier(0.32, 0.72, 0, 1)` at ~300 ms,
  exit faster; card press `scale(0.97)`; no animation on level-tab switching (done constantly).

### Staff & Teachers (`src/pages/organization/StaffPage.tsx`)

Currently a plain table plus forms. Target: a people directory.

- Toolbar: search, filters (faculty, department, role, status) as chips, count, "Invite staff".
- Rows with avatar, name, staff number, department, role badge, current teaching load.
- Click a row → right drawer with the profile, appointments and assigned courses (not a new page).
- Bulk actions appear only when rows are selected.
- **Ask Garden for:** Linear-style list density (36–44 px rows), sticky header.
- **Ask Emil for:** drawer motion shared with Academic Structure; checkbox/selection feedback
  ≤160 ms; no hover animations on rows.

> "/web-design-engineer Turn StaffPage into a people directory with a detail drawer. Reuse
> Drawer, Badge and EmptyState from src/features/academics/ui.tsx."

### School Settings (`src/pages/organization/SchoolSettingsPage.tsx`)

Target: the Vercel/Geist settings pattern.

- Left sub-nav (Profile · Academic · Portal & invites · Danger zone), content on the right.
- Each setting is a **section card**: title, one-line description, the control, and a footer with
  helper text on the left and a **Save** button on the right that only enables when changed.
- Danger zone at the bottom in a red-bordered card; destructive actions need typed confirmation.
- **Ask Emil for:** a toast on save (Sonner-style), not a page-level alert.

> "/web-design-engineer Rebuild School Settings using the Vercel settings pattern: section cards
> with their own Save, a left sub-nav, and a danger zone that requires typing the school name."

---

## 7. Emil's rules to hold every page to

These come from `emil-design-eng`. Use them as the acceptance checklist in reviews.

| Rule | Value |
|---|---|
| Never `ease-in` on UI | Use ease-out: `cubic-bezier(0.23, 1, 0.32, 1)` |
| Moving on screen | ease-in-out: `cubic-bezier(0.77, 0, 0.175, 1)` |
| Drawers | `cubic-bezier(0.32, 0.72, 0, 1)` |
| Button press | `scale(0.97)`, 100–160 ms |
| Tooltips / small popovers | 125–200 ms |
| Dropdowns / selects | 150–250 ms |
| Modals / drawers | 200–500 ms; exit faster than enter |
| Most UI animations | under 300 ms |
| Entering elements | from `scale(0.95)` + `opacity: 0`, never `scale(0)` |
| Popovers | scale from the trigger (`transform-origin`); modals from centre |
| Stagger | 30–80 ms between items, never blocking input |
| Don't animate | keyboard-triggered actions; anything done 100+ times a day |
| `transition: all` | never — name the properties |
| Only animate | `transform` and `opacity` (they skip layout and paint) |
| Hover effects | behind `@media (hover: hover) and (pointer: fine)` |
| Reduced motion | remove movement, keep opacity/colour changes |

**Already violating these today** (good first `/review-animations` targets):
- `academics.css` card hover lifts with `transform .15s ease` — fine for cards, but not gated
  behind `(hover: hover)`.
- The Drawer slides in with `ease` at 200 ms — switch to the drawer curve.
- Level tabs and the curriculum filters shouldn't animate at all (used constantly).

---

## 8. Definition of done (per page)

- [ ] Uses `docs/design-system.md`; looks like the other redesigned pages.
- [ ] Emil review passes with no high-priority items left.
- [ ] Works at 1440 / 1024 / 375 px with no horizontal page scroll.
- [ ] `prefers-reduced-motion` removes movement.
- [ ] Keyboard: everything reachable, focus visible, drawers trap and return focus.
- [ ] `npx tsc -b`, `npx vitest run`, `npx eslint`, `npm run build` all pass.
- [ ] Before/after screenshots in the PR.

---

## Sources

- Emil Kowalski — skill: https://emilkowal.ski/skill · repo: https://github.com/emilkowalski/skills ·
  rules: https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md
- Garden Skills — https://github.com/ConardLi/garden-skills (README install options)
- Linear redesign — https://linear.app/now/how-we-redesigned-the-linear-ui
- Vercel Geist — https://vercel.com/geist/introduction · empty states: https://vercel.com/geist/empty-state
