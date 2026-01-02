import { GithubOutlined, InboxOutlined, SendOutlined, FileTextFilled } from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import { siteConfig } from "../../js/siteConfig"

const termsAndConditionsUrl = import.meta.env.VITE_TERMS_AND_CONDITIONS_URL
const githubUrl = import.meta.env.VITE_GITHUB_URL

const NavItem = ({ className, children, onClick = () => {} }) => (
  <span
    onClick={onClick}
    className={`h-14 flex flex-col justify-center items-center px-4 hover-bg-primary hover:cursor-pointer ${className}`}
  >
    {children}
  </span>
)

const NavBar = () => {
  const navigate = useNavigate()

  const navigateToInbox = () => {
    navigate("/inbox")
  }

  const navigateToSend = () => {
    navigate("/send")
  }

  return (
    <>
      <nav className="flex text-primary px-1 sm:px-4">
        <div className="flex">
          <NavItem onClick={navigateToInbox}>
            <InboxOutlined className="text-lg" />
            <span className="mt-1">Inbox</span>
          </NavItem>
          <NavItem onClick={navigateToSend}>
            <SendOutlined className="text-lg" />
            <span className="mt-1">Send</span>
          </NavItem>
        </div>
        <div className="grow flex justify-center items-center text-lg">{siteConfig.appTitle}</div>
      </nav>
    </>
  )
}

const Footer = () => (
  <div className="w-full py-2 text-primary">
    <span className="block w-full max-w-screen-lg mx-auto flex items-center justify-center text-xs px-2">
      <div className="text-primary text-center">
        {siteConfig.footer.creditText}
        <br />
        <a href={siteConfig.footer.companyUrl} target="_blank" rel="noopener noreferrer" className="underline">
          {siteConfig.footer.companyName}
        </a>
      </div>
    </span>
  </div>
)

export const Layout = ({ children }) => (
  <div className="flex flex-col min-h-full bg-gray-200">
    <div className="bg-primary flex justify-center">
      <span className="block h-14 w-full max-w-screen-lg">
        <NavBar />
      </span>
    </div>
    <div className="grow flex justify-center">
      <span className="block bg-gray-50 w-full max-w-screen-lg pt-1 pb-1 px-1 sm:pt-2 sm:pb-2 sm:px-4">{children}</span>
    </div>
    <div className="bg-primary">
      <Footer />
    </div>
  </div>
)

export const LayoutMinimal = ({ children }) => (
  <div className="bg-gray-200 min-h-screen w-full">
    <div className="block bg-gray-50 w-full pt-1 pb-1 px-1 sm:pt-2 sm:pb-2 sm:px-4">{children}</div>
  </div>
)

export const LayoutWithoutNavBar = ({ children }) => (
  <div className="flex flex-col h-full">
    <div className="flex h-14">
      <div className="bg-primary grow flex justify-center items-center text-lg text-primary">{siteConfig.appTitle}</div>
    </div>
    <div className="flex grow">
      <div className="bg-gray-200 grow"></div>
      <div className="bg-gray-100 w-full max-w-screen-md pt-2 pb-4 px-4">{children}</div>
      <div className="bg-gray-200 grow"></div>
    </div>
    <div className="bg-primary">
      <Footer />
    </div>
  </div>
)
