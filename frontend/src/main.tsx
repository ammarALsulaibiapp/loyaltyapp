import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './i18n'
import { registerSW } from 'virtual:pwa-register'

// App version - INCREMENT THIS ON EVERY DEPLOY
const APP_VERSION = '1.0.5'

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
      names.forEach(name => caches.delete(name))
    })
  }
  
  // Force reload
  window.location.reload()
}

// Register service worker with auto-update
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('🔄 New version available! Click OK to update now.')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('✅ App ready to work offline')
  },
  immediate: true,
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
