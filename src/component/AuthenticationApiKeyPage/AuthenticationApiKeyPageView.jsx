import { siteConfig } from "../../js/siteConfig"
import "./style.css"

const loadingClassName = (loading = false) => (loading ? "opacity-60 cursor-not-allowed" : "")

export const AuthenticationApiKeyView = ({
  accountSid = "",
  apiKey = "",
  apiSecret = "",
  loading = false,
  onAccountSidChange = () => {},
  onApiKeyChange = () => {},
  onApiSecretChange = () => {},
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
        <h2>Authentication with API Key</h2>
        <p>Manage your Twilio resources securely with API credentials.</p>
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
          <label htmlFor="ApiKey">API Key</label>
          <input
            id="ApiKey"
            type="text"
            name="ApiKey"
            value={apiKey}
            autoComplete="on"
            placeholder="SK29f9a7b5db42b..."
            required
            disabled={loading}
            onChange={e => onApiKeyChange(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="ApiSecret">API Secret</label>
          <div className="password-wrapper">
            <input
              id="ApiSecret"
              type="password"
              name="ApiSecret"
              value={apiSecret}
              autoComplete="on"
              placeholder="••••••••••••••••"
              required
              disabled={loading}
              onChange={e => onApiSecretChange(e.target.value)}
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
          <a href="https://www.twilio.com/docs/iam/api-keys" target="_blank" rel="noreferrer">
            See Twilio API Key Documentation
          </a>
        </p>
      </div>
    </div>
  </div>
)
