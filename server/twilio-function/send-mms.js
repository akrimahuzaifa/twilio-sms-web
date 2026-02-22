/**
 * Twilio Function: Send MMS
 * 
 * This function sends SMS/MMS messages with optional media attachments.
 * 
 * Path: /send-mms
 * Visibility: Public (handles its own auth)
 * 
 * Request Body (JSON):
 * {
 *   "to": "+1234567890",
 *   "from": "+1987654321",
 *   "body": "Your message text",
 *   "mediaUrl": "https://example.com/image.jpg" // Optional, can be array
 * }
 * 
 * Headers:
 * - Content-Type: application/json
 * - Authorization: Basic base64(accountSid:authToken) or custom token
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
    response.appendHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.appendHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
}

// Helper to parse Basic Auth header
const parseBasicAuth = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return null;
    }

    try {
        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
        const [username, password] = credentials.split(':');
        return { username, password };
    } catch (e) {
        return null;
    }
};

exports.handler = async function (context, event, callback) {
    // Create response object
    const response = new Twilio.Response();

    // Get allowed origin from environment
    const allowedOrigin = context.ALLOWED_ORIGIN || '*';

    // Get request origin (if available)
    const requestOrigin = event.request && event.request.headers && (event.request.headers.origin || event.request.headers.Origin)

    // Handle CORS preflight
    if (event.request && event.request.method === 'OPTIONS') {
        addCorsHeaders(response, allowedOrigin, requestOrigin)
        response.setStatusCode(204)
        return callback(null, response)
    }

    // Add CORS headers
    addCorsHeaders(response, allowedOrigin, requestOrigin)
    response.appendHeader('Content-Type', 'application/json');

    // Parse authorization header if present (for multi-tenant support)
    // This allows the frontend to pass its own credentials
    const authHeader = event.request?.headers?.authorization;
    const parsedAuth = parseBasicAuth(authHeader);

    // Get message parameters from request body
    const { to, from, body, mediaUrl } = event;

    // Validate required fields
    if (!to || !from) {
        response.setStatusCode(400);
        response.setBody(JSON.stringify({
            error: 'Missing required fields',
            details: 'Both "to" and "from" are required'
        }));
        return callback(null, response);
    }

    // Validate that we have either body or mediaUrl
    if (!body && !mediaUrl) {
        response.setStatusCode(400);
        response.setBody(JSON.stringify({
            error: 'Missing content',
            details: 'Either "body" or "mediaUrl" must be provided'
        }));
        return callback(null, response);
    }

    try {
        // Use client credentials if provided, otherwise use service credentials
        let client;
        if (parsedAuth && parsedAuth.username && parsedAuth.password) {
            // Create a new client with provided credentials
            client = require('twilio')(parsedAuth.username, parsedAuth.password);
        } else {
            // Explicitly create client with Account SID and Auth Token
            // (Don't use getTwilioClient() as it may pick up API Keys instead)
            client = require('twilio')(context.ACCOUNT_SID, context.AUTH_TOKEN);
        }

        // Build message options
        const messageOptions = {
            to,
            from,
        };

        // Add body if provided
        if (body) {
            messageOptions.body = body;
        }

        // Add media URL(s) if provided
        if (mediaUrl) {
            // mediaUrl can be a single URL string or an array of URLs
            messageOptions.mediaUrl = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl];
        }

        console.log(`Sending message from ${from} to ${to}, hasMedia: ${!!mediaUrl}`);

        // Send the message
        const message = await client.messages.create(messageOptions);

        console.log(`Message sent successfully: ${message.sid}`);

        // Return success response
        response.setStatusCode(201);
        response.setBody(JSON.stringify({
            success: true,
            messageSid: message.sid,
            status: message.status,
            to: message.to,
            from: message.from,
            dateCreated: message.dateCreated,
            numMedia: message.numMedia
        }));

        return callback(null, response);

    } catch (error) {
        console.error('Send message error:', error.message);

        // Determine appropriate status code
        let statusCode = 500;
        if (error.code === 20003) statusCode = 401; // Authentication error
        if (error.code === 21211) statusCode = 400; // Invalid phone number
        if (error.code === 21608) statusCode = 400; // Unverified number

        response.setStatusCode(statusCode);
        response.appendHeader('Content-Type', 'application/json');
        const body = {
            error: 'Failed to send message',
            code: error.code,
            details: error.message
        }
        if (context.DEBUG === 'true' && error.stack) body.stack = error.stack
        response.setBody(JSON.stringify(body));

        return callback(null, response);
    }
};
