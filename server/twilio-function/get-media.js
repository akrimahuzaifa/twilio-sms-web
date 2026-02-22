/**
 * Twilio Function: Fetch Media List
 * 
 * This function fetches the list of media for a message and returns
 * proxied URLs that can be used directly in <img> tags.
 * 
 * Path: /get-media
 * Visibility: Public
 * 
 * IMPORTANT: In Twilio Console → Functions → Settings → Environment Variables:
 *   ✅ Check "Add my Twilio Credentials (ACCOUNT_SID) and (AUTH_TOKEN) to ENV"
 *   Set ALLOWED_ORIGIN = * (or your specific origins)
 */

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

// Helper to parse Basic Auth header
const parseBasicAuth = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return null
    }
    try {
        const base64Credentials = authHeader.split(' ')[1]
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8')
        const [username, password] = credentials.split(':')
        return { username, password }
    } catch (e) {
        return null
    }
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
    response.appendHeader('Content-Type', 'application/json')

    // Handle CORS preflight
    try {
        if (event.request && event.request.method === 'OPTIONS') {
            response.setStatusCode(204)
            return callback(null, response)
        }
    } catch (e) { /* ignore */ }

    // Wrap ALL logic in try-catch to ensure we always return with CORS headers
    try {
        // Get parameters
        const { messageSid, accountSid: clientAccountSid } = event

        // Parse authorization header if present
        let parsedAuth = null
        try {
            const authHeader = event.request?.headers?.authorization
            parsedAuth = parseBasicAuth(authHeader)
        } catch (e) { /* ignore */ }

        if (!messageSid) {
            response.setStatusCode(400)
            response.setBody(JSON.stringify({ error: 'Missing messageSid parameter' }))
            return callback(null, response)
        }

        // Determine which credentials to use
        let client
        let accountSid

        if (parsedAuth && parsedAuth.username && parsedAuth.password) {
            // Use provided credentials from Authorization header
            accountSid = parsedAuth.username
            client = require('twilio')(parsedAuth.username, parsedAuth.password)
        } else {
            // Use service credentials - MUST have "Add my Twilio Credentials" checked
            accountSid = clientAccountSid || context.ACCOUNT_SID

            // Check if credentials are available
            if (!context.ACCOUNT_SID || !context.AUTH_TOKEN) {
                response.setStatusCode(500)
                response.setBody(JSON.stringify({
                    error: 'Twilio credentials not configured',
                    details: 'In Twilio Console → Functions → Settings → Environment Variables, check "Add my Twilio Credentials (ACCOUNT_SID) and (AUTH_TOKEN) to ENV"'
                }))
                return callback(null, response)
            }

            // Explicitly create client with Account SID and Auth Token
            // (Don't use getTwilioClient() as it may pick up API Keys instead)
            client = require('twilio')(context.ACCOUNT_SID, context.AUTH_TOKEN)
        }

        console.log(`Fetching media for message: ${messageSid}, accountSid: ${accountSid}`)

        // Fetch media list for the message
        const mediaList = await client.messages(messageSid).media.list()

        // Get the base URL for this function's service
        const serviceUrl = `https://${context.DOMAIN_NAME}`

        // Transform media list to include proxied URLs
        const media = mediaList.map(m => {
            const relativeUrl = `/2010-04-01/Accounts/${accountSid}/Messages/${messageSid}/Media/${m.sid}`
            const proxyUrl = `${serviceUrl}/media-proxy?mediaUrl=${encodeURIComponent(relativeUrl)}`

            return {
                sid: m.sid,
                contentType: m.contentType,
                dateCreated: m.dateCreated,
                originalUrl: `https://api.twilio.com${relativeUrl}`,
                url: proxyUrl
            }
        })

        console.log(`Found ${media.length} media items for message ${messageSid}`)

        response.setStatusCode(200)
        response.setBody(JSON.stringify({ media }))
        return callback(null, response)

    } catch (error) {
        // Log full error for debugging
        console.error('Get media error:', error.message, error.stack)

        response.setStatusCode(error.status || 500)
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
