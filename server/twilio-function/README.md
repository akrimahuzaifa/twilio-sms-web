# Twilio Functions Setup Guide

This folder contains the serverless Twilio Functions needed to support MMS functionality in the Twilio SMS Web app.

## Why Twilio Functions?

The main React app is hosted on GitHub Pages (static hosting) and cannot directly:

1. **Proxy media requests** - Twilio MMS media URLs require authentication, but `<img>` tags cannot send auth headers
2. **Send MMS messages** - Some API calls require server-side processing for security

Twilio Functions provides a free, serverless solution that integrates natively with Twilio's infrastructure.

---

## Quick Setup (5-10 minutes)

### Step 1: Create a Functions Service

1. Log in to [Twilio Console](https://www.twilio.com/console)
2. Navigate to **Explore Products** → **Developer Tools** → **Functions and Assets**
3. Click **Services** in the sidebar, then **Create Service**
4. Name it: `sms-web-backend`
5. Click **Create**

### Step 2: Configure Environment

1. In your new service, click **Settings** (bottom-left gear icon)
2. Under **Environment Variables**:
   - ✅ Check **"Add my Twilio Credentials (ACCOUNT_SID) and (AUTH_TOKEN) to ENV"**
   - Add: `ALLOWED_ORIGIN` = `https://akrimahuzaifa.github.io` (your GitHub Pages URL)
   - _(Optional)_ Add: `MEDIA_ACCESS_TOKEN` = `your-secret-token` (for extra security)

3. Under **Dependencies**, add:
   - `axios` with version `^1.6.0`

4. Click **Save** after each change

### Step 3: Create the Functions

Create five functions by clicking **Add +** → **Add Function** for each:

#### Function 1: `/media-proxy` (Public)

- Click the padlock icon 🔒 and change to **Public** 🌐
- Copy the contents of `media-proxy.js` into the editor

#### Function 2: `/send-mms` (Public)

- Click the padlock icon 🔒 and change to **Public** 🌐
- Copy the contents of `send-mms.js` into the editor

#### Function 3: `/get-media` (Public)

- Click the padlock icon 🔒 and change to **Public** 🌐
- Copy the contents of `get-media.js` into the editor

#### Function 4: `/upload-media` (Public) - For sending MMS

- Click the padlock icon 🔒 and change to **Public** 🌐
- Copy the contents of `upload-media.js` into the editor

#### Function 5: `/serve-media` (Public) - For sending MMS

- Click the padlock icon 🔒 and change to **Public** 🌐
- Copy the contents of `serve-media.js` into the editor

### Step 4: Deploy

1. Click **Deploy All** (bottom-left button)
2. Wait for deployment to complete (usually 30-60 seconds)
3. Your functions will be available at:
   ```
   https://sms-web-backend-XXXX.twil.io/media-proxy
   https://sms-web-backend-XXXX.twil.io/send-mms
   https://sms-web-backend-XXXX.twil.io/get-media
   ```
   (XXXX is a random string assigned by Twilio)

### Step 5: Configure Your React App

Add your Functions URL to the `.env` file:

```env
VITE_TWILIO_FUNCTIONS_URL=https://sms-web-backend-XXXX.twil.io
```

---

## Function Reference

### 1. `/media-proxy`

Proxies media requests to Twilio's API with authentication.

**Usage:**

```
GET /media-proxy?mediaUrl=/2010-04-01/Accounts/{AccountSid}/Messages/{MessageSid}/Media/{MediaSid}
```

**Example in HTML:**

```html
<img src="https://your-service.twil.io/media-proxy?mediaUrl=/2010-04-01/..." />
```

### 2. `/get-media`

Fetches media list for a message and returns proxied URLs.

**Usage:**

```
GET /get-media?messageSid=SMxxxxxxxxxx
```

**Response:**

```json
{
  "media": [
    {
      "sid": "MExxxxx",
      "contentType": "image/jpeg",
      "url": "https://your-service.twil.io/media-proxy?mediaUrl=..."
    }
  ]
}
```

### 3. `/send-mms`

Sends SMS/MMS messages with optional media attachments.

**Usage:**

```
POST /send-mms
Content-Type: application/json
Authorization: Basic base64(accountSid:authToken)

{
  "to": "+1234567890",
  "from": "+1987654321",
  "body": "Hello with image!",
  "mediaUrl": "https://example.com/image.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "messageSid": "SMxxxxx",
  "status": "queued"
}
```

### 4. `/upload-media` (for sending MMS)

Uploads an image from the browser for MMS sending. Stores temporarily in Twilio Sync.

**Prerequisites:**
- Enable Twilio Sync in your account (it's included with Functions)

**Usage:**

```
POST /upload-media
Content-Type: application/json

{
  "data": "base64-encoded-image-data",
  "contentType": "image/jpeg"
}
```

**Response:**

```json
{
  "success": true,
  "mediaId": "media_xxxxx",
  "url": "https://your-service.twil.io/serve-media?id=media_xxxxx",
  "expiresIn": "1 hour"
}
```

### 5. `/serve-media` (for sending MMS)

Serves uploaded images for MMS. Used internally by Twilio when sending MMS.

**Usage:**

```
GET /serve-media?id=media_xxxxx
```

Returns the binary image data with appropriate Content-Type.

---

## Security Considerations

1. **CORS**: Functions only accept requests from `ALLOWED_ORIGIN`
2. **Authentication**: The `/send-mms` function accepts Basic Auth headers from the frontend
3. **Optional Token**: Set `MEDIA_ACCESS_TOKEN` for additional security on media proxy

---

## Troubleshooting

### "CORS error" in browser console

- Verify `ALLOWED_ORIGIN` is set correctly in environment variables
- Make sure the function visibility is set to **Public**

### "401 Unauthorized" when fetching media

- Check that Twilio credentials are added to environment
- Verify the message SID is correct and belongs to your account

### "Function not found" or 404 errors

- Ensure you clicked **Deploy All** after creating functions
- Check the function path matches exactly (case-sensitive)

---

## Alternative: Local Development with Serverless Toolkit

If you prefer local development:

```bash
# Install Twilio CLI
npm install -g twilio-cli

# Install Serverless Toolkit
twilio plugins:install @twilio-labs/plugin-serverless

# Initialize project
cd server
twilio serverless:init sms-web-backend
cd sms-web-backend

# Copy function files to /functions folder
# Then start local server
twilio serverless:start

# Deploy when ready
twilio serverless:deploy
```

---

## Cost

Twilio Functions is **very affordable**:

- First 10,000 invocations/month: **FREE**
- After that: $0.0001 per invocation

For a typical SMS app, you'll likely stay within the free tier.
