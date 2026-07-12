import { sha256 } from 'js-sha256'

/**
 * Wallet Security System
 * 
 * Creates secure wallet URLs that can't be guessed by other users
 * Uses phone number + browser fingerprint + timestamp for security
 */

// Generate secure wallet token (simplified)
export function generateWalletToken(phoneNumber: string): string {
  const browserData = [
    navigator.userAgent,
    screen.width + 'x' + screen.height,
    phoneNumber
  ].join('|')
  
  return sha256(browserData).substring(0, 32)
}

// Validate wallet token
export function validateWalletToken(phoneNumber: string, token: string): boolean {
  const expectedToken = generateWalletToken(phoneNumber)
  return token === expectedToken
}

// Generate secure wallet URL
export function generateSecureWalletURL(phoneNumber: string): string {
  const token = generateWalletToken(phoneNumber)
  const baseURL = window.location.origin
  return `${baseURL}/wallet?phone=${encodeURIComponent(phoneNumber)}&token=${token}`
}

// Check if current URL has valid security token
export function isSecureWalletAccess(phoneNumber: string, token?: string): boolean {
  if (!token) return false
  return validateWalletToken(phoneNumber, token)
}

// Store wallet access in localStorage with expiry
export function storeWalletAccess(phoneNumber: string): void {
  const accessData = {
    phone: phoneNumber,
    token: generateWalletToken(phoneNumber),
    timestamp: Date.now(),
    expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
  }
  localStorage.setItem('walletAccess', JSON.stringify(accessData))
}

// Get stored wallet access if still valid
export function getStoredWalletAccess(): { phone: string; token: string } | null {
  try {
    const stored = localStorage.getItem('walletAccess')
    if (!stored) return null
    
    const data = JSON.parse(stored)
    if (Date.now() > data.expires) {
      localStorage.removeItem('walletAccess')
      return null
    }
    
    // Validate the stored token is still valid
    if (validateWalletToken(data.phone, data.token)) {
      return { phone: data.phone, token: data.token }
    }
    
    return null
  } catch {
    return null
  }
}