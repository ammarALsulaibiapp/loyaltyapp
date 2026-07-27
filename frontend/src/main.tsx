import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './i18n'

// App version - INCREMENT THIS ON EVERY DEPLOY
const APP_VERSION = '1.0.8'

// FORCE UNREGISTER SERVICE WORKERS - DO THIS IMMEDIATELY
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      console.log('🗑️ Unregistering service worker:', registration.scope)
      registration.unregister()
    })
  })
}

// Check and clear cache if version changed
const storedVersion = localStorage.getItem('app_version')
if (storedVersion !== APP_VERSION) {
  console.log('🔄 New version detected, clearing cache...')
  
  // Clear localStorage (except important data)
  const keysToKeep = ['customer_token', 'auth_token', 'language']
  const tempData: Record<string, string> = {}
  keysToKeep.forEach(key => {
    const value = localStorage.getItem(key)
    if (value) tempData[key] = value
  })
  
  localStorage.clear()
  
  // Restore important data
  Object.entries(tempData).forEach(([key, value]) => {
    localStorage.setItem(key, value)
  })
  
  // Set new version
  localStorage.setItem('app_version', APP_VERSION)
  
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        console.log('🗑️ Deleting cache:', name)
        caches.delete(name)
      })
    })
  }
  
  // Force reload
  setTimeout(() => window.location.reload(), 500)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
