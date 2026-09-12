import axios from "axios"
import { getAuthentication, toCredentials } from "../context/AuthenticationProvider"
import { getTwilioFunctionsUrl, isTwilioFunctionsEnabled } from "./siteConfig"

const cache = new Map()

/**
 * Fetch media via Twilio Functions (recommended for MMS)
 * This returns proxied URLs that can be used directly in <img> tags
 * @param {string} messageSid 
 * @returns {Promise<string[]>}
 */
const getMediaViaFunctions = async (messageSid) => {
  const authentication = getAuthentication()
  const functionsUrl = getTwilioFunctionsUrl()

  // Pass accountSid as query param - Functions use their own auth credentials
  const url = `${functionsUrl}/get-media?messageSid=${messageSid}&accountSid=${authentication.accountSid}`

  const response = await axios.get(url)
  
  // Handle response - may be string or already parsed object
  const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data

  if (data?.media?.length > 0) {
    return data.media.map(m => m.url)
  }

  return []
}

/**
 * Fetch media directly from Twilio API (fallback mode)
 * Note: These URLs require auth and may not work in <img> tags
 * @param {string} messageSid 
 * @returns {Promise<string[]>}
 */
const getMediaDirect = async (messageSid) => {
  const authentication = getAuthentication()
  const credentials = toCredentials(authentication)

  const url = `https://api.twilio.com/2010-04-01/Accounts/${authentication.accountSid}/Messages/${messageSid}/Media.json`
  const response = await axios.get(url, {
    auth: credentials,
  })

  if (response?.data?.media_list?.length > 0) {
    return response.data.media_list.map(m => {
      const suffix = m.uri.substring(0, m.uri.indexOf(".json"))
      // These URLs require authentication - won't work directly in <img> tags
      return `https://api.twilio.com/${suffix}`
    })
  }

  return []
}

/**
 * Get media URLs for a message
 * Uses Twilio Functions if configured, otherwise falls back to direct API
 * 
 * @param {string} messageSid
 * @returns {Promise<string[]>} Array of media URLs (proxied if Functions enabled)
 */
export const getTwilioMedia = async messageSid => {
  // Only return from cache if we have actual results (not empty from failed requests)
  if (cache.has(messageSid)) {
    const cached = cache.get(messageSid)
    if (cached && cached.length > 0) {
      return cached
    }
  }

  let result = []

  try {
    if (isTwilioFunctionsEnabled()) {
      // Use Twilio Functions proxy - URLs work directly in <img> tags
      result = await getMediaViaFunctions(messageSid)
    } else {
      // Fallback to direct API - URLs may not display in <img> tags
      console.warn("Twilio Functions not configured. MMS images may not display correctly.")
      result = await getMediaDirect(messageSid)
    }
  } catch (error) {
    console.error("Error fetching media:", error)
    // Try fallback if Functions call fails
    if (isTwilioFunctionsEnabled()) {
      try {
        result = await getMediaDirect(messageSid)
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError)
      }
    }
  }

  // Only cache successful results with media
  if (result && result.length > 0) {
    cache.set(messageSid, result)
  }
  
  return result
}

/**
 * Clear the media cache (useful after sending new messages)
 */
export const clearMediaCache = () => {
  cache.clear()
}
