import { ErrorLabel } from "../ErrorLabel/ErrorLabel"
import { AuthenticationAuthTokenView } from "./AuthenticationAuthTokenPageView"
import {
  Authentication,
  AuthenticationMethod,
  mapAuthenticationError,
  useAuthentication,
} from "../../context/AuthenticationProvider"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { validatePermission } from "../../js/validateTwilioPermission"

export const AuthenticationAuthTokenPage = () => {
  const [authentication, setAuthentication] = useAuthentication()
  const [accountSid, setAccountSid] = useState(authentication.accountSid)
  const [authToken, setAuthToken] = useState(authentication.authToken)
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
      authToken,
      method: AuthenticationMethod.AUTH_TOKEN,
    })
    navigate("/inbox")
  }

  const handleSignIn = () => {
    setLoading(true)
    const auth = new Authentication(accountSid, authToken, "", "", AuthenticationMethod.AUTH_TOKEN)
    validatePermission(auth).then(handlePhoneNumbersSuccess).catch(handleError)
  }

  return (
    <>
      <ErrorLabel error={error} />
      <AuthenticationAuthTokenView
        accountSid={accountSid}
        authToken={authToken}
        onAccountSidChange={setAccountSid}
        onAuthTokenChange={setAuthToken}
        loading={loading}
        onSignIn={handleSignIn}
        onCancel={handleCancel}
      />
    </>
  )
}
