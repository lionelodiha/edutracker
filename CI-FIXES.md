# CI Failures — What Broke and How to Fix It

Run: `ci-cd` branch, PR into `main`
Result: `backend` ✗ · `frontend` ✗ · `image` skipped · `security` ✓

---

## Read this first: nothing is actually broken

Your app works. The pipeline is doing its job — it is refusing to let through
things that were always there but nobody was checking.

Two jobs failed, and both failed on a **rule we introduced**, not on a bug.

| Job | Failed at | Why |
| --- | --- | --- |
| `backend` | `dotnet build -warnaserror` | Compiler warnings that were always present. CI now treats them as errors. |
| `frontend` | `npm run lint` | ESLint problems that were always present. Nobody ran lint before. |
| `image` | — | **Skipped, correctly.** See below. |
| `security` | — | **Passed.** No dependency at CVSS 7 or above. |

### Why `image` says "skipped", not "failed"

```yaml
image:
  needs: [backend, frontend]
```

`needs` means "do not start until these succeed". They did not succeed, so
GitHub skipped it rather than wasting a machine building an image from code
that does not compile.

That is the dependency graph working. Leave it alone.

---

# Failure 1 · backend — warnings treated as errors

## What `-warnaserror` does

```yaml
- run: dotnet build edutracker.slnx --no-restore -c Release -warnaserror
```

Locally, `dotnet build` prints warnings and carries on. `-warnaserror` turns
every warning into a build failure.

This is deliberate. On your laptop a warning is a useful hint. On `main` an
ignored warning is a decision nobody made — and warnings accumulate until
everybody scrolls past all of them, including the one that mattered.

## The warning we know about

```
backend/EduTracker.Application/Features/Classes/CreateClass/CreateClassCommandHandler.cs(15,19)
warning CS9113: Parameter 'cacheService' is unread.
```

**What it means:** the handler takes `cacheService` as a primary constructor
parameter and never uses it. Either caching was planned and not finished, or
it was left behind after a refactor.

### Fix — pick one

**(a) Remove it** — correct if caching is not used here:

```csharp
// before
internal sealed class CreateClassCommandHandler(
    AppDbContext db,
    ICacheService cacheService          // ← never read
) : IHandler<CreateClassCommand, OperationResult<Guid>>

// after
internal sealed class CreateClassCommandHandler(
    AppDbContext db
) : IHandler<CreateClassCommand, OperationResult<Guid>>
```

Check nothing else in the file uses it first:

```bash
grep -n "cacheService" backend/EduTracker.Application/Features/Classes/CreateClass/CreateClassCommandHandler.cs
```

**(b) Use it** — correct if creating a class should invalidate a cached list:

```csharp
db.Classes.Add(newClass);
await db.SaveChangesAsync(cancellationToken);

// The cached class list for this offering is now stale.
await cacheService.RemoveAsync(CacheKeys.ClassesForOffering(message.CourseOfferingId), cancellationToken);
```

**(c) Suppress it** — only with a comment explaining why, and only if you
genuinely intend to wire it up soon:

```csharp
#pragma warning disable CS9113 // cacheService is wired for the invalidation work in #<issue>
```

> Prefer (a). An unused dependency is a lie about what this class needs, and
> the next person has to read the whole file to discover it does nothing.

## Finding the rest

There was at least one more warning in the last local build. To see them all:

```bash
dotnet build edutracker.slnx -c Release -warnaserror
```

The output lists every one with file and line. Work down the list.

Common ones in this codebase and their fixes:

| Code | Means | Usual fix |
| --- | --- | --- |
| `CS9113` | Primary constructor parameter unread | Remove it |
| `CS8618` | Non-nullable property never assigned | `= null!;` for EF navigations, or make it nullable |
| `CS1998` | `async` method with no `await` | Drop `async`, return `Task.FromResult(...)` |
| `CS0168` / `CS0219` | Variable declared and never used | Delete it |
| `CS8602` | Possible null dereference | Null-check, or `!` if you can prove it is not null |

---

# Failure 2 · frontend — ESLint

