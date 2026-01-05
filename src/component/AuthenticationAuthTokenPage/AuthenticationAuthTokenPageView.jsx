import { siteConfig } from "../../js/siteConfig"
import "./style.css"

const loadingClassName = (loading = false) => (loading ? "opacity-60 cursor-not-allowed" : "")

export const AuthenticationAuthTokenView = ({
  accountSid = "",
  authToken = "",
  loading = false,
  onAccountSidChange = () => {},
  onAuthTokenChange = () => {},
  onCancel = () => {},
  onSignIn = () => {},
}) => (
  <div className="auth-container">
    <div className="login-card">
      <div className="login-header">
        <a
          href="#"
          onClick={e => {
            e.preventDefault()
            onCancel()
          }}
          className="back-link"
        >
          <i className="ph ph-arrow-left" />
          Back
        </a>
        <h2>Authentication with Auth Token</h2>
        <p>Use your Account SID and Auth Token from the Twilio Console to sign in.</p>
      </div>

      <form
        className="login-form"
        onSubmit={e => {
          e.preventDefault()
          onSignIn()
        }}
      >
        <div className="input-group">
          <label htmlFor="AccountSid">Account SID</label>
          <input
            id="AccountSid"
            type="text"
            name="AccountSid"
            value={accountSid}
            autoComplete="on"
            placeholder="ACd9a982c0e94f..."
            required
            disabled={loading}
            onChange={e => onAccountSidChange(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="AuthToken">Auth Token</label>
          <div className="password-wrapper">
            <input
              id="AuthToken"
              type="password"
              name="AuthToken"
              value={authToken}
              autoComplete="on"
              placeholder="••••••••••••••••"
              required
              disabled={loading}
              onChange={e => onAuthTokenChange(e.target.value)}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-ghost">
            Cancel
          </button>
          <button className={`btn-primary sign-in-btn ${loadingClassName(loading)}`} type="submit" disabled={loading}>
            Sign-in <i className="ph ph-caret-right" />
          </button>
        </div>
      </form>

      <div className="doc-hint">
        <p>
          Need help?{" "}
          <a
            href="https://help.twilio.com/articles/223136027-Auth-Tokens-and-How-to-Change-Them"
            target="_blank"
            rel="noreferrer"
          >
            See Twilio Auth Token
          </a>
        </p>
      </div>
    </div>
  </div>
)
