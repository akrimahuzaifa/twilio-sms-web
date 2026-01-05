import { siteConfig } from "../../js/siteConfig"

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
  <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg-page)]">
    <div className="bg-white max-w-[500px] w-full p-10 rounded-[1.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] font-sans text-[var(--text-main)] mx-auto">
      <div className="mb-6 text-left">
        <a
          href="#"
          onClick={e => {
            e.preventDefault()
            onCancel()
          }}
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] mb-3 hover:text-[var(--color-primary)]"
        >
          <i className="ph ph-arrow-left" />
          Back
        </a>
        <h2 className="text-2xl font-semibold mb-1">Authentication with API Key</h2>
        <p className="text-sm text-[var(--text-muted)]">Manage your Twilio resources securely with API credentials.</p>
      </div>

      <form
        onSubmit={e => {
          e.preventDefault()
          onSignIn()
        }}
      >
        <div className="mb-4">
          <label htmlFor="AccountSid" className="block text-sm font-semibold text-[var(--text-main)] mb-2">Account SID</label>
          <input
            id="AccountSid"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#fcfcfc] focus:outline-none focus:ring-4 focus:ring-[#bfdbfe]"
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

        <div className="mb-4">
          <label htmlFor="ApiKey" className="block text-sm font-semibold text-[var(--text-main)] mb-2">API Key</label>
          <input
            id="ApiKey"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#fcfcfc] focus:outline-none focus:ring-4 focus:ring-[#bfdbfe]"
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

        <div className="mb-4">
          <label htmlFor="ApiSecret" className="block text-sm font-semibold text-[var(--text-main)] mb-2">API Secret</label>
          <input
            id="ApiSecret"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#fcfcfc] focus:outline-none focus:ring-4 focus:ring-[#bfdbfe]"
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

        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={onCancel} className={`btn-ghost rounded-xl`}>Cancel</button>
          <button
            className={`${loadingClassName(loading)} btn-primary rounded-xl`}
            type="submit"
            disabled={loading}
          >
            Sign-in <i className="ph ph-caret-right" />
          </button>
        </div>
      </form>

      <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
        Need help? <a href="https://www.twilio.com/docs/iam/api-keys" target="_blank" rel="noreferrer" className="text-[var(--color-primary)] underline">See Twilio API Key Documentation</a>
      </div>
    </div>
  </div>
)
