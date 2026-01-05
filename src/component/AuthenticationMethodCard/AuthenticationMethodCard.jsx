import { AuthenticationMethod } from "../../context/AuthenticationProvider"
import { emptyFn } from "../../js/types"
import { siteConfig } from "../../js/siteConfig"

const termsAndConditionsUrl = import.meta.env.VITE_TERMS_AND_CONDITIONS_URL

export const AuthenticationMethodCard = ({ onChange = emptyFn }) => (
  <div className="min-h-screen w-full flex items-center justify-center">
    <div
      className="absolute inset-0"
      style={{
        backgroundColor: "#f8fafc",
        backgroundImage:
          "radial-gradient(circle at 0% 0%, #e0f2fe 0%, transparent 45%), radial-gradient(circle at 100% 100%, #dbeafe 0%, transparent 45%)",
      }}
    />

    <div className="relative w-full max-w-[800px] text-center p-8 mx-auto">
      <header className="mb-12">
        <h1 className="text-[40px] font-extrabold text-[#3b82f6] mb-2" style={{ letterSpacing: '-1px' }}>
          {siteConfig.appTitle}
        </h1>
        <p className="text-gray-500 text-base">Select your preferred authentication method to continue</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 place-items-center">
        <div className="bg-white border border-gray-200 rounded-[1.25rem] p-8 flex flex-col items-center text-center max-w-[360px] w-full transform transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-2 hover:border-[#3b82f6]">
          <div className="w-20 h-20 rounded-lg bg-blue-50 flex items-center justify-center text-[#3b82f6] text-[3rem] mb-4">
            <i className="ph ph-shield-checkered" aria-hidden="true" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-800">Auth Token</h3>
          <p className="text-sm text-gray-500 mb-6">Quick access using your Twilio account authentication token.</p>
          <button
            onClick={() => onChange(AuthenticationMethod.AUTH_TOKEN)}
            className="mt-auto bg-gray-100 text-gray-800 px-5 py-2 rounded-xl border-none font-semibold hover:bg-gray-200 focus:outline-none border border-gray-200"
          >
            Select Method
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-[1.25rem] p-8 flex flex-col items-center text-center max-w-[360px] w-full transform transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-2 hover:border-[#3b82f6]">
          <div className="w-20 h-20 rounded-lg bg-blue-50 flex items-center justify-center text-[#3b82f6] text-[3rem] mb-4">
            <i className="ph ph-key" aria-hidden="true" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-800">API Key</h3>
          <p className="text-sm text-gray-500 mb-6">Secure authentication using API Key and Secret credentials.</p>
          <button
            onClick={() => onChange(AuthenticationMethod.API_KEY)}
            className="mt-auto bg-[#3b82f6] text-white px-5 py-2 rounded-xl font-semibold font-size: border-none hover:bg-[#2563eb] focus:outline-none"
          >
            Select Method
          </button>
        </div>
      </div>

      <footer className="text-sm text-gray-500">
        <a href={termsAndConditionsUrl} className="block mb-2 text-[bg-accent] hover:underline">Terms and Conditions</a>
        <p>
          © {new Date().getFullYear()} {siteConfig.footer.creditText} {" "} <br/>
          <a href={siteConfig.footer.companyUrl} className="text-gray-400 italic" target="_blank">{siteConfig.footer.companyName}</a>
        </p>
      </footer>
    </div>
  </div>
)