## What happened

```yaml
- run: npm run lint      # → eslint .
```

ESLint reads your React and TypeScript and reports problems. It has almost
certainly never been run on this codebase, so it found the backlog all at once.

## Step 1 — see the list

```bash
cd frontend/edu-tracker
npm run lint
```

Each line reads:

```
src/pages/dashboard/OrganizationDetailsPage.tsx
  42:8  error  'API_BASE' is assigned a value but never used  @typescript-eslint/no-unused-vars
  ^^ ^                                    ^                    ^
  line/col                             the problem            the rule
```

## Step 2 — let it fix what it can

```bash
npx eslint . --fix
```

This safely repairs formatting-type issues — import order, quotes, semicolons,
spacing. It will not touch anything that needs a judgement call.

Re-run `npm run lint` and see what is left.

## Step 3 — the ones you fix by hand

| Rule | Means | Fix |
| --- | --- | --- |
| `no-unused-vars` | Declared, never used | Delete it. If it is a destructured value you must skip, name it `_x`. |
| `@typescript-eslint/no-explicit-any` | `any` disables type checking | Give it a real type, or `unknown` plus a narrowing check |
| `react-hooks/exhaustive-deps` | `useEffect` uses something not in its dependency array | Add it. If adding it causes a loop, the effect needs restructuring — do not silence it. |
| `react-refresh/only-export-components` | A file exports both a component and something else | Move the non-component export to its own file |
| `no-empty` | Empty `catch {}` | Handle it, or log it, or comment why it is safe to swallow |

> **Do not reach for `// eslint-disable-next-line` as a first move.** Each one
> is a small IOU. A few with reasons are fine; a file full of them means the
> rule is wrong for your project, and the honest fix is to turn that rule off
> in `eslint.config.js` and say why.

---

# If the list is too long to fix today

You have a choice, and both answers are legitimate. Be deliberate about it.

## Option A — fix everything now (recommended)

Probably an hour or two. You end with a genuinely clean codebase and a
pipeline that means what it says.

## Option B — stop the bleeding, fix the backlog later

Make the new rules non-blocking, so they report without failing, and fix them
over time. **Only do this if you actually schedule the cleanup.**

```yaml
# backend job — drop -warnaserror for now
- run: dotnet build edutracker.slnx --no-restore -c Release

# frontend job — report but do not fail
- run: npm run lint
  continue-on-error: true
```

> The risk with Option B is that "later" never arrives, and you end up with a
> green pipeline that is not checking two of the things you added it to check.
> If you take it, write the ticket before you push the change.

## Option C — ratchet (the middle path)

Keep the rules strict, but stop the existing backlog from blocking you:

- Backend: turn `-warnaserror` on per project, starting with `EduTracker.Domain`
  (which is small and clean), and add the others as you clear them.
- Frontend: set `--max-warnings` to today's count in `package.json`, then lower
  the number as you fix things. It can never get worse, and it visibly gets
  better.

```json
"lint": "eslint . --max-warnings 47"
```

---

# After the fixes

```bash
# backend — must be silent
dotnet build edutracker.slnx -c Release -warnaserror

# formatting — the next step that will fail if you skip it
dotnet format edutracker.slnx --verify-no-changes

# frontend
cd frontend/edu-tracker && npm run lint && npm run build
```

When all four are clean locally, push. `backend` and `frontend` go green,
`image` stops being skipped and builds both containers, and you have a full
pipeline.

> **`dotnet format --verify-no-changes` is the next thing that will fail.**
> It has not run yet, because the build failed before reaching it. Run
> `dotnet format edutracker.slnx` once to fix formatting everywhere, and commit
> that on its own — a formatting-only commit keeps the diff readable, which is
> the entire reason the check exists.

---

## The lesson worth keeping

These failures are the pipeline earning its place on day one.

Those warnings and lint errors were in your code before today. Nothing was
checking, so nobody knew. The first run of a real pipeline always finds a
backlog — that is not a sign something went wrong, it is the sign it is
working.

A pipeline that goes green on its very first run is usually one that is not
checking anything.
