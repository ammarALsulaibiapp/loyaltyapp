import QRCode from 'qrcode'
import { sha256 } from 'js-sha256'

interface QRCodeData {
  customerId: string
  businessId: string
  timestamp: number
}

// Generate QR code that points to customer card URL
export async function generateCustomerQRCode(customerId: string): Promise<string> {
  // Create the URL that the QR code should point to
  const cardUrl = `${window.location.origin}/card/${customerId}`
  
  try {
    const qrCodeDataURL = await QRCode.toDataURL(cardUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
    return qrCodeDataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw error
  }
}

// For signup QR codes pointing to business signup page
export async function generateBusinessSignupQRCode(businessSlug: string): Promise<string> {
  const signupUrl = `${window.location.origin}/signup?business=${businessSlug}`
  
  try {
    const qrCodeDataURL = await QRCode.toDataURL(signupUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
    return qrCodeDataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw error
  }
}

export function generateSecureToken(businessId: string, phoneNumber: string): string {
  const data = `${businessId}:${phoneNumber}:${Date.now()}`
  return sha256(data)
}

export function parseQRCode(qrHash: string): QRCodeData | null {
  try {
    // In production, you would verify the hash against your database
    // This is a simplified version
    return null
  } catch (error) {
    console.error('Error parsing QR code:', error)
    return null
  }
}
