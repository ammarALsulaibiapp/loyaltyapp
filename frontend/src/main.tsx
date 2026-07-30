import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './i18n'

// App version - INCREMENT THIS ON EVERY DEPLOY
const APP_VERSION = '1.2.0'

// Unregister any leftover service workers (one-time cleanup)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister()
    })
  })
}

// Version-based cache cleanup (runs once per version change, no reload loop)
const storedVersion = localStorage.getItem('app_version')
if (storedVersion !== APP_VERSION) {
  // Clear old caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name))
    })
  }

  // Clear localStorage except auth data
  const keysToKeep = ['customerToken', 'auth_token', 'language-storage', 'theme-storage', 'sb-auth-token']
  const tempData: Record<string, string> = {}
  keysToKeep.forEach(key => {
    const value = localStorage.getItem(key)
    if (value) tempData[key] = value
  })

  localStorage.clear()

  Object.entries(tempData).forEach(([key, value]) => {
    localStorage.setItem(key, value)
  })

  localStorage.setItem('app_version', APP_VERSION)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

