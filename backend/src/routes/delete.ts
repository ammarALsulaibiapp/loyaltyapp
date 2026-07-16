import { Router } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { requireApiKey, requireSuperAdmin } from '../middleware/auth'

const router = Router()

// =====================================================
// DELETE /api/delete/customers
// Bulk delete customers (HARD DELETE)
// =====================================================
router.post('/customers', requireApiKey, async (req, res) => {
  try {
    const { customer_ids } = req.body // Array of customer IDs

    if (!Array.isArray(customer_ids) || customer_ids.length === 0) {
      return res.status(400).json({ error: 'customer_ids array is required' })
    }

    const { error } = await supabaseAdmin
      .from('customers')
      .delete()
      .in('id', customer_ids)

    if (error) {
      console.error('Delete customers error:', error)
      return res.status(500).json({ error: 'Failed to delete customers' })
    }

    res.json({ 
      success: true, 
      message: `${customer_ids.length} customer(s) deleted permanently`,
      deleted_count: customer_ids.length
    })
  } catch (error: any) {
    console.error('Delete customers error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// =====================================================
// DELETE /api/delete/staff
// Bulk delete staff members (HARD DELETE)
// =====================================================
router.post('/staff', requireApiKey, async (req, res) => {
  try {
    const { profile_ids } = req.body // Array of profile IDs

    if (!Array.isArray(profile_ids) || profile_ids.length === 0) {
      return res.status(400).json({ error: 'profile_ids array is required' })
    }

    // Delete from profiles table (staff accounts)
    const { error } = await supabaseAdmin
      .from('profiles')
      .delete()
      .in('id', profile_ids)
      .neq('role', 'super_admin') // Prevent deleting super admin

    if (error) {
      console.error('Delete staff error:', error)
      return res.status(500).json({ error: 'Failed to delete staff' })
    }

    res.json({ 
      success: true, 
      message: `${profile_ids.length} staff member(s) deleted permanently`,
      deleted_count: profile_ids.length
    })
  } catch (error: any) {
    console.error('Delete staff error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// =====================================================
// DELETE /api/delete/loyalty-programs
// Bulk delete loyalty programs (HARD DELETE)
// =====================================================
router.post('/loyalty-programs', requireApiKey, async (req, res) => {
  try {
    const { program_ids } = req.body // Array of program IDs

    if (!Array.isArray(program_ids) || program_ids.length === 0) {
      return res.status(400).json({ error: 'program_ids array is required' })
    }

    const { error } = await supabaseAdmin
      .from('loyalty_programs')
      .delete()
      .in('id', program_ids)

    if (error) {
      console.error('Delete loyalty programs error:', error)
      return res.status(500).json({ error: 'Failed to delete loyalty programs' })
    }

    res.json({ 
      success: true, 
      message: `${program_ids.length} loyalty program(s) deleted permanently`,
      deleted_count: program_ids.length
    })
  } catch (error: any) {
    console.error('Delete loyalty programs error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// =====================================================
// DELETE /api/delete/rewards
// Bulk delete rewards (HARD DELETE)
// =====================================================
router.post('/rewards', requireApiKey, async (req, res) => {
  try {
    const { reward_ids } = req.body // Array of reward IDs

    if (!Array.isArray(reward_ids) || reward_ids.length === 0) {
      return res.status(400).json({ error: 'reward_ids array is required' })
    }

    const { error } = await supabaseAdmin
      .from('rewards')
      .delete()
      .in('id', reward_ids)

    if (error) {
      console.error('Delete rewards error:', error)
      return res.status(500).json({ error: 'Failed to delete rewards' })
    }

    res.json({ 
      success: true, 
      message: `${reward_ids.length} reward(s) deleted permanently`,
      deleted_count: reward_ids.length
    })
  } catch (error: any) {
    console.error('Delete rewards error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// =====================================================
// DELETE /api/delete/businesses
// Bulk delete businesses (CASCADE DELETE - SUPER ADMIN ONLY)
// Deletes: business + staff + programs + rewards
// =====================================================
router.post('/businesses', requireApiKey, requireSuperAdmin, async (req, res) => {
  try {
    const { business_ids } = req.body // Array of business IDs

    if (!Array.isArray(business_ids) || business_ids.length === 0) {
      return res.status(400).json({ error: 'business_ids array is required' })
    }

    // PostgreSQL CASCADE will automatically delete:
    // - profiles (staff) with business_id
    // - loyalty_programs with business_id
    // - rewards with business_id
    // - customers with business_id
    const { error } = await supabaseAdmin
      .from('businesses')
      .delete()
      .in('id', business_ids)

    if (error) {
      console.error('Delete businesses error:', error)
      return res.status(500).json({ error: 'Failed to delete businesses' })
    }

    res.json({ 
      success: true, 
      message: `${business_ids.length} business(es) and all related data deleted permanently`,
      deleted_count: business_ids.length,
      warning: 'All staff, programs, rewards, and customers for these businesses have been removed'
    })
  } catch (error: any) {
    console.error('Delete businesses error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
