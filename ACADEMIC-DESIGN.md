# Academic Structure — Design Pass

> Build instructions only. Nothing here is implemented yet.
> Redesigns the screens that already work (see `ACADEMIC-STRUCTURE.md` for behaviour
> and the backend work that is still open). Behaviour and API calls stay the same;
> this is layout, hierarchy, components and a handful of bugs.
>
> Files: `frontend/edu-tracker/src/features/academics/*` and
> `src/pages/organization/AcademicStructurePage.tsx`.

---

## 1. What's wrong today

### Bugs (fix first, they are wrong regardless of design)

| # | Bug | Where |
|---|---|---|
| B1 | **Status badges use light-theme colours** (`#ecefed`, `#eef1ff`) — pale blocks on the dark UI | `academics.css` `.ac-status-closed`, `.ac-status-upcoming` |
| B2 | **Warning text is `#a45614`** — dark orange, barely readable on dark background | `.ac-warn`, `.ac-unassigned` |
| B3 | **Intake capacity compares _all_ students to the per-session maximum** (e.g. 310 / 120) | `DepartmentScreen.tsx`, `Intake capacity` metric |
| B4 | **Changing programme length wipes custom level names** (renamed `Part 1…` reverts to `100L…`) | `DepartmentForm.tsx` `changeLength` |
| B5 | "0 offerings have no lecturer" shows even when everything is assigned | `CurriculumView.tsx` `.ac-unassigned` |
| B6 | **"Edit department" only edits intake and O'Level** — name, code, HOD, length, UTME can't be changed | `DepartmentScreen.tsx` edit modal |
| B7 | Student counts show **"0 students"** before student records exist; should be `—` | faculty and department cards |
| B8 | Session dates render raw (`2026-09-01`) | `SessionsView.tsx` |

### Design problems

1. **Too many header layers.** On a department page the user sees, top to bottom: page
   title → page subtitle → session picker → 3 tabs → breadcrumb → department title →
   4 metrics → level buttons → 5 sub-tabs → content. Nine layers before a single course.
2. **Level buttons sit above the sub-tabs** but only affect the Overview sub-tab. On
   Lecturers or Admission they do nothing, which feels broken.
3. **The session picker shows on the Structure tab**, which is session-independent.
4. **Cards are plain text stacks.** Faculty and department cards have no visual anchor,
   no hierarchy between name and stats, and nothing that flags a missing Dean/HOD.
5. **The New department form is one long page of four cards**; step 4 just repeats the
   preview. There is no sense of progress and no visual of what the levels look like.
6. **Lists are bare** (`<ul>` of names, `<p>` per admission rule). They read like debug output.
7. **The curriculum grid is heavy**: every offering is a bright purple block, and editing
   happens in a centred modal that hides the grid you are editing.
8. **The Prepare-session wizard renders inline under the session list**, pushing it down,
   instead of being a focused dialog.

---

## 2. Layout system (applies to every screen)

### One header, not three

Replace the page head + tabs + breadcrumb + screen head with **one `AcHeader`
component** used on every screen:

```
Academic Structure / Engineering                       ← breadcrumb (small, muted)
[EN] Engineering                    [ Edit ] [ + New department ]   ← title row
Dean Prof. A. Bello · 4 departments · 38 lecturers     ← meta line
```

- **Landing screens** (Faculties, Sessions, Curriculum) show the three top tabs
  **under** the header. **Drill-down screens** (a faculty, a department, the form)
  do **not** show the top tabs — the breadcrumb is the way back. This removes two layers.
- The breadcrumb's first item is always `Academic Structure` and returns to the tab you
  came from.
- **Session picker** appears only where content depends on a session: the Curriculum tab
  and the department page. It sits at the right of the title row, styled as a compact
  pill: `2026/2027 · Current ▾`.

Props:
```ts
type AcHeaderProps = {
  crumbs?: { label: string; to?: string }[];
  title: string;
  badge?: ReactNode;          // code chip / monogram
  meta?: ReactNode[];         // joined with " · "
  actions?: ReactNode;
  sessionPicker?: boolean;
};
```

