# HANDOFF: αMessage (twilio-sms-web)

> Living document. Read it at the start of every AI session and update it after every patch (see [CLAUDE.md](CLAUDE.md)).
> Last updated: **2026-10-29**. **Start with "Next session: start here" below.**

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
- Receive was verified locally before this session. Send was never actually verified anywhere until 2026-10-28.
- Production showed only "Media attachment" placeholders. Root cause: `.env` is gitignored and CI built without `VITE_TWILIO_FUNCTIONS_URL`. Fixed in the workflow, which now reads repo variables.
- Two-site Pages workflow added so changes can be tested at `/staging/` before touching production.
- Staging test (2026-10-28): **receive works** (images show).
- Send bug 1, 413 at `/upload-media`: fixed (chunked Sync storage), and the user deployed the functions. Upload now succeeds.
- Send bug 2: "MMS sent" but it arrives as **text only**. Fixed in `83fcafd`, deployed to staging 2026-10-29 (run 40753083549). **Verified by the user 2026-10-29:** an MMS sent from staging to +14046800340 arrived with the image, and the recipient's reply MMS showed in the thread. **MMS send + receive works on staging.**
- Missing old **sent** messages in conversations: fixed 2026-10-29, committed and staged with the user's OK. The user still needs to check it in the browser.

**Priority 2: security.** Two critical Function holes fixed (2026-10-28; see log). The rest is under Open issues.

**Priority 3: login.** Not started.

## Pending user actions

- [x] Paste updated `media-proxy.js`, `get-media.js`, `send-mms.js` into the Twilio Console and Deploy All (user confirmed 2026-10-28)
- [x] GitHub repo variable `VITE_TWILIO_FUNCTIONS_URL` = `https://alpha-message-6434.twil.io` (user confirmed 2026-10-28)
- [x] GitHub → Settings → Environments → `github-pages` → Deployment branches → add `staging` (user confirmed 2026-10-28)
- [x] Create and push the `staging` branch from `mms-setup` (done 2026-10-28)
- [x] Confirm the Actions run "Build and publish to GitHub Pages" for `staging` succeeded (run 40604100435, success)
- [x] Paste updated `upload-media.js` and `serve-media.js` into the Twilio Console and Deploy All (done 2026-10-28; upload no longer 413s)
- [ ] Smoke-test production (sign in, open inbox, send a plain SMS). Its dependencies were re-resolved on this deploy; see Open issues.
- [ ] Run the staging test checklist below
- [ ] Release to production (steps in docs/DEPLOYMENT.md → "Releasing MMS to production"). Needs explicit OK.

## Next session: start here

1. ~~Send an MMS from staging~~ Done 2026-10-29: delivered with the image, and the reply MMS was received.
2. **User:** on staging, check that old test conversations (+12674715851, +14046800340, +14046800905) now show their sent messages.
3. Finish the staging checklist and the production smoke test, then decide on release (docs/DEPLOYMENT.md).
4. After release: priority 2 (security backlog under Open issues).

## Staging test checklist (MMS)

On https://akrimahuzaifa.github.io/twilio-sms-web/staging/ (check the orange STAGING badge), sign in the way the team does (API Key):

- [x] DevTools console does **not** show "Twilio Functions not configured"
- [x] An existing MMS conversation (e.g. +17733978211) shows the images, not placeholders (2026-10-28)
- [x] Attach button (paperclip) is visible in the reply box
- [x] Send an image via the paperclip to a test phone. It arrives, and the image appears in the thread after refresh (2026-10-29)
- [ ] Send an image via paste (Ctrl+V)
- [ ] Send text + image together; the footer text is present
- [x] Reply with an MMS from the phone. It shows up in the inbox with the image (2026-10-29)
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
- `lodash` is imported (`isEmpty`) in MediaViewer, MessageRows and getTwilioPhoneNumbers but is not in package.json; it only works because another package installs it. Add it as a dependency, or replace those imports.
- Server-side cleanup option: return objects instead of `JSON.stringify(...)` from Functions to avoid double encoding. The client now tolerates both, so this is optional and needs a Console deploy.
- `package-lock.json` is gitignored, so CI `npm install` resolves the latest semver-compatible deps on every build, and builds aren't reproducible. Production was rebuilt with fresh deps on 2026-10-28 (bundle hash changed CpX3Z6tI → FQJ4PsJg, same app code). Fix: un-ignore and commit the lockfile, use `npm ci` in CI (do it on staging first).
- ~29 pre-existing ESLint errors.
- Shared Functions service across staging and prod: function changes must stay compatible with what's on `main`.
- `.env` has `VITE_API_BASE` and `VITE_API_BASE_CLOUD`, which nothing in `src/` references.

