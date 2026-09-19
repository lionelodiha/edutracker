# Rollback — return to the previous release in one action

Stage 05 rule: **rollback is a schema question, not a deploy question.**
Rolling the application back is easy (previous image tag, redeploy).
Rolling back a migration is what destroys data. So:

1. **Migrations only ever go forward.** Every migration merged to `main`
   must be backwards compatible with the previous release
   (expand-and-contract: add nullable, backfill, switch reads, then drop).
   If it is not, "roll back the app" is not a complete answer — do not
   deploy it until it is.
2. **The emergency action is the simple one.** Because of (1), rolling back
   means redeploying the previous app images and nothing else. Never run a
   down-migration against staging or production.

## Roll back staging or production

Actions > deploy > Run workflow, and enter the previous release's tags:

- `api_image`: `ghcr.io/<owner>/edutracker/api:<previous-sha>`
- `web_image`: `ghcr.io/<owner>/edutracker/web:<previous-sha>`

Leave both empty to deploy the selected ref normally.

Find the previous sha from the deploy run history (the `build` job outputs
both tags on every run), or from the GHCR package page. The smoke jobs run
against the rolled-back release exactly like a forward deploy.

## After the rollback

- Confirm staging/production smoke jobs are green on the rollback run.
- Open a forward-fix PR; do not re-deploy the broken sha.
- If the incident meets the severity bar, write the postmortem (Stage 08):
  ask why the system allowed it — e.g. "a non-backwards-compatible
  migration reached production because nothing surfaced the generated SQL
  in review" — not who typed it.
