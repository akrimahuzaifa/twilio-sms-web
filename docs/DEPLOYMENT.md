# Deployment: production and staging on GitHub Pages

## URLs

| Env | Branch | URL | Functions URL comes from |
| --- | --- | --- | --- |
| Production | `main` | https://akrimahuzaifa.github.io/twilio-sms-web/ | repo variable `PROD_VITE_TWILIO_FUNCTIONS_URL` (unset = MMS off, as today) |
| Staging | `staging` | https://akrimahuzaifa.github.io/twilio-sms-web/staging/ | repo variable `VITE_TWILIO_FUNCTIONS_URL` |
| Local | any | http://localhost:3000/twilio-sms-web | `.env` (see `.env.example`) |

The staging build shows an orange **STAGING** badge in the top-right corner.

## How it works

GitHub Pages hosts one site per repo, and every deploy replaces the whole site. So [.github/workflows/deploy-pages.yml](../.github/workflows/deploy-pages.yml) always builds **both** branches and publishes them together:

1. Check out `main` and build with the normal base `/twilio-sms-web`.
2. Check out `staging` and build with `--base=/twilio-sms-web/staging/`.
3. Copy staging's `dist` into `site/staging/`, upload `site/`, deploy.

It runs on a push to `main` or `staging`, or manually (Actions tab → workflow → Run workflow).

Consequences:

- Pushing to `staging` also rebuilds production from the current `main`. That build is the same code with the same settings, so production doesn't change.
- The `staging` branch must exist, or the workflow fails. A failed run deploys nothing and leaves the current site up.
- Staging and production share the browser origin `akrimahuzaifa.github.io`, which means they share `localStorage`. The unread-tracking key is suffixed `_staging` on staging. Sign-in state is in memory only, so it isn't shared.
- Both environments use the same Twilio account and the same Functions service (`alpha-message-6434`). Messages sent from staging are real SMS/MMS.

## One-time GitHub setup

1. **Allow `staging` to deploy:** repo Settings → Environments → `github-pages` → Deployment branches and tags → Add rule → `staging`. Without this the staging run fails with "Branch staging is not allowed to deploy to github-pages". Production stays untouched.
2. **Variables:** Settings → Secrets and variables → Actions → **Variables**:
   - `VITE_TWILIO_FUNCTIONS_URL` = `https://alpha-message-6434.twil.io` (used by staging)
   - `PROD_VITE_TWILIO_FUNCTIONS_URL`: leave **unset** until MMS is released to production.

## Day-to-day flow

```
feature branch (e.g. mms-setup) ──merge──▶ staging ──test on /staging/──▶ PR to main ──▶ production
```

```bash
git switch staging
git merge --ff-only mms-setup   # or a normal merge / PR into staging
git push origin staging          # deploys prod (unchanged) + staging
```

## Releasing MMS to production

1. Verify send and receive MMS on the staging URL (checklist in HANDOFF.md).
2. Open a PR `staging` → `main` and merge it. This also brings the two-site workflow to `main`.
3. Set the repo variable `PROD_VITE_TWILIO_FUNCTIONS_URL` = `https://alpha-message-6434.twil.io`.
4. Actions → "Build and publish to GitHub Pages" → Run workflow (on `main`).
5. Hard-refresh production (Ctrl+F5) and check that an MMS conversation shows images.

**Rollback:** delete `PROD_VITE_TWILIO_FUNCTIONS_URL` and re-run the workflow. Production goes back to MMS-off (placeholders) without a code revert.

## Caveat until the first merge to main

Until `main` has this workflow, a push to `main` runs the **old** single-site workflow. That republishes production only, so `/staging/` 404s until the next push to `staging`. Production itself is fine.

## Twilio Functions

The functions in [server/twilio-function/](../server/twilio-function/) are **not** deployed by CI. After changing one, paste it into Twilio Console → Functions and Assets → Services → `alpha-message` → the function, then click **Deploy All**. Staging and production share this service, so keep function changes backward compatible with the code currently on `main`.
