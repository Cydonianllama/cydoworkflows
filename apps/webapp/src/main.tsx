import { AuthProvider } from "@cydo/auth/client"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { App } from "./App"
import { ConfirmProvider } from "./features/confirm/ConfirmProvider"
import { NotificationListener } from "./features/notification/NotificationListener"
import { ThemeProvider } from "./features/theme/ThemeProvider"
import { ThemedToaster } from "./features/theme/ThemedToaster"
import { authClient } from "./setup/authClient"
import "./index.css"

const container = document.getElementById("root")
if (!container) throw new Error("No se encontró el nodo #root")

createRoot(container).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider client={authClient}>
          <ConfirmProvider>
            <NotificationListener />
            <App />
            <ThemedToaster />
          </ConfirmProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