## Repo state

- Working branch: `mms-setup`. `main` = `origin/main` = production = `d5eb59b` (unchanged).
- `staging` = `mms-setup` (pushed 2026-10-28). Branches: `main` (prod), `staging`, `mms-setup` (MMS work). Older ones: `ahk-dev`, `ahk-ux-enhancements`, `notification-system`, `backup/production-recovery`.

## Session log

### 2026-10-29: staging deploy of the MMS fix + conversation history fix
- With the user's OK, fast-forwarded `staging` to `83fcafd` and pushed. Run 40753083549 succeeded; the live staging bundle contains the new upload error string, which confirms the fix is deployed.
- **Missing sent messages fix:** `getTwilioMessages(from, to, pageSize)` gained an optional PageSize (`MAX_PAGE_SIZE = 1000`; existing callers keep Twilio's default of 50, so the list and polling cost are unchanged). New `getConversationMessages(contact, phoneNumber, filter)` in `InboxPage/getMessages.js` fetches `From=contact` + `To=contact` (respecting the filter, then narrowed to the selected number). `InboxPage` loads it when a contact is selected (with a cancel guard) and merges it with the polled messages, deduped by SID; polled entries win, so optimistic sends still show. `ConversationPage` uses `MAX_PAGE_SIZE`. Dedupe is hand-written: lodash isn't a declared dependency (existing imports rely on it being installed by another package; see Open issues).
- **Verified (read-only API):** sent/received per test contact, old view vs new: +12674715851 0/6 to 8/6; +14046800340 1/8 to 6/8; +17733978211 1/2 to 2/2; +14046800905 0/1 to 1/1. Build passes; lint count on the touched files is unchanged (28 to 28).
- User verified the MMS round trip on staging (send to +14046800340 with the image delivered, reply MMS received). Committed the history fix and staged it with the user's OK.
- **Not verified:** in-browser behavior of the history fix (awaiting the user's check on staging). Conversations with more than 1000 messages in one direction would still be truncated, which is fine for now.

### 2026-10-28 night (home): MMS arrives as text only
- **User report:** after the chunking deploy, staging said "MMS sent" to 2 numbers, but the thread showed only the footer text and no image.
- **Evidence (read-only Twilio API, using local `.env` API key):** the latest two messages from +14694377816 (to +17733978211 and +14046800340) were `delivered`, `error_code=null`, **`num_media=0`**. Twilio never received a MediaUrl; a failed media fetch would have failed the message instead.
- **Root cause:** Twilio Functions **double-encode JSON**. `curl /upload-media` returns `Content-Type: application/json` with the body `"{\"success\":true,...,\"url\":...}"` (a JSON string). axios gives back a string, so `response.data.url` is undefined. `sendTwilioMms` treats an empty mediaUrl as "no media" and quietly sends a plain SMS. `getTwilioMedia.js` already had a workaround for this; the send path didn't.
- **Fix (client only, no Console deploy needed):** `parseFunctionResponse()` in `src/js/sendTwilioMessage.js` handles both the upload and the send-mms responses. `uploadMediaForMms` now throws if no URL comes back, instead of falling through to SMS.
- **Verified:** parsing the real captured body gives the URL (the old code gives undefined); the staging build passes; no lint errors in the file.
- **Not verified:** a real MMS send after the fix (not deployed to staging yet; see Next session).
- Also found: the missing old sent messages are caused by the 50-per-page default (see the diagnosis above).
- Junk Sync items from curl tests expire within 1h.
- Read-only check used (bash, repo root): `set -a; . ./.env; set +a; node -e` with fetch to `/2010-04-01/Accounts/$SID/Messages.json?From=%2B14694377816&PageSize=8`, Basic auth = API key:secret, printing status/error_code/num_media.

### 2026-10-28 (home): MMS send 413 fix
- **Symptom:** sending on staging gave "Network Error", a CORS error, and `POST /upload-media` returned 413, even though the image was compressed to 29KB.
- **Root cause:** `upload-media` stored the entire base64 image in ONE Twilio Sync map item, and Sync caps item data at 16KB. Reproduced with curl: 15KB of data returns 201, 18KB returns 413. The edge accepts 100KB+ bodies (checked on `serve-media`). Twilio's CloudFront replaces the error with an HTML 413 page without CORS headers, which is why the browser reported CORS. Sending could never have worked for a real photo. The earlier claim that "send works locally" was an unverified assumption.
- **Fix:** `upload-media` writes the base64 as 15KB chunks `{id}_0..n` (one at a time, to avoid Sync write throttling) plus a meta item `{id}` = `{chunks, contentType}`. `serve-media` reassembles them and still serves legacy inline `base64` items. Server cap lowered from 1.5MB to 400KB to stay inside the 10s Function timeout.
- **Verified:** round trip against a mock Sync that enforces the 16KB limit: a 17KB PNG (22.9KB base64) gives 3 writes and a byte-identical serve; legacy item OK; oversize returns 400. The curl probes wrote 2 junk items to Sync (expire 1h).
- **Not verified:** a real send after the Console deploy.

### 2026-10-28 (office): MMS on Pages + staging + security fixes
- **Diagnosis:** the deployed bundle had an empty `VITE_TWILIO_FUNCTIONS_URL` (console: "Twilio Functions not configured"), because `.env` is gitignored and CI had no env. curl confirmed the Functions service is live and CORS allows the Pages origin. Checked the live bundle: it contains no SIDs or API keys.
- **Workflow** ([.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)): builds `main` → `/` and `staging` → `/staging/` in one Pages artifact. Prod reads `vars.PROD_VITE_TWILIO_FUNCTIONS_URL` (unset, so prod is unchanged); staging reads `vars.VITE_TWILIO_FUNCTIONS_URL`. Added a concurrency group and the `github-pages` environment.
- **Staging UI:** `isStaging()` in `siteConfig.js` (from `BASE_URL`), an orange STAGING badge in `App.jsx`, and a separate localStorage unread key in `InboxPage.jsx`.
- **Security fixes in Functions:** `media-proxy` only accepts `/2010-04-01/Accounts/{own AC}/Messages/{MM|SM}…/Media/ME…` (it used to forward the Auth Token to any URL). `get-media` builds proxy URLs with the service's own AC. `send-mms` requires the caller's Basic auth (it used to fall back to the service creds, an open relay) and supports API keys via `accountSid` in the body. The client now sends `accountSid`.
- **Docs:** CLAUDE.md, HANDOFF.md, docs/DEPLOYMENT.md, docs/ARCHITECTURE.md, .env.example; Functions README gained the GitHub variable step.
- **Verified:** `node --check` on all functions; the path allowlist rejects external and look-alike hosts; prod and staging builds give the correct asset base; no new lint errors.
- **Not verified:** the actual CI run, staging deploy, and real MMS send/receive on Pages.
- Deploy run 40604100435 succeeded. Verified with curl: `/` (prod) returns 200, has no Functions URL and no credentials; `/staging/` returns 200, has the Functions URL and the staging base, and no credentials.
- Follow-up: user added `staging` to the github-pages deployment branches; pushed `mms-setup` and created/pushed `staging` from it to trigger the first two-site deploy.
