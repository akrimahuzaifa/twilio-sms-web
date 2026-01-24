import 'dotenv/config'
import express from 'express'
import axios from 'axios'
import cors from 'cors'

const app = express()
const port = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

// Support multiple env var options. Prefer classic TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN.
// If not present, allow using the VITE_* API key + secret (from your .env) as a fallback.
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT || process.env.ACCOUNT_SID || process.env.VITE_AUTHENTICATION_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH || process.env.AUTH_TOKEN

// Twilio API Key (SK...) and secret (recommended over using root auth token in some cases)
const TWILIO_API_KEY = process.env.TWILIO_API_KEY || process.env.VITE_AUTHENTICATION_API_KEY
const TWILIO_API_SECRET = process.env.TWILIO_API_SECRET || process.env.VITE_AUTHENTICATION_API_SECRET

if (!TWILIO_ACCOUNT_SID || !(TWILIO_AUTH_TOKEN || (TWILIO_API_KEY && TWILIO_API_SECRET))) {
    console.warn('Warning: Twilio credentials not configured. Set TWILIO_ACCOUNT_SID+TWILIO_AUTH_TOKEN or VITE_AUTHENTICATION_API_KEY+VITE_AUTHENTICATION_API_SECRET and VITE_AUTHENTICATION_ACCOUNT_SID in .env')
}

app.get('/api/media/:messageSid', async (req, res) => {
    const { messageSid } = req.params
    if (!TWILIO_ACCOUNT_SID || !(TWILIO_AUTH_TOKEN || (TWILIO_API_KEY && TWILIO_API_SECRET))) {
        return res.status(500).json({ error: 'Twilio credentials not configured on server' })
    }

    // Choose auth credentials: prefer account SID + auth token, else use API Key + secret
    const authCredentials = TWILIO_AUTH_TOKEN
        ? { username: TWILIO_ACCOUNT_SID, password: TWILIO_AUTH_TOKEN }
        : { username: TWILIO_API_KEY, password: TWILIO_API_SECRET }

    try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages/${messageSid}/Media.json`
        const listResp = await axios.get(url, {
            auth: authCredentials,
        })

        const mediaList = listResp?.data?.media_list || []
        const result = []

        for (const m of mediaList) {
            const suffix = m.uri.substring(0, m.uri.indexOf('.json'))
            const mediaApiUrl = `https://api.twilio.com${suffix}`
            try {
                // Request with no redirects so we can read the Location header with the signed CDN URL
                const headResp = await axios.head(mediaApiUrl, {
                    auth: authCredentials,
                    maxRedirects: 0,
                    validateStatus: status => status >= 200 && status < 400,
                })
                // If the server responded with 200, it's likely the content; but Twilio usually redirects to mms.twiliocdn.com
                if (headResp.headers && headResp.headers.location) {
                    result.push(headResp.headers.location)
                } else {
                    // If no Location provided, construct the API URL (client can try it)
                    result.push(mediaApiUrl)
                }
            } catch (err) {
                // Axios throws on 302 when maxRedirects=0; get the location from err.response
                const location = err?.response?.headers?.location
                if (location) {
                    result.push(location)
                } else {
                    // fallback: push mediaApiUrl so client can attempt authenticated fetch or see error
                    result.push(mediaApiUrl)
                }
            }
        }

        return res.json({ media: result })
    } catch (err) {
        console.error('Error fetching Twilio media list:', err?.message || err)
        return res.status(500).json({ error: 'Failed to fetch media list' })
    }
})

app.listen(port, () => {
    console.log(`Media proxy server listening on http://localhost:${port}`)
})
