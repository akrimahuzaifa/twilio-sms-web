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
 * Convert a File or Blob to base64 string
 * @param {File|Blob} file 
 * @returns {Promise<string>}
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // Remove data URL prefix to get pure base64
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Compress an image file to reduce size for MMS
 * Resizes to max dimensions and compresses quality
 * 
 * @param {File|Blob} file - Original image
 * @param {number} maxWidth - Max width in pixels (default 600)
 * @param {number} maxHeight - Max height in pixels (default 600)
 * @param {number} quality - JPEG quality 0-1 (default 0.5)
 * @returns {Promise<Blob>} - Compressed image blob
 */
const compressImage = (file, maxWidth = 600, maxHeight = 600, quality = 0.5) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Upload an image to Twilio Functions for MMS sending
 * Returns a public URL that can be used as mediaUrl
 * Automatically compresses large images
 * 
 * @param {File|Blob} file - Image file to upload
 * @returns {Promise<{url: string, mediaId: string}>}
 */
export const uploadMediaForMms = async (file) => {
  if (!isTwilioFunctionsEnabled()) {
    throw new Error("Twilio Functions not configured. MMS sending requires Functions.")
  }

  // Always compress images to stay under Twilio Functions payload limit (~1MB)
  console.log(`Compressing image from ${Math.round(file.size / 1024)}KB...`)
  const processedFile = await compressImage(file)
  console.log(`Compressed to ${Math.round(processedFile.size / 1024)}KB`)

  const functionsUrl = getTwilioFunctionsUrl()
  const base64 = await fileToBase64(processedFile)
  const contentType = 'image/jpeg' // Always JPEG after compression

  const response = await axios.post(
    `${functionsUrl}/upload-media`,
    {
      data: base64,
      contentType: contentType,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  )

  return {
    url: response.data.url,
    mediaId: response.data.mediaId,
  }
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
