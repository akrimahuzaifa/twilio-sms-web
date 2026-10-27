# Agent instructions (αMessage / twilio-sms-web)

This repo is worked on from two machines (office and home) in separate AI sessions. Continuity lives in the repo, not in chat history.

## Start of every session

1. Read [HANDOFF.md](HANDOFF.md) fully: current status, priorities, pending user actions, open issues.
2. Run `git status` and `git log --oneline -5` and compare against the "Repo state" section of HANDOFF.md. If they disagree, trust git and fix HANDOFF.md.
3. For deploy / staging questions read [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). For how the pieces fit read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## After every patch (mandatory)

Update HANDOFF.md in the same commit as the change:

- Add a dated entry to **Session log** (what changed, why, what was verified, what was not).
- Update **Current status**, **Pending user actions** and **Open issues** so they are true right now.
- If you changed anything in `server/twilio-function/`, add a pending user action to paste those files into the Twilio Console and click Deploy All. The repo copy is the source of truth, but nothing deploys it automatically.

## Hard rules

- `main` is production for a working team (https://akrimahuzaifa.github.io/twilio-sms-web/). Never push to `main` or merge into it without the user's explicit OK. Test on `staging` first.
- Never commit `.env` and never put `VITE_AUTHENTICATION_*` (or any secret) in CI. Every `VITE_*` var is embedded in the public JS bundle.
- Commit or push only when the user asks.

## Environment notes

- Windows dev machines; Bash tool is Git Bash. Prefix commands that pass `/absolute/url/paths` as args with `MSYS_NO_PATHCONV=1` (otherwise `--base=/twilio-sms-web/` becomes `/Program Files/Git/...`).
- Node: `.nvmrc` says 22; CI builds with Node 18. Both work.
- `npm run dev` serves http://localhost:3000/twilio-sms-web (reads `.env`; copy `.env.example`).
- `npx eslint` reports ~29 pre-existing errors on `main` (unused vars, empty blocks). Don't add new ones; cleaning them up is separate work.
