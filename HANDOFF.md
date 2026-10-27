# HANDOFF: αMessage (twilio-sms-web)

> Living document. Read it at the start of every AI session and update it after every patch (see [CLAUDE.md](CLAUDE.md)).
> Last updated: **2026-10-28** (office machine)

## What this is

αMessage is a static React app on GitHub Pages that the team uses to send and read SMS/MMS through a Twilio account. Team members sign in in the browser with Account SID + API Key + Secret. MMS depends on a Twilio Functions service. Details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Deploy/staging: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

- Production (team uses it daily): https://akrimahuzaifa.github.io/twilio-sms-web/ ← `main`
- Staging: https://akrimahuzaifa.github.io/twilio-sms-web/staging/ ← `staging`
- Twilio Functions: https://alpha-message-6434.twil.io (service `alpha-message`)
- GitHub: `origin` = akrimahuzaifa/twilio-sms-web (ours), `upstream` = rafacandev/twilio-sms-web (original open-source project)

## Priorities (set by the user)

1. **Deliver MMS send + receive.** ← current
2. Secure the current setup (Functions, credentials, front end).
3. Proper login system (backend/DB, or serverless via Twilio Functions + Sync) instead of everyone typing Account SID + API key/secret.

## Current status

**Priority 1: MMS**
- Code works locally (send + receive verified by the user before this session).
- Production showed only "Media attachment" placeholders. Root cause: `.env` is gitignored and CI built without `VITE_TWILIO_FUNCTIONS_URL`. Fixed in the workflow, which now reads repo variables.
- Two-site Pages workflow added so changes can be tested at `/staging/` before touching production.
- **Not yet verified on staging.** Waiting on the pending user actions below.

**Priority 2: security.** Two critical Function holes fixed (2026-10-28; see log). The rest is under Open issues.

**Priority 3: login.** Not started.

## Pending user actions

- [x] Paste updated `media-proxy.js`, `get-media.js`, `send-mms.js` into the Twilio Console and Deploy All (user confirmed 2026-10-28)
- [x] GitHub repo variable `VITE_TWILIO_FUNCTIONS_URL` = `https://alpha-message-6434.twil.io` (user confirmed 2026-10-28)
- [ ] GitHub → Settings → Environments → `github-pages` → Deployment branches → add `staging`
- [ ] Create and push the `staging` branch from `mms-setup` (`git switch -c staging mms-setup && git push -u origin staging`)
- [ ] Run the staging test checklist below
- [ ] Release to production (steps in docs/DEPLOYMENT.md → "Releasing MMS to production"). Needs explicit OK.

## Staging test checklist (MMS)

On https://akrimahuzaifa.github.io/twilio-sms-web/staging/ (check the orange STAGING badge), sign in the way the team does (API Key):

- [ ] DevTools console does **not** show "Twilio Functions not configured"
- [ ] An existing MMS conversation (e.g. +17733978211) shows the images, not placeholders
- [ ] Attach button (paperclip) is visible in the reply box
- [ ] Send an image via the paperclip to a test phone. It arrives, and the image appears in the thread after refresh
- [ ] Send an image via paste (Ctrl+V)
- [ ] Send text + image together; the footer text is present
- [ ] Reply with an MMS from the phone. It shows up in the inbox with the image
- [ ] Plain SMS and multi-recipient SMS still work
- [ ] Production URL still behaves exactly as before (placeholders, no paperclip). It should be unchanged until release.

## Open issues / backlog

Security (priority 2):
- `/upload-media` is unauthenticated, so anyone with the URL can store images in Sync and get a public link on our twil.io domain. Fix: require the caller's Basic auth and validate it (e.g. fetch the account).
- `/get-media` is unauthenticated and uses the service creds (needs a message SID, which isn't guessable). Fix: require the caller's creds, or issue short-lived HMAC-signed proxy URLs.
- `/media-proxy` is unauthenticated by necessity (`<img>`). Fix: signed, expiring URLs issued by an authenticated `/get-media`.
- `ALLOWED_ORIGIN` responses currently send `*`. Set it in Console to `https://akrimahuzaifa.github.io,http://localhost:3000`. (CORS isn't real auth; it only limits browsers.)
- Before 2026-10-28, `/media-proxy` would send the Auth Token to any URL passed to it. There's no evidence of abuse, but consider rotating the account Auth Token (then re-check "Add my Twilio Credentials" in the Functions settings).
- Every team member holds a full-account API key in their browser. That's priority 3.
- Functions are deployed by hand-pasting. Consider the Twilio Serverless Toolkit (`twilio serverless:deploy`) driven from CI.

Other:
- ~29 pre-existing ESLint errors.
- Shared Functions service across staging and prod: function changes must stay compatible with what's on `main`.
- `.env` has `VITE_API_BASE` and `VITE_API_BASE_CLOUD`, which nothing in `src/` references.

## Repo state

- Working branch: `mms-setup`. `main` = `origin/main` = production = `d5eb59b` at session start.
- Branches: `main` (prod), `mms-setup` (MMS work), `staging` (to be created). Older ones: `ahk-dev`, `ahk-ux-enhancements`, `notification-system`, `backup/production-recovery`.

## Session log

### 2026-10-28 (office): MMS on Pages + staging + security fixes
- **Diagnosis:** the deployed bundle had an empty `VITE_TWILIO_FUNCTIONS_URL` (console: "Twilio Functions not configured"), because `.env` is gitignored and CI had no env. curl confirmed the Functions service is live and CORS allows the Pages origin. Checked the live bundle: it contains no SIDs or API keys.
- **Workflow** ([.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)): builds `main` → `/` and `staging` → `/staging/` in one Pages artifact. Prod reads `vars.PROD_VITE_TWILIO_FUNCTIONS_URL` (unset, so prod is unchanged); staging reads `vars.VITE_TWILIO_FUNCTIONS_URL`. Added a concurrency group and the `github-pages` environment.
- **Staging UI:** `isStaging()` in `siteConfig.js` (from `BASE_URL`), an orange STAGING badge in `App.jsx`, and a separate localStorage unread key in `InboxPage.jsx`.
- **Security fixes in Functions:** `media-proxy` only accepts `/2010-04-01/Accounts/{own AC}/Messages/{MM|SM}…/Media/ME…` (it used to forward the Auth Token to any URL). `get-media` builds proxy URLs with the service's own AC. `send-mms` requires the caller's Basic auth (it used to fall back to the service creds, an open relay) and supports API keys via `accountSid` in the body. The client now sends `accountSid`.
- **Docs:** CLAUDE.md, HANDOFF.md, docs/DEPLOYMENT.md, docs/ARCHITECTURE.md, .env.example; Functions README gained the GitHub variable step.
- **Verified:** `node --check` on all functions; the path allowlist rejects external and look-alike hosts; prod and staging builds give the correct asset base; no new lint errors.
- **Not verified:** the actual CI run, staging deploy, and real MMS send/receive on Pages.
