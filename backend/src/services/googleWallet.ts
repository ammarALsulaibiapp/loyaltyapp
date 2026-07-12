import { GoogleAuth } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'

interface CustomerWalletData {
  customerId: string
  businessId: string
  businessName: string
  customerName: string
  phoneNumber: string
  totalVisits: number
  totalPoints: number
  membershipTier: string
  qrCode: string
  brandColor: string
  logoUrl?: string
}

class GoogleWalletService {
  private auth: GoogleAuth
  private issuerId: string

  constructor() {
    // Load service account key
    const keyPath = path.join(__dirname, '../config/google-wallet-key.json')
    
    this.auth = new GoogleAuth({
      keyFile: keyPath,
      scopes: ['https://www.googleapis.com/auth/wallet_object.issuer']
    })
    
    // Your Google Cloud Project ID (replace with actual)
    this.issuerId = process.env.GOOGLE_WALLET_ISSUER_ID || 'your-project-id'
  }

  /**
   * Create loyalty class (template) for a business
   */
  async createLoyaltyClass(businessData: any) {
    const classId = `${this.issuerId}.${businessData.slug}`
    
    const loyaltyClass = {
      id: classId,
      classTemplateInfo: {
        cardTemplateOverride: {
          cardRowTemplateInfos: [
            {
              twoItems: {
                startItem: {
                  firstValue: {
                    fields: [{
                      fieldPath: 'object.textModulesData.visits'
                    }]
                  }
                },
                endItem: {
                  firstValue: {
                    fields: [{
                      fieldPath: 'object.textModulesData.points'
                    }]
                  }
                }
              }
            }
          ]
        }
      },
      issuerName: businessData.name,
      programName: `${businessData.name} Loyalty`,
      programLogo: businessData.logoUrl ? {
        sourceUri: { uri: businessData.logoUrl }
      } : undefined,
      hexBackgroundColor: businessData.brandColor?.replace('#', '') || '0ea5e9',
      localizedIssuerName: {
        defaultValue: {
          language: 'en-US',
          value: businessData.name
        }
      },
      localizedProgramName: {
        defaultValue: {
          language: 'en-US', 
          value: `${businessData.name} Loyalty Program`
        }
      }
    }

    try {
      const client = await this.auth.getClient()
      const response = await client.request({
        url: `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass`,
        method: 'POST',
        data: loyaltyClass
      })
      
      return response.data
    } catch (error: any) {
      if (error.response?.status === 409) {
        // Class already exists, that's OK
        console.log(`Loyalty class ${classId} already exists`)
        return { id: classId }
      }
      throw error
    }
  }

  /**
   * Generate Google Wallet "Add to Wallet" URL for a customer
   */
  async generateWalletUrl(customerData: CustomerWalletData): Promise<string> {
    const classId = `${this.issuerId}.${customerData.businessId}`
    const objectId = `${this.issuerId}.${customerData.customerId}`

    const loyaltyObject = {
      id: objectId,
      classId: classId,
      state: 'ACTIVE',
      
      // Customer info
      accountName: customerData.customerName || 'Valued Customer',
      accountId: customerData.customerId,
      
      // Loyalty points
      loyaltyPoints: {
        balance: {
          int: customerData.totalPoints || 0
        },
        label: 'Points'
      },
      
      // QR Code for scanning
      barcode: {
        type: 'QR_CODE',
        value: customerData.qrCode,
        alternateText: customerData.phoneNumber
      },
      
      // Text modules (displayed on card)
      textModulesData: [
        {
          id: 'visits',
          header: 'VISITS',
          body: customerData.totalVisits.toString()
        },
        {
          id: 'points', 
          header: 'POINTS',
          body: customerData.totalPoints.toString()
        },
        {
          id: 'tier',
          header: 'TIER',
          body: customerData.membershipTier.toUpperCase()
        },
        {
          id: 'phone',
          header: 'MEMBER ID', 
          body: customerData.phoneNumber
        }
      ],
      
      // Links
      linksModuleData: {
        uris: [
          {
            uri: `${process.env.FRONTEND_URL}/card/${customerData.customerId}`,
            description: 'View Full Card',
            id: 'view_card'
          }
        ]
      }
    }

    // Create signed JWT
    const claims = {
      iss: process.env.GOOGLE_WALLET_SERVICE_EMAIL,
      aud: 'google',
      typ: 'savetowallet',
      payload: {
        loyaltyObjects: [loyaltyObject]
      }
    }

    // Load private key from service account
    const keyFile = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../config/google-wallet-key.json'), 
      'utf8'
    ))
    
    const token = jwt.sign(claims, keyFile.private_key, {
      algorithm: 'RS256',
      expiresIn: '1h'
    })

    return `https://pay.google.com/gp/v/save/${token}`
  }

  /**
   * Update existing wallet pass (when customer earns points/visits)
   */
  async updateWalletPass(customerData: CustomerWalletData) {
    const objectId = `${this.issuerId}.${customerData.customerId}`
    
    const updateData = {
      loyaltyPoints: {
        balance: { int: customerData.totalPoints },
        label: 'Points'
      },
      textModulesData: [
        {
          id: 'visits',
          header: 'VISITS', 
          body: customerData.totalVisits.toString()
        },
        {
          id: 'points',
          header: 'POINTS',
          body: customerData.totalPoints.toString() 
        },
        {
          id: 'tier',
          header: 'TIER',
          body: customerData.membershipTier.toUpperCase()
        }
      ]
    }

    try {
      const client = await this.auth.getClient()
      await client.request({
        url: `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${objectId}`,
        method: 'PATCH',
        data: updateData
      })
      
      return { success: true }
    } catch (error) {
      console.error('Failed to update wallet pass:', error)
      return { success: false, error }
    }
  }
}

export default new GoogleWalletService()