import axios from "axios"
import { getAuthentication, toCredentials } from "../context/AuthenticationProvider"

const cache = new Map()

/**
 * @param {string} messageSid
 * @returns {Promise<string>} public url for the media
 */
export const getTwilioMedia = async messageSid => {
  const authentication = getAuthentication()
  if (cache.has(messageSid)) {
    return cache.get(messageSid)
  }

  let result = []

  // First try the local server proxy which returns signed CDN URLs.
  // Use Vite env `VITE_API_BASE` if provided, otherwise assume http://localhost:4000.
  const proxyBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE)
    ? import.meta.env.VITE_API_BASE
    : 'http://localhost:4000'
  try {
    const proxyResp = await axios.get(`${proxyBase}/api/media/${messageSid}`)
    if (proxyResp?.data?.media && proxyResp.data.media.length > 0) {
      result = proxyResp.data.media
      cache.set(messageSid, result)
      return result
    }
  } catch (err) {
    // Proxy not available or failed — fall back to previous behavior below.
  }

  // Fallback: fetch via Twilio API and create object URLs (may hit CORS when
  // redirected to Twilio's CDN). This is less reliable in-browser.
  const url = `https://api.twilio.com/2010-04-01/Accounts/${authentication.accountSid}/Messages/${messageSid}/Media.json`
  const response = await axios.get(url, {
    auth: toCredentials(authentication),
  })
  if (response?.data?.media_list?.length > 0) {
    const medias = response.data.media_list
    const promises = medias.map(async m => {
      const suffix = m.uri.substring(0, m.uri.indexOf(".json"))
      const mediaUrl = `https://api.twilio.com${suffix}`
      try {
        const mediaResp = await axios.get(mediaUrl, {
          auth: toCredentials(authentication),
          responseType: "blob",
        })
        const contentType = mediaResp.headers && (mediaResp.headers["content-type"] || mediaResp.headers["Content-Type"]) || (mediaResp.data && mediaResp.data.type) || "application/octet-stream"
        const blob = mediaResp.data instanceof Blob ? mediaResp.data : new Blob([mediaResp.data], { type: contentType })
        return URL.createObjectURL(blob)
      } catch (err) {
        return null
      }
    })
    result = (await Promise.all(promises)).filter(Boolean)
  }
  cache.set(messageSid, result)
  return result
}
