import { siteConfig } from "../../js/siteConfig"
import { useEffect, useState } from "react"

const loadingClassName = (loading = false) => (loading ? "opacity-60 cursor-not-allowed" : "")

export const AuthenticationAuthTokenView = ({
  accountSid = "",
  authToken = "",
  loading = false,
  onAccountSidChange = () => {},
  onAuthTokenChange = () => {},
  onCancel = () => {},
  onSignIn = () => {},
}) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 bg-[var(--bg-page)]">
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "#f8fafc",
          backgroundImage:
            "radial-gradient(circle at 0% 0%, #e0f2fe 0%, transparent 45%), radial-gradient(circle at 100% 100%, #dbeafe 0%, transparent 45%)",
        }}
      />

      <div
        className={`bg-white max-w-[500px] w-full p-10 rounded-[1.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] font-sans text-[var(--text-main)] mx-auto transform transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
        style={{ transitionDelay: mounted ? "120ms" : "0ms" }}
      >
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
          <h2 className="text-2xl font-extrabold mb-1 text-[var(--text-main)]">Authentication with Auth Token</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Use your Account SID and Auth Token from the Twilio Console to sign in.
          </p>
        </div>

        <form
          onSubmit={e => {
            e.preventDefault()
            onSignIn()
          }}
        >
          <div className="mb-4">
            <label htmlFor="AccountSid" className="block text-sm font-semibold text-[var(--text-main)] mb-2">
              Account SID
            </label>
            <input
              id="AccountSid"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#fcfcfc] focus:outline-none focus:ring-4 focus:ring-[#bfdbfe] focus:border-[var(--color-primary)] placeholder:text-gray-400"
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
            <label htmlFor="AuthToken" className="block text-sm font-semibold text-[var(--text-main)] mb-2">
              Auth Token
            </label>
            <input
              id="AuthToken"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#fcfcfc] focus:outline-none focus:ring-4 focus:ring-[#bfdbfe] focus:border-[var(--color-primary)] placeholder:text-gray-400"
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

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onCancel} className={`btn-ghost rounded-xl`}>
              Cancel
            </button>
            <button className={`btn-primary rounded-xl ${loadingClassName(loading)}`} type="submit" disabled={loading}>
              Sign-in <i className="ph ph-caret-right" />
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
          Need help?{" "}
          <a
            href="https://github.com/akrimahuzaifa"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--color-primary)] font-semibold hover:underline"
          >
            Contact Developer
          </a>
        </div>
      </div>
    </div>
  )
}
