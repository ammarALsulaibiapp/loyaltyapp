// Apple Wallet and Google Wallet integration utilities

interface WalletCardData {
  customerId: string
  customerName: string
  businessName: string
  businessLogo: string
  qrCode: string
  points: number
  visits: number
  membershipTier: string
  brandColor: string
}

/**
 * Generate Apple Wallet Pass (.pkpass)
 * 
 * NOTE: In production, this should be done server-side with proper signing
 * You'll need:
 * 1. Apple Developer Account
 * 2. Pass Type ID
 * 3. Team ID
 * 4. Signing certificate
 * 
 * For now, this returns the data structure needed
 */
export function generateAppleWalletPass(data: WalletCardData) {
  const passData = {
    formatVersion: 1,
    passTypeIdentifier: 'pass.com.loyaltypass.card', // Register with Apple
    serialNumber: data.customerId,
    teamIdentifier: 'YOUR_TEAM_ID', // Your Apple Team ID
    organizationName: data.businessName,
    description: `${data.businessName} Loyalty Card`,
    
    // Visual appearance
    logoText: data.businessName,
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: data.brandColor,
    labelColor: 'rgb(255, 255, 255)',
    
    // Card type - loyalty card
    storeCard: {
      primaryFields: [
        {
          key: 'points',
          label: 'Points',
          value: data.points.toString(),
        },
      ],
      secondaryFields: [
        {
          key: 'visits',
          label: 'Visits',
          value: data.visits.toString(),
        },
        {
          key: 'tier',
          label: 'Tier',
          value: data.membershipTier,
        },
      ],
      auxiliaryFields: [
        {
          key: 'customer',
          label: 'Member',
          value: data.customerName,
        },
      ],
      backFields: [
        {
          key: 'terms',
          label: 'Terms and Conditions',
          value: 'Visit our website for full terms and conditions.',
        },
      ],
    },
    
    // Barcode/QR Code
    barcodes: [
      {
        message: data.qrCode,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
      },
    ],
    
    // Auto-update
    webServiceURL: 'https://your-api.com/wallet',
    authenticationToken: data.qrCode,
  }

  return passData
}

/**
 * Generate Google Wallet Pass
 * 
 * NOTE: In production, use Google Wallet API
 * You'll need:
 * 1. Google Cloud Project
 * 2. Google Wallet API enabled
 * 3. Service account credentials
 * 
 * Documentation: https://developers.google.com/wallet
 */
export function generateGoogleWalletPass(data: WalletCardData) {
  const passData = {
    id: `${data.businessName.toLowerCase().replace(/\s+/g, '-')}.${data.customerId}`,
    classId: `${data.businessName.toLowerCase().replace(/\s+/g, '-')}.loyalty`,
    
    // Loyalty class
    loyaltyClass: {
      id: `${data.businessName.toLowerCase().replace(/\s+/g, '-')}.loyalty`,
      issuerName: data.businessName,
      programName: `${data.businessName} Loyalty`,
      programLogo: {
        sourceUri: {
          uri: data.businessLogo,
        },
      },
    },
    
    // Loyalty object
    loyaltyObject: {
      id: `${data.businessName.toLowerCase().replace(/\s+/g, '-')}.${data.customerId}`,
      classId: `${data.businessName.toLowerCase().replace(/\s+/g, '-')}.loyalty`,
      state: 'ACTIVE',
      
      accountName: data.customerName,
      accountId: data.customerId,
      
      loyaltyPoints: {
        label: 'Points',
        balance: {
          int: data.points,
        },
      },
      
      secondaryLoyaltyPoints: {
        label: 'Visits',
        balance: {
          int: data.visits,
        },
      },
      
      barcode: {
        type: 'QR_CODE',
        value: data.qrCode,
      },
      
      hexBackgroundColor: data.brandColor.replace('#', ''),
      
      textModulesData: [
        {
          header: 'MEMBERSHIP TIER',
          body: data.membershipTier.toUpperCase(),
        },
      ],
    },
  }

  return passData
}

/**
 * Generate Google Wallet "Add to Wallet" URL
 */
export function generateGoogleWalletUrl(passData: any): string {
  const jwt = btoa(JSON.stringify(passData)) // In production, use proper JWT signing
  return `https://pay.google.com/gp/v/save/${jwt}`
}

/**
 * Check if device supports Apple Wallet
 */
export function supportsAppleWallet(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

/**
 * Check if device supports Google Wallet
 */
export function supportsGoogleWallet(): boolean {
  return /Android/.test(navigator.userAgent)
}

/**
 * Update wallet pass (triggers push notification to user's device)
 * This should be called whenever customer data changes (points, visits, etc.)
 */
export async function updateWalletPass(
  customerId: string,
  updates: Partial<WalletCardData>
): Promise<void> {
  // In production, this would call your backend API
  // which then calls Apple/Google APIs to push updates
  console.log('Updating wallet pass for customer:', customerId, updates)
  
  // Backend would:
  // 1. Update pass data in database
  // 2. Send push notification to Apple/Google
  // 3. User's wallet app auto-updates the card
}
