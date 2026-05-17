import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { LangProvider } from './contexts/LangContext.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { logError } from './services/errorLogService.js'
import './index.css'

window.addEventListener('unhandledrejection', (event) => {
  logError(event.reason, { type: 'unhandledrejection' })
})

window.addEventListener('error', (event) => {
  if (event.error) logError(event.error, { type: 'global-error' })
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LangProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LangProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
