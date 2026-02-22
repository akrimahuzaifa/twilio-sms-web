import axios from "axios"
import { toCredentials, Authentication } from "../context/AuthenticationProvider"
import { getTwilioFunctionsUrl, isTwilioFunctionsEnabled } from "./siteConfig"

export const FOOTER = "\n\nReply HELP for help. Reply STOP to unsubscribe."

/**
 * Build Basic Auth header for Twilio Functions
 * @param {Object} credentials 
 * @returns {string}
 */
const buildAuthHeader = (credentials) => {
  const encoded = btoa(`${credentials.username}:${credentials.password}`)
  return `Basic ${encoded}`
}

/**
 * Send SMS message directly via Twilio API
 * @param {Authentication} authentication
 * @param {string} to
 * @param {string} from
 * @param {string} body
 * @returns {Promise<string>} Message SID
 */
const sendSmsDirect = async (authentication, to, from, body) => {
  const credentials = toCredentials(authentication)
  const bodyWithFooter = body && body.includes(FOOTER.trim()) ? body : `${body || ""}${FOOTER}`

  const data = new URLSearchParams()
  data.append("To", to)
  data.append("From", from)
  data.append("Body", bodyWithFooter)

  const url = `https://api.twilio.com/2010-04-01/Accounts/${authentication.accountSid}/Messages.json`
  const response = await axios.post(url, data, {
    auth: credentials,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  })
  return response.data.sid
}

/**
 * Send MMS message via Twilio Functions
 * @param {Authentication} authentication
 * @param {string} to
 * @param {string} from
 * @param {string} body
 * @param {string|string[]} mediaUrl
 * @returns {Promise<string>} Message SID
 */
const sendMmsViaFunctions = async (authentication, to, from, body, mediaUrl) => {
  const credentials = toCredentials(authentication)
  const functionsUrl = getTwilioFunctionsUrl()
  const bodyWithFooter = body && body.includes(FOOTER.trim()) ? body : `${body || ""}${FOOTER}`

  const url = `${functionsUrl}/send-mms`
  const response = await axios.post(
    url,
    {
      to,
      from,
      body: bodyWithFooter,
      mediaUrl: mediaUrl || undefined,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: buildAuthHeader(credentials),
      },
    }
  )

  return response.data.messageSid
}

/**
 * Send MMS message directly via Twilio API
 * @param {Authentication} authentication
 * @param {string} to
 * @param {string} from
 * @param {string} body
 * @param {string|string[]} mediaUrl
 * @returns {Promise<string>} Message SID
 */
const sendMmsDirect = async (authentication, to, from, body, mediaUrl) => {
  const credentials = toCredentials(authentication)
  const bodyWithFooter = body && body.includes(FOOTER.trim()) ? body : `${body || ""}${FOOTER}`

  const data = new URLSearchParams()
  data.append("To", to)
  data.append("From", from)

  if (body) {
    data.append("Body", bodyWithFooter)
  }

  // Add media URLs - Twilio accepts multiple MediaUrl parameters
  const mediaUrls = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl]
  mediaUrls.forEach(url => {
    if (url) {
      data.append("MediaUrl", url)
    }
  })

  const url = `https://api.twilio.com/2010-04-01/Accounts/${authentication.accountSid}/Messages.json`
  const response = await axios.post(url, data, {
    auth: credentials,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  })
  return response.data.sid
}

/**
 * Send an SMS message (text only, no media)
 * @param {Authentication} authentication
 * @param {string} to - Recipient phone number
 * @param {string} from - Sender phone number (must be a Twilio number)
 * @param {string} body - Message text
 * @returns {Promise<string>} Message SID
 */
export const sendTwilioMessage = async (authentication = new Authentication(), to = "", from = "", body = "") => {
  return sendSmsDirect(authentication, to, from, body)
}

/**
 * Send an MMS message (with media attachments)
 * @param {Authentication} authentication
 * @param {string} to - Recipient phone number
 * @param {string} from - Sender phone number (must be MMS-enabled Twilio number)
 * @param {string} body - Message text (optional if media is provided)
 * @param {string|string[]} mediaUrl - URL(s) of media to attach (must be publicly accessible)
 * @returns {Promise<string>} Message SID
 */
export const sendTwilioMms = async (authentication = new Authentication(), to = "", from = "", body = "", mediaUrl = "") => {
  if (!mediaUrl || (Array.isArray(mediaUrl) && mediaUrl.length === 0)) {
    // No media, send as regular SMS
    return sendTwilioMessage(authentication, to, from, body)
  }

  // Try via Functions first if configured, otherwise direct API
  if (isTwilioFunctionsEnabled()) {
    try {
      return await sendMmsViaFunctions(authentication, to, from, body, mediaUrl)
    } catch (error) {
      console.warn("Functions MMS failed, trying direct API:", error.message)
      // Fall back to direct API
      return sendMmsDirect(authentication, to, from, body, mediaUrl)
    }
  }

  return sendMmsDirect(authentication, to, from, body, mediaUrl)
}