### Shared components

Create `src/features/academics/ui/` and build these once:

| Component | Use |
|---|---|
| `AcHeader` | above |
| `Monogram` | 40px rounded square with the unit code; colour from a hash of the code (6-colour palette below) |
| `Badge` | `code` (mono, violet), `status` (Current/Upcoming/Closed), `warn` ("No HOD"), `neutral` (award) |
| `StatStrip` | reuse `pages/organization/overview/StatStrip.tsx` — one card, divided cells |
| `EmptyState` | icon, title, one line, one primary button |
| `Drawer` | right-side panel, 420px, for editing without hiding the page |
| `Stepper` | numbered steps with done/current/todo states |
| `DataTable` | header row, zebra-free rows with 1px dividers, sticky header, empty row |
| `TagInput` | chips + text input, Enter/comma adds, Backspace removes |
| `LevelTimeline` | horizontal 100L → 500L track with markers (SIWES, Direct Entry, internship) |

### Tokens

Use existing tokens only. Add these to `academics.css` (scoped under `.dz-scope`
so `app-theme.css` can't override them):

```css
.dz-scope {
  --ac-current-bg: rgba(74, 222, 128, 0.12);  --ac-current-fg: #4ade80;
  --ac-upcoming-bg: rgba(96, 165, 250, 0.12); --ac-upcoming-fg: #93c5fd;
  --ac-closed-bg: rgba(148, 163, 184, 0.10);  --ac-closed-fg: #94a3b8;
  --ac-warn-bg: rgba(251, 191, 36, 0.12);     /* fg: var(--warn) */
}
```

Monogram palette (background at 18% alpha, text full): violet `#8b5cf6`, cyan `#22d3ee`,
amber `#fbbf24`, emerald `#34d399`, rose `#fb7185`, sky `#60a5fa`.
`hash(code) % 6` picks one, so a faculty keeps its colour everywhere.

Remove every hard-coded light hex from `academics.css` (fixes B1, B2).

---

## 3. Screen A — Faculties (Structure tab landing)

```
Academic Structure
The permanent map of your school. Set it up once; each session builds on it.
[ Structure ]  [ Sessions ]  [ Curriculum ]
─────────────────────────────────────────────────────────────────────────────
[🔍 Search faculties, departments, courses…   ]   19 faculties   [▦][☰]  [ + New faculty ]

┌─────────────────────────────┐ ┌─────────────────────────────┐ ┌──────────────…
│ [EN]                      → │ │ [SC]                      → │ │ [MD]
│ Engineering                 │ │ Sciences                    │ │ Clinical Sciences
│ ENG                         │ │ SCI                         │ │ MED
│ ───────────────────────     │ │ ───────────────────────     │ │
│  4 depts   38 lect.  1,240  │ │  6 depts   51 lect.  2,030  │ │  2 depts  …
│ Dean Prof. A. Bello         │ │ [No Dean yet]               │ │
└─────────────────────────────┘ └─────────────────────────────┘ └──────────────…
```

- **Faculty card**: `Monogram` + arrow (appears on hover) · name (1.05rem, 700) · code
  (`Badge code`) · divider · three mini stats (value bold, label muted, `—` when unknown) ·
  footer: Dean name, or `Badge warn "No Dean yet"`.
- Card hover: border `var(--border-hover)`, lift 2px. Whole card is the link.
- **Grid/list toggle** (`▦ ☰`, remembered in `localStorage`, try/catch). List view is a
  `DataTable`: Code · Faculty · Departments · Lecturers · Students · Dean. Default to list
  automatically above 12 faculties.
- **Search** is a combobox, not a page swap: results drop down under the input,
  grouped `Departments` / `Courses`, each row with its code badge and parent
  (`CPE · Computer Engineering — Engineering`). Arrow keys + Enter navigate. Esc closes.
- **Empty state (no model yet)**: three large choice cards side by side —
  *University* (Faculties → Departments → Levels), *Secondary* (Sections → Classes → Arms),
  *Primary* (Classes → Arms) — each with a one-line example. Replaces the three plain buttons.
- **Empty state (model, no faculties)**: `EmptyState` "Create your first faculty".
- **New faculty**: keep the modal (it is short), but lay it out as: Name (full width),
  Code (narrow, auto-suggested from the name's initials, editable), Dean (select with
  "Set later"), Description (optional, collapsed behind "Add description").

## 4. Screen B — A faculty

```
Academic Structure / Engineering
[EN] Engineering  ENG                               [ Edit ]  [ + New department ]
Dean Prof. A. Bello · Faculty workspace →

┌ Departments ┬ Lecturers ┬ Students ┬ Courses ┐        ← StatStrip
│      4      │    38     │  1,240   │   124   │
└─────────────┴───────────┴──────────┴─────────┘

Departments                                                    Sort: Name ▾
┌──────────────────────────────────┐ ┌──────────────────────────────────┐
│ CPE                  [B.Eng]   → │ │ CVE                  [B.Eng]   → │
│ Computer Engineering             │ │ Civil Engineering                │
│ 5 years  ● ● ● ● ●  100L – 500L  │ │ 5 years  ● ● ● ● ●  100L – 500L  │
│ 310 students · 9 lecturers       │ │ 280 students · 8 lecturers       │
│ 100L intake  ▓▓▓▓▓▓▓▓░  112/120  │ │ 100L intake  ▓▓▓▓▓░░░░   74/120  │
│ HOD Dr. K. Eze                   │ │ [No HOD yet]                     │
└──────────────────────────────────┘ └──────────────────────────────────┘
```

- **Department card**: code badge + award badge + arrow · name · duration with **level
  pips** (one dot per level; the SIWES level's dot is hollow) and range · students /
  lecturers · **100L intake bar** (fills violet; amber above 90%; red when over) · HOD or
  `No HOD yet` warn badge.
- **"Faculty workspace →"** link in the meta line opens `faculties/:facultyId` (staff,
  appointments). See §10 — this is how the two faculty areas connect.
- Sort: Name, Students, Code.
- `Edit` opens the faculty modal pre-filled; archive moves into that modal's footer as a
  secondary danger link ("Archive faculty"), with a confirm.

## 5. New / Edit department — a stepper

One component, `DepartmentForm`, in two modes: `create` and `edit` (fixes B6 — the page
header's **Edit** opens this in edit mode, pre-filled, at step 1).

```
Academic Structure / Engineering / New department

┌ Steps ──────────┐ ┌ Step 2 of 4 · Duration and levels ─────────┐ ┌ Summary ───────────────┐
│ ✓ 1 Basics      │ │ Programme length   [ − ] 5 years [ + ]      │ │ B.Eng                  │
│ ● 2 Duration    │ │ Semesters per level [ 2 ▾ ]                 │ │ Computer Engineering   │
│ ○ 3 Admission   │ │                                             │ │ CPE · Engineering      │
│ ○ 4 Review      │ │ Levels  [100L][200L][300L][400L][500L]  ✎   │ │                        │
│                 │ │                                             │ │ 100L ─ 200L ─ 300L ─   │
│                 │ │ ☐ Industrial training  in [300L▾] sem [2▾]  │ │   400L ─ 500L          │
│                 │ │ ☐ Direct Entry         into [200L▾]         │ │   ↑DE      ◇SIWES      │
│                 │ │ ☐ Internship after graduation  [1] year     │ │ + 1 yr internship      │
│                 │ │                                             │ │ Max intake 120         │
│                 │ │                     [ Back ]  [ Continue ]  │ │                        │
└─────────────────┘ └─────────────────────────────────────────────┘ └────────────────────────┘
```

- **Three columns on desktop**: step rail (200px) · step content (flex) · sticky
  **Summary** (300px) that updates live and includes the `LevelTimeline`. Below 1100px the
  summary moves under the content; below 720px the rail becomes a top progress bar
  `Step 2 of 4 ▓▓▓▓░░░░`.
- **One step visible at a time.** `Continue` validates the step and is disabled until
  required fields are valid; errors appear under the field, not at the bottom.
- **Step 1 Basics**: Faculty (read-only chip) · Name · Code (auto-suggested from name,
  uppercase, 6 max, live "already used" check) · Award (select + Other) · HOD · Description.
- **Step 2 Duration**: length as a − / + stepper (1–7). **Keep custom level names when
  the length changes** — only add or remove at the end (fixes B4). Level chips are
  read-only until the ✎ button switches them to inputs. Optional extras are checkboxes
  that reveal their inputs, so the step stays short when unused.
- **Step 3 Admission**: Max intake · Min UTME · **UTME subjects as `TagInput`** with
  suggestions (English, Mathematics, Physics, Chemistry, Biology, Economics, Government,
  Literature in English…) · O'Level: "Credits required [5]" + `TagInput` of subjects,
  instead of free text · Other requirements.
- **Step 4 Review**: the summary as a proper definition list in sections, each with an
  `Edit` link that jumps back to that step. Primary button: `Create department`.
- **Draft safety**: keep the form state in `sessionStorage` (try/catch) keyed by org +
  faculty; clear on create. Leaving with unsaved changes asks for confirmation.
- Secondary/primary models use the same stepper with fewer fields (name, code, arms,
  terms, capacity), per the wording table in `ACADEMIC-STRUCTURE.md`.

## 6. Screen C — A department

```
Academic Structure / Engineering / Computer Engineering
Computer Engineering  CPE  [B.Eng]              2026/2027 · Current ▾   [ Edit ] [⋯]
HOD Dr. K. Eze · 5 years · 100L – 500L

┌ Students ┬ Lecturers ┬ Courses ┬ 100L intake ─────────┐
│   310    │     9     │   46    │ 112 / 120 ▓▓▓▓▓▓▓▓░  │
└──────────┴───────────┴─────────┴──────────────────────┘

[ Levels ]  [ Catalogue ]  [ Lecturers ]  [ Students ]  [ Admission ]
──────────────────────────────────────────────────────────────────────
┌ Levels ──────┐  100 Level · 64 students                    [ + Add course ]
│ ● 100L   64  │  ┌ First semester · 16 units ───┐ ┌ Second semester · 18 units ──┐
│   200L   71  │  │ CPE 101 Intro to Computing   │ │ CPE 102 Programming I        │
│ ◇ 300L   58  │  │         3u  [C]  (DA) Ade    │ │         3u  [C]  (DA) Ade    │
│   400L   60  │  │ MTH 101 Calculus I           │ │ PHY 102 Physics II           │
│   500L   57  │  │         3u  [C]  [Unassigned]│ │         3u  [E]  (MO) Obi    │
└──────────────┘  └──────────────────────────────┘ └──────────────────────────────┘
```

- **Header**: title, code badge, award badge; meta: HOD · length · range; right: session
  picker, `Edit` (opens the stepper in edit mode), `⋯` menu (Archive department).
- **StatStrip**: Students (this session), Lecturers, Courses, **100L intake = 100L
  students ÷ max intake** (fixes B3), with the bar.
- **Five tabs, one row**: `Levels` (default) · `Catalogue` · `Lecturers` · `Students` ·
  `Admission`. The level selector lives **inside** the Levels tab (fixes design problem 2).
- **Levels tab**:
  - Left **level rail** (vertical list, 160px): level name, student count, ◇ marker on the
    SIWES level, ↑ marker on the Direct Entry level. Below 720px it becomes a horizontal
    scrollable chip row.
  - Right: one column per semester. Column header shows name and **unit total**; the total
    turns `var(--warn)` outside the school's load range (default 15–24, per-school later).
  - **Course row**: code (mono, bold) · title · units · C/E badge · lecturer avatar +
    surname, or `Unassigned` warn badge. Clicking a row opens the **offering Drawer**
    (same as Curriculum, §8). Closed sessions: rows aren't clickable; a slim read-only
    banner shows under the header.
  - SIWES semester renders a single tinted card "Industrial training (SIWES)" instead of rows.
  - `+ Add course` opens a Drawer (not a modal) pre-filled with this level and the code
    prefix.
- **Catalogue tab**: `DataTable` — Code · Title · Units · Level · Semester · Type · Status,
  with search and level filter; 50 per page with "1–50 of 124" and Prev/Next.
- **Lecturers tab**: `DataTable` — avatar + name · courses this session · total units ·
  a bar showing load vs the department median. Empty: "No lecturers attached — add staff
  from Staff & Teachers" with a link.
- **Students tab**: until records exist, `EmptyState`. When they exist: a compact bar per
  level (count) above a searchable table.
- **Admission tab**: two-column definition list — Max intake · Min UTME · UTME subjects
  (chips) · O'Level (credits + chips) · Direct Entry · Other. `Edit` opens the stepper at
  step 3.

## 7. Sessions tab

```
Sessions                                                    [ Prepare next session ]

● 2026/2027  [Current]                                 1 Sep 2026 – 31 Jul 2027
  ┌────────── First semester ──────────┬────────── Second semester ──────────┐
  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ Closed ▓▓▓▓▓▓▓▓│▓▓▓▓▓▓▓▓░░░░░░░ Week 6 of 18 ░░░░░░░│
  └────────────────────────────────────┴─────────────────────────────────────┘
  212 offerings · 6 unassigned                        [ Close semester ]  [ Open → ]

○ 2027/2028  [Upcoming]   1 Sep 2027 – 31 Jul 2028   212 offerings   [ Start session ]
○ 2025/2026  [Closed]     198 offerings                                   [ View → ]
○ 2024/2025  [Closed]     190 offerings                                   [ View → ]
```

- **Current session is expanded**: a segmented progress bar, one segment per term, sized by
  its dates. Closed segments are filled, the current one shows "Week N of M" computed from
  `startsOn`/`endsOn`, upcoming ones are empty. Below: offering and unassigned counts
  (unassigned links to Curriculum filtered to unassigned).
- **Upcoming and closed sessions are single compact rows.** Newest first, with the upcoming
  one pinned right under current.
- Dates formatted `1 Sep 2026` (fixes B8) via one `formatDate` helper (reuse the overview's).
- **Prepare next session** opens a **modal stepper** (3 steps: Dates · What to copy ·
  Review), not an inline card. Step 2 shows each copy option as a row with its count
  ("Course offerings — 212", "Lecturer assignments — 180 of 212"). The disabled
  "Promote students" row stays, with a lock icon and "Available once student records exist".
- Confirm dialogs for Start session / Close term keep their current copy.

## 8. Curriculum tab

```
Curriculum · 2026/2027                                   2026/2027 · Current ▾
[ Offerings | Catalogue ]   Department [ Computer Engineering ▾ ]  Level [ All ▾ ]
                            ☐ Only unassigned                     [ + Add offering ]

⚠ 6 offerings have no lecturer.  Show them →          ← only when > 0 (fixes B5)

          │ First semester                    │ Second semester
──────────┼───────────────────────────────────┼──────────────────────────────────
100L      │ CPE 101 · 3u · C       (DA)       │ CPE 102 · 3u · C       (DA)
          │ MTH 101 · 3u · C       ⚠          │ PHY 102 · 3u · E       (MO)
200L      │ …                                 │ …
```

- **Segmented control** `Offerings | Catalogue` replaces the toggle button.
- **Department picker is a searchable combobox grouped by faculty** (with 100+
  departments a plain `<select>` is unusable).
- **Filters**: Level (All / one level) and "Only unassigned".
- **Grid**: sticky first column (levels) and sticky header row. Offering chips are
  **quiet** — `var(--bg-card)` with a 1px border; unassigned chips get an amber left border
  and ⚠ instead of the lecturer's initials. Hover lifts the chip. No bright purple fill.
- **Editing uses the Drawer** on the right, so the grid stays visible. Drawer fields:
  Course (read-only when editing), Level, Semester, Lecturer (searchable, shows each
  lecturer's current unit load next to their name), Units, Compulsory toggle. Footer:
  Save · Remove offering.
- Closed session: read-only banner, chips not clickable, no Add button.
- Mobile (< 720px): the grid becomes one card per level with its semesters stacked.

## 9. States, motion, accessibility

- **Loading**: skeletons shaped like the real screen (card grid, StatStrip, rail + columns),
  never "Loading academic structure…" text.
- **Errors**: inline `role="alert"` under the field or at the top of the Drawer/modal, with
  the action to retry. Never only a console log.
- **Motion**: 150ms ease on hover/lift; Drawer slides in 200ms; respect
  `prefers-reduced-motion` (no lift, no slide).
- **Keyboard**: tabs use arrow keys (`role="tablist"` already exists — add key handling);
  Drawer and modals trap focus and return it on close; combobox is fully keyboard-driven.
- **Touch targets** ≥ 40px. No horizontal page scroll at 375px except inside the grid's own
  scroll container.

## 10. Decision: one place for faculties

The sidebar **Faculties** item (`/faculties`, the faculty workspace: staff, appointments)
and Structure's faculty screen now show the same faculties in two places. Recommended:

- **Remove "Faculties" from the org sidebar.** Structure → faculty screen becomes the
  single entry point, with the **"Faculty workspace →"** link (§4) for staff matters.
- Keep the `faculties/:facultyId/*` routes working for bookmarks; point
  `FacultiesListPage` at `/structure` with a redirect.
- Sidebar then reads: Overview · Academic Structure · Staff & Teachers · School Settings.

Confirm with Benedict before doing this step.

---

## Build order

1. **Bugs B1–B8** (small, independent, shippable on their own).
2. **Tokens + `ui/` components** (`AcHeader`, `Badge`, `Monogram`, `EmptyState`, `Drawer`,
   `Stepper`, `DataTable`, `TagInput`, `LevelTimeline`). Reuse overview `StatStrip`.
3. **Header consolidation** on all screens; hide top tabs on drill-down screens; session
   picker only where it applies.
4. **Screen A** cards, grid/list, search combobox, model-choice empty state.
5. **Screen B** cards with pips and intake bar, StatStrip, workspace link.
6. **Department stepper** (create + edit modes, summary, timeline, draft safety).
7. **Screen C** tabs, level rail, semester columns, Drawer, tables.
8. **Sessions** timeline + modal wizard.
9. **Curriculum** controls, quiet grid, Drawer, mobile cards.
10. **Skeletons, keyboard, reduced motion** pass.
11. **§10** only after sign-off.

## Verification

Run `npm run dev` with `VITE_USE_MOCKS=true` and walk through each screen at 1440px,
1024px and 375px.

- [ ] No light-coloured badges or dark-orange text anywhere on these screens.
- [ ] Department page shows at most: breadcrumb, title row, meta, StatStrip, tabs — then content.
- [ ] Top tabs visible on Structure/Sessions/Curriculum landings only; hidden when drilled in.
- [ ] Session picker absent on Screens A and B.
- [ ] Faculty/department cards show `—` for unknown counts and a warn badge when Dean/HOD is missing.
- [ ] 13+ faculties default to list view; toggle persists across reloads.
- [ ] Search dropdown works with keyboard only.
- [ ] Stepper: renamed levels survive changing length 5 → 6 → 5.
- [ ] Edit department opens the stepper pre-filled and saves every field.
- [ ] 100L intake = 100L students ÷ max intake.
- [ ] Unit totals turn amber outside 15–24.
- [ ] Unassigned banner hidden at 0; "Only unassigned" filter works.
- [ ] Editing an offering keeps the grid visible (Drawer), focus returns to the chip on close.
- [ ] Session dates show as `1 Sep 2026`; current session shows "Week N of M".
- [ ] Prepare-session opens as a modal stepper with counts on step 2.
- [ ] Reduced motion: no lift/slide.
- [ ] `npm run build` and `npx vitest run src/features/academics` pass.

Delete this file once the checklist passes.
