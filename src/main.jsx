import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import { App } from "./App.jsx"
import { siteConfig } from "./js/siteConfig"

// Set the document title from centralized siteConfig
if (siteConfig?.appTitle) {
  document.title = siteConfig.appTitle + " | Enterprise Messaging"
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
