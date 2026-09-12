/**
 * Twilio Function: Upload Media for MMS
 * 
 * This function receives base64-encoded image data and stores it
 * temporarily in Twilio Sync for use in MMS messages.
 * 
 * Path: /upload-media
 * Visibility: Public
 * 
 * Request Body (JSON):
 * {
 *   "data": "base64-encoded-image-data",
 *   "contentType": "image/jpeg" // or image/png, image/gif
 * }
 * 
 * IMPORTANT: In Twilio Console:
 *   1. Enable Twilio Sync in your account
 *   2. Add environment variable: SYNC_SERVICE_SID (your Sync Service SID)
 *      Or leave empty to use the default Sync service
 * 
 * Dependencies required:
 *   - twilio (built-in)
 */

// Helper to determine allowed origin (matches other functions)
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
    response.appendHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.appendHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
}

// Generate unique ID for media
const generateMediaId = () => {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 10)
    return `media_${timestamp}_${random}`
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
        // Check credentials
        if (!context.ACCOUNT_SID || !context.AUTH_TOKEN) {
            response.setStatusCode(500)
            response.setBody(JSON.stringify({
                error: 'Twilio credentials not configured',
                details: 'Enable "Add my Twilio Credentials" in Function settings'
            }))
            return callback(null, response)
        }

        // Get request data
        const { data, contentType } = event

        if (!data) {
            response.setStatusCode(400)
            response.setBody(JSON.stringify({
                error: 'Missing required field',
                details: '"data" (base64 image data) is required'
            }))
            return callback(null, response)
        }

        // Validate content type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        const mediaType = contentType || 'image/jpeg'
        if (!validTypes.includes(mediaType)) {
            response.setStatusCode(400)
            response.setBody(JSON.stringify({
                error: 'Invalid content type',
                details: `Supported types: ${validTypes.join(', ')}`
            }))
            return callback(null, response)
        }

        // Check approximate size (base64 is ~33% larger than binary)
        const approximateSize = (data.length * 3) / 4
        const maxSize = 1.5 * 1024 * 1024 // 1.5MB (MMS limit)
        if (approximateSize > maxSize) {
            response.setStatusCode(400)
            response.setBody(JSON.stringify({
                error: 'Image too large',
                details: `Maximum size is 1.5MB for MMS. Current size: ~${Math.round(approximateSize / 1024)}KB`
            }))
            return callback(null, response)
        }

        // Generate unique media ID
        const mediaId = generateMediaId()

        // Store in Twilio Sync
        const client = require('twilio')(context.ACCOUNT_SID, context.AUTH_TOKEN)

        // Use default Sync service or the one configured
        const syncServiceSid = context.SYNC_SERVICE_SID || 'default'

        // Create or get the Sync Map for media storage
        let syncMap
        try {
            syncMap = await client.sync.v1
                .services(syncServiceSid)
                .syncMaps('mms_media_store')
                .fetch()
        } catch (e) {
            // Create the map if it doesn't exist
            if (e.code === 20404) {
                syncMap = await client.sync.v1
                    .services(syncServiceSid)
                    .syncMaps
                    .create({ uniqueName: 'mms_media_store' })
            } else {
                throw e
            }
        }

        // Store the media data with TTL (auto-delete after 1 hour)
        await client.sync.v1
            .services(syncServiceSid)
            .syncMaps('mms_media_store')
            .syncMapItems
            .create({
                key: mediaId,
                data: {
                    base64: data,
                    contentType: mediaType,
                    createdAt: new Date().toISOString()
                },
                ttl: 3600 // Auto-delete after 1 hour
            })

        // Generate the public URL for serving this media
        const serveUrl = `https://${context.DOMAIN_NAME}/serve-media?id=${mediaId}`

        console.log(`Uploaded media: ${mediaId}, type: ${mediaType}, size: ~${Math.round(approximateSize / 1024)}KB`)

        response.setStatusCode(201)
        response.setBody(JSON.stringify({
            success: true,
            mediaId: mediaId,
            url: serveUrl,
            contentType: mediaType,
            expiresIn: '1 hour'
        }))
        return callback(null, response)

    } catch (error) {
        console.error('Upload media error:', error.message, error.stack)

        response.setStatusCode(error.status || 500)
        response.setBody(JSON.stringify({
            error: 'Failed to upload media',
            details: error.message
        }))
        return callback(null, response)
    }
}
