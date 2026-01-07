import axios from "axios"
import { toCredentials, Authentication } from "../context/AuthenticationProvider"

export const FOOTER = "\n\nReply HELP for help. Reply STOP to unsubscribe."

export const sendTwilioMessage = async (authentication = new Authentication(), to = "", from = "", body = "") => {
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
