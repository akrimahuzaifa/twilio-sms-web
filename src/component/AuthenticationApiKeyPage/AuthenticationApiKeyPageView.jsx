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
  <div className="min-h-screen w-full flex items-center justify-center px-4">
    <div
      className="absolute inset-0"
      style={{
        backgroundColor: "#f8fafc",
        backgroundImage:
          "radial-gradient(circle at 0% 0%, #e0f2fe 0%, transparent 45%), radial-gradient(circle at 100% 100%, #dbeafe 0%, transparent 45%)",
      }}
    />

    <div className="relative w-full max-w-[560px] p-6 mx-auto">
      <div className="login-card mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="login-header mb-6 text-left">
          <a href="#" onClick={e => { e.preventDefault(); onCancel() }} className="back-link text-gray-600 hover:text-[#3b82f6] flex items-center gap-2 mb-3">
            <i className="ph ph-arrow-left" />
            Back
          </a>
          <h2 className="text-2xl font-semibold mb-1">Authentication with API Key</h2>
          <p className="text-sm text-gray-500">Manage your Twilio resources securely with API credentials.</p>
        </div>

        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault()
            onSignIn()
          }}
        >
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Account SID</span>
            <input
              className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-2 focus:outline-none focus:ring-4 focus:ring-[#bfdbfe]"
              type="text"
              name="AccountSid"
              value={accountSid}
              autoComplete="on"
              placeholder="ACd9a982c0e94f..."
              required
              disabled={loading}
              onChange={e => onAccountSidChange(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">API Key</span>
            <input
              className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-2 focus:outline-none focus:ring-4 focus:ring-[#bfdbfe]"
              type="text"
              name="ApiKey"
              value={apiKey}
              autoComplete="on"
              placeholder="SK29f9a7b5db42b..."
              required
              disabled={loading}
              onChange={e => onApiKeyChange(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">API Secret</span>
            <input
              className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-2 focus:outline-none focus:ring-4 focus:ring-[#bfdbfe]"
              type="password"
              name="ApiSecret"
              value={apiSecret}
              autoComplete="on"
              placeholder="••••••••••••••••"
              required
              disabled={loading}
              onChange={e => onApiSecretChange(e.target.value)}
            />
          </label>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-transparent text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              className={`${loadingClassName(loading)} px-5 py-2 rounded-xl bg-[#3b82f6] text-white font-semibold hover:bg-[#2563eb] flex items-center gap-2`}
              type="submit"
              disabled={loading}
            >
              Sign-in <i className="ph ph-caret-right" />
            </button>
          </div>
        </form>

        <div className="doc-hint mt-6 text-center">
          <p className="text-sm text-gray-500">Need help? <a href="https://www.twilio.com/docs/iam/api-keys" target="_blank" rel="noreferrer" className="text-[#3b82f6] underline">See Twilio API Key Documentation</a></p>
        </div>
      </div>

      {/* footer removed to match design (no bottom footer, prevents extra scrolling) */}
    </div>
  </div>
)
