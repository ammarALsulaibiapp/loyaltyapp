import express from 'express'
import { supabaseAdmin as supabase } from '../config/supabase'
import googleWalletService from '../services/googleWallet'

const router = express.Router()

// Generate Google Wallet pass URL for a customer
router.get('/google/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params
    
    // Get customer data from Supabase
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select(`
        *,
        businesses!inner(*)
      `)
      .eq('id', customerId)
      .single()

    if (customerError || !customer) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    const business = customer.businesses

    // Prepare customer data for wallet
    const customerWalletData = {
      customerId: customer.id,
      businessId: business.slug,
      businessName: business.name,
      customerName: customer.full_name,
      phoneNumber: customer.phone_number,
      totalVisits: customer.total_visits || 0,
      totalPoints: customer.points_balance || 0,
      membershipTier: customer.membership_tier || 'Bronze',
      qrCode: `${process.env.FRONTEND_URL}/card/${customer.id}`,
      brandColor: business.brand_color,
      logoUrl: business.logo_url
    }

    // Generate Google Wallet URL
    const walletUrl = await googleWalletService.generateWalletUrl(customerWalletData)
    
    res.json({ 
      success: true, 
      addToWalletUrl: walletUrl,
      customerData: customerWalletData
    })

  } catch (error: any) {
    console.error('Google Wallet error:', error)
    res.status(500).json({ 
      error: 'Failed to generate wallet pass',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    })
  }
})

// Create loyalty class for a business (admin only)
router.post('/class/:businessSlug', async (req, res) => {
  try {
    const { businessSlug } = req.params
    
    // Get business data
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('slug', businessSlug)
      .single()

    if (businessError || !business) {
      return res.status(404).json({ error: 'Business not found' })
    }

    // Create loyalty class in Google Wallet
    const result: any = await googleWalletService.createLoyaltyClass(business)
    
    res.json({ 
      success: true, 
      classId: result.id,
      business: business.name 
    })

  } catch (error: any) {
    console.error('Create loyalty class error:', error)
    res.status(500).json({ 
      error: 'Failed to create loyalty class',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    })
  }
})

// Update existing wallet pass (when customer visits/points change)
router.patch('/update/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params
    
    // Get updated customer data
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select(`
        *,
        businesses!inner(*)
      `)
      .eq('id', customerId)
      .single()

    if (customerError || !customer) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    const business = customer.businesses

    const customerWalletData = {
      customerId: customer.id,
      businessId: business.slug,
      businessName: business.name,
      customerName: customer.full_name,
      phoneNumber: customer.phone_number,
      totalVisits: customer.total_visits || 0,
      totalPoints: customer.points_balance || 0,
      membershipTier: customer.membership_tier || 'Bronze',
      qrCode: `${process.env.FRONTEND_URL}/card/${customer.id}`,
      brandColor: business.brand_color,
      logoUrl: business.logo_url
    }

    // Update wallet pass
    const result = await googleWalletService.updateWalletPass(customerWalletData)
    
    res.json({ 
      success: result.success,
      message: result.success ? 'Wallet pass updated' : 'Update failed',
      error: result.error
    })

  } catch (error: any) {
    console.error('Update wallet pass error:', error)
    res.status(500).json({ 
      error: 'Failed to update wallet pass',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    })
  }
})

export default router