import {
  Authentication,
  AuthenticationMethod,
  mapAuthenticationError,
  useAuthentication,
} from "../../context/AuthenticationProvider"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ErrorLabel } from "../ErrorLabel/ErrorLabel"
import { AuthenticationApiKeyView } from "./AuthenticationApiKeyPageView"
import { validatePermission } from "../../js/validateTwilioPermission"
import { LayoutWithoutNavBar } from "../Layout/Layout"

export const AuthenticationApiKeyPage = () => {
  const [authentication, setAuthentication] = useAuthentication()
  const [accountSid, setAccountSid] = useState(authentication.accountSid)
  const [apiKey, setApiKey] = useState(authentication.apiKey)
  const [apiSecret, setApiSecret] = useState(authentication.apiSecret)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleError = err => {
    setError(mapAuthenticationError(err))
    setLoading(false)
  }

  const handleCancel = () => navigate("/authentication")

  const handlePhoneNumbersSuccess = () => {
    setAuthentication({
      accountSid,
      apiKey,
      apiSecret,
      method: AuthenticationMethod.API_KEY,
    })
    navigate("/inbox")
  }

  const handleSignIn = () => {
    setLoading(true)
    const auth = new Authentication(accountSid, "", apiKey, apiSecret, AuthenticationMethod.API_KEY)
    validatePermission(auth).then(handlePhoneNumbersSuccess).catch(handleError)
  }

  return (
    <>
      <ErrorLabel error={error} />
      <AuthenticationApiKeyView
        accountSid={accountSid}
        apiKey={apiKey}
        apiSecret={apiSecret}
        loading={loading}
        onAccountSidChange={setAccountSid}
        onApiKeyChange={setApiKey}
        onApiSecretChange={setApiSecret}
        onSignIn={handleSignIn}
        onCancel={handleCancel}
      />
    </>
  )
}
