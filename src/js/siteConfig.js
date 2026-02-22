export const siteConfig = {
  appTitle: "αMessage",
  footer: {
    creditText: "αMessage | Enterprise Messaging by",
    companyName: "Alpha Xolution",
    companyUrl: "https://alphaxolution.com",
  },
}

/**
 * Twilio Functions URL for serverless backend
 * This enables MMS media proxying and sending
 * Set via environment variable: VITE_TWILIO_FUNCTIONS_URL
 * 
 * Example: https://sms-web-backend-1234.twil.io
 */
export const getTwilioFunctionsUrl = () => {
  return import.meta.env.VITE_TWILIO_FUNCTIONS_URL || ""
}

/**
 * Check if Twilio Functions is configured
 * @returns {boolean}
 */
export const isTwilioFunctionsEnabled = () => {
  const url = getTwilioFunctionsUrl()
  return url && url.length > 0 && url.includes("twil.io")
}

export default siteConfig
