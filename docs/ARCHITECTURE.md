# Architecture

## Pieces

- **Frontend:** React 18 + Vite 6 + Tailwind, `HashRouter` (routes look like `/#/inbox`). It's a static build hosted on GitHub Pages and has no backend of its own.
- **Twilio REST API:** the browser calls `https://api.twilio.com/2010-04-01/...` directly with HTTP Basic auth, using credentials the user types at sign-in:
  - Auth Token mode: `AccountSid:AuthToken`
  - API Key mode (what the team uses): `ApiKeySid(SK…):ApiSecret`, plus Account SID for URLs
  - Credentials live in memory only (`authenticationCache` in [src/context/AuthenticationProvider.jsx](../src/context/AuthenticationProvider.jsx)) and are lost on reload. `VITE_AUTHENTICATION_*` in `.env` pre-fills them for **local dev only**.
- **Twilio Functions service** `alpha-message` → `https://alpha-message-6434.twil.io`. It exists because static hosting can't hold secrets or serve authenticated media. It uses the service's own `ACCOUNT_SID`/`AUTH_TOKEN` ("Add my Twilio Credentials to ENV" is checked). Source is in [server/twilio-function/](../server/twilio-function/) and is pasted into the Console manually.

The frontend only enables MMS when `VITE_TWILIO_FUNCTIONS_URL` is set and contains `twil.io` (`isTwilioFunctionsEnabled()` in [src/js/siteConfig.js](../src/js/siteConfig.js)). Otherwise media shows as placeholders and the attach button is hidden.

## Receive / view MMS

No webhook is involved. Twilio stores inbound media, and the app lists messages through the REST API.

```
MediaViewer(messageSid)
  └─ getTwilioMedia()                      src/js/getTwilioMedia.js (cached per SID)
       └─ GET {fn}/get-media?messageSid=…   lists media with service creds and returns proxy URLs
  <img src="{fn}/media-proxy?mediaUrl=/2010-04-01/Accounts/AC…/Messages/MM…/Media/ME…">
       └─ media-proxy fetches the bytes from api.twilio.com with the service creds
          (only this account's media paths are accepted)
```

## Send MMS

```
ConversationComposer (attach or paste an image)
  └─ uploadMediaForMms(file)                src/js/sendTwilioMessage.js
       compresses to JPEG ≤600px, q0.5
       └─ POST {fn}/upload-media            stores base64 in Twilio Sync map `mms_media_store` as 15KB chunks
                                            (`{id}_0..n` + meta item `{id}`; Sync caps items at 16KB), TTL 1h, max 400KB
            returns {fn}/serve-media?id=media_…   (public URL Twilio can fetch)
  └─ sendTwilioMms(auth, to, from, body, url)
       └─ POST {fn}/send-mms  (Basic auth = the user's creds, body includes accountSid)
            fallback on any error: POST api.twilio.com …/Messages.json with MediaUrl directly
  Twilio then fetches {fn}/serve-media?id=… to build the MMS
```

Plain SMS (including multi-recipient sends) always goes directly to the Twilio API, not through Functions.

## Function inventory

| Function | Auth required | Uses | Notes |
| --- | --- | --- | --- |
| `/get-media` | none (open) | service creds | Needs a message SID. Security backlog item. |
| `/media-proxy` | none (img tags can't send auth) | service creds | Restricted to this account's media paths. Optional `MEDIA_ACCESS_TOKEN`. |
| `/upload-media` | none (open) | service creds + Sync | Security backlog item: anyone can store images. |
| `/serve-media` | none (Twilio must fetch it) | service creds + Sync | Reassembles chunks. IDs are random; items expire after 1h. |
| `/send-mms` | **caller's** Basic auth (required) | caller creds | Supports Auth Token and API Key (`SK…` + `accountSid`). |

## Key files

- [src/component/InboxPage/InboxPage.jsx](../src/component/InboxPage/InboxPage.jsx): main screen (conversation list, thread, polling, unread badges)
- [src/component/ConversationComposer/ConversationComposer.jsx](../src/component/ConversationComposer/ConversationComposer.jsx): reply box, attachments
- [src/component/MediaViewer/MediaViewer.jsx](../src/component/MediaViewer/MediaViewer.jsx): renders MMS media
- [src/js/sendTwilioMessage.js](../src/js/sendTwilioMessage.js), [src/js/getTwilioMedia.js](../src/js/getTwilioMedia.js), [src/js/getTwilioMessages.js](../src/js/getTwilioMessages.js)
- [public/docs for sms-mms/](../public/docs%20for%20sms-mms/): saved Twilio docs used as reference
