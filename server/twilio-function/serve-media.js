/**
 * Twilio Function: Serve Media for MMS
 * 
 * This function serves images stored in Twilio Sync for MMS messages.
 * Returns binary image data with appropriate content type.
 * 
 * Path: /serve-media
 * Visibility: Public
 * 
 * Query Parameters:
 *   - id: The media ID returned from /upload-media
 * 
 * IMPORTANT: In Twilio Console:
 *   1. Enable Twilio Sync in your account
 *   2. Add environment variable: SYNC_SERVICE_SID (your Sync Service SID)
 *      Or leave empty to use the default Sync service
 * 
 * Dependencies required:
 *   - twilio (built-in)
 */

exports.handler = async function (context, event, callback) {
    const response = new Twilio.Response()

    // Allow CORS for image requests
    response.appendHeader('Access-Control-Allow-Origin', '*')
    response.appendHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

    // Handle CORS preflight
    if (event.request?.method === 'OPTIONS') {
        response.setStatusCode(204)
        return callback(null, response)
    }

    try {
        // Check credentials
        if (!context.ACCOUNT_SID || !context.AUTH_TOKEN) {
            response.appendHeader('Content-Type', 'application/json')
            response.setStatusCode(500)
            response.setBody(JSON.stringify({
                error: 'Twilio credentials not configured'
            }))
            return callback(null, response)
        }

        // Get media ID from query
        const { id } = event

        if (!id) {
            response.appendHeader('Content-Type', 'application/json')
            response.setStatusCode(400)
            response.setBody(JSON.stringify({
                error: 'Missing required parameter',
                details: '"id" query parameter is required'
            }))
            return callback(null, response)
        }

        // Retrieve from Twilio Sync
        const client = require('twilio')(context.ACCOUNT_SID, context.AUTH_TOKEN)
        const syncServiceSid = context.SYNC_SERVICE_SID || 'default'

        let mediaItem
        try {
            mediaItem = await client.sync.v1
                .services(syncServiceSid)
                .syncMaps('mms_media_store')
                .syncMapItems(id)
                .fetch()
        } catch (e) {
            if (e.code === 20404) {
                response.appendHeader('Content-Type', 'application/json')
                response.setStatusCode(404)
                response.setBody(JSON.stringify({
                    error: 'Media not found',
                    details: 'The requested media does not exist or has expired'
                }))
                return callback(null, response)
            }
            throw e
        }

        // Get the stored data
        const { base64, contentType } = mediaItem.data

        if (!base64) {
            response.appendHeader('Content-Type', 'application/json')
            response.setStatusCode(500)
            response.setBody(JSON.stringify({
                error: 'Invalid media data'
            }))
            return callback(null, response)
        }

        // Convert base64 to binary buffer
        const imageBuffer = Buffer.from(base64, 'base64')

        // Set appropriate headers for image
        response.appendHeader('Content-Type', contentType || 'image/jpeg')
        response.appendHeader('Cache-Control', 'public, max-age=3600')
        response.appendHeader('Content-Length', imageBuffer.length.toString())

        response.setStatusCode(200)
        response.setBody(imageBuffer)
        return callback(null, response)

    } catch (error) {
        console.error('Serve media error:', error.message, error.stack)

        response.appendHeader('Content-Type', 'application/json')
        response.setStatusCode(error.status || 500)
        response.setBody(JSON.stringify({
            error: 'Failed to serve media',
            details: error.message
        }))
        return callback(null, response)
    }
}
