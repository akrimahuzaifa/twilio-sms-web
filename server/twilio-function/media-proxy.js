/**
 * Twilio Function: Media Proxy
 * 
 * This function proxies requests for MMS media from Twilio's API,
 * adding authentication so that browser <img> tags can display media.
 * 
 * Path: /media-proxy
 * Visibility: Public
 * 
 * IMPORTANT: In Twilio Console → Functions → Settings → Environment Variables:
 *   ✅ Check "Add my Twilio Credentials (ACCOUNT_SID) and (AUTH_TOKEN) to ENV"
 *   Set ALLOWED_ORIGIN = * (or your specific origins)
 */

const axios = require('axios')

// Helper to determine and add CORS headers
const determineAllowedOrigin = (allowedOriginConfig, requestOrigin) => {
    if (!allowedOriginConfig) return '*'
    if (allowedOriginConfig === '*') return '*'
    const list = allowedOriginConfig.split(',').map(s => s.trim()).filter(Boolean)
    if (requestOrigin && list.includes(requestOrigin)) return requestOrigin
    if (list.includes('*')) return '*'
    return list[0] || '*'
}

const addCorsHeaders = (response, allowedOriginConfig, requestOrigin) => {
    const originToSet = determineAllowedOrigin(allowedOriginConfig, requestOrigin)
    response.appendHeader('Access-Control-Allow-Origin', originToSet)
    response.appendHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.appendHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
}

exports.handler = async function (context, event, callback) {
    // Create response object FIRST
    const response = new Twilio.Response()

    // Get request origin for CORS
    let requestOrigin = '*'
    try {
        requestOrigin = (event.request && event.request.headers &&
            (event.request.headers.origin || event.request.headers.Origin)) || '*'
    } catch (e) { /* ignore */ }

    // Get allowed origin from environment
    const allowedOrigin = context.ALLOWED_ORIGIN || '*'

    // ALWAYS add CORS headers FIRST - before any code that might fail
    addCorsHeaders(response, allowedOrigin, requestOrigin)

    // Handle CORS preflight
    try {
        if (event.request && event.request.method === 'OPTIONS') {
            response.setStatusCode(204)
            return callback(null, response)
        }
    } catch (e) { /* ignore */ }

    // Wrap ALL logic in try-catch to ensure we always return with CORS headers
    try {
        const { mediaUrl, token, accountSid: clientAccountSid } = event

        // Basic validation
        if (!mediaUrl) {
            response.appendHeader('Content-Type', 'application/json')
            response.setStatusCode(400)
            response.setBody(JSON.stringify({ error: 'Missing mediaUrl parameter' }))
            return callback(null, response)
        }

        // Optional: Verify token for additional security
        if (context.MEDIA_ACCESS_TOKEN && token !== context.MEDIA_ACCESS_TOKEN) {
            response.appendHeader('Content-Type', 'application/json')
            response.setStatusCode(401)
            response.setBody(JSON.stringify({ error: 'Invalid token' }))
            return callback(null, response)
        }

        // Check if credentials are available
        if (!context.ACCOUNT_SID || !context.AUTH_TOKEN) {
            response.appendHeader('Content-Type', 'application/json')
            response.setStatusCode(500)
            response.setBody(JSON.stringify({
                error: 'Twilio credentials not configured',
                details: 'In Twilio Console → Functions → Settings → Environment Variables, check "Add my Twilio Credentials (ACCOUNT_SID) and (AUTH_TOKEN) to ENV"'
            }))
            return callback(null, response)
        }

        // Use provided accountSid or fall back to context
        const accountSid = clientAccountSid || context.ACCOUNT_SID
        const authToken = context.AUTH_TOKEN

        // Construct full Twilio API URL
        const fullUrl = mediaUrl.startsWith('http')
            ? mediaUrl
            : `https://api.twilio.com${mediaUrl}`

        console.log(`Proxying media request: ${fullUrl}`)

        // Fetch media with authentication
        const mediaResponse = await axios.get(fullUrl, {
            auth: {
                username: accountSid,
                password: authToken
            },
            responseType: 'arraybuffer',
            maxRedirects: 5,
            validateStatus: (status) => status < 500
        })

        // Set content type from Twilio's response
        const contentType = mediaResponse.headers['content-type'] || 'application/octet-stream'
        response.appendHeader('Content-Type', contentType)
        response.appendHeader('Cache-Control', 'public, max-age=3600')

        response.setStatusCode(mediaResponse.status)
        response.setBody(Buffer.from(mediaResponse.data))
        return callback(null, response)

    } catch (error) {
        console.error('Media proxy error:', error.message, error.stack)

        response.appendHeader('Content-Type', 'application/json')
        response.setStatusCode(error.response?.status || 500)

        const body = {
            error: 'Failed to fetch media',
            details: error.message
        }
        if (context.DEBUG === 'true') {
            body.stack = error.stack
        }
        response.setBody(JSON.stringify(body))
        return callback(null, response)
    }
}
