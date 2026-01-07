import axios from "axios"
import { toCredentials, Authentication } from "../context/AuthenticationProvider"

export const sendTwilioMessage = async (authentication = new Authentication(), to = "", from = "", body = "") => {
  const credentials = toCredentials(authentication)

  const FOOTER = "\n\nReply HELP for help. Reply STOP to unsubscribe."
  const bodyWithFooter = body && body.includes("Reply HELP for help. Reply STOP to unsubscribe.") ? body : `${body || ""}${FOOTER}`

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
