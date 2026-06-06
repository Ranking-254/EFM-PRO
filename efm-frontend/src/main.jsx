import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import * as Sentry from "@sentry/react"; // 🚀 Import Sentry Frontend SDK

// Initialize Frontend Sentry Tracking
Sentry.init({
  dsn: "https://2ae8f82cb5c64c8b2a1319d205284bd8@o4511517333389312.ingest.de.sentry.io/4511517405741136", // 🔑 Paste your React project DSN link here
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of frontend transactions for launch stability
  // Session Replays
  replaysSessionSampleRate: 0.1, // Sample 10% of standard user sessions
  replaysOnErrorSampleRate: 1.0, // If a user hits a UI crash, record 100% of the session leading to it
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)