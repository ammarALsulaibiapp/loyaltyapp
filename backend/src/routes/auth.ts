import { Router } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { requireApiKey, requireSuperAdmin } from '../middleware/auth'

const router = Router()

// Create business owner account
router.post('/create-business-owner', requireApiKey, requireSuperAdmin, async (req, res) => {
  try {
    console.log('Create business owner request:', req.body)
    const { email, password, full_name, business_id } = req.body

    if (!email || !password || !business_id) {
      console.log('Missing required fields')
      return res.status(400).json({ error: 'Missing required fields' })
    }

    let userId: string | null = null

    // Step 1: Try to create user in auth
    console.log('Attempting to create user in auth...')
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || 'Business Owner',
        role: 'business_admin'
      }
    })

    if (authError) {
      if (authError.message.includes('already been registered') || authError.code === 'email_exists') {
        console.log('User already exists, will just update profile and password')
        // User exists - get ID from profiles OR from database function
        const { data: profileData } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle()
        
        if (profileData) {
          userId = profileData.id
          console.log('Found user ID from profiles:', userId)
        } else {
          console.log('Profile not found, querying auth.users via RPC')
          // Use RPC function to get user ID from auth.users
          const { data: userIdData, error: rpcError } = await supabaseAdmin
            .rpc('get_user_id_by_email', { user_email: email })
          
          if (userIdData) {
            userId = userIdData
            console.log('Found user ID from auth.users:', userId)
          } else {
            console.log('Could not find user anywhere:', rpcError)
          }
        }
      } else {
        console.error('Auth creation error:', authError)
        return res.status(400).json({ error: authError.message })
      }
    } else {
      userId = authData.user.id
      console.log('New user created in auth:', userId)
    }

    // Step 2: If we found a user ID, update password
    if (userId) {
      console.log('Updating password for user:', userId)
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password })
      if (passwordError) {
        console.error('Password update error:', passwordError)
      } else {
        console.log('Password updated successfully')
      }

      // Step 3: Upsert profile
      console.log('Upserting profile...')
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          full_name: full_name || 'Business Owner',
          role: 'business_admin',
          business_id: business_id,
          is_active: true,
          email: email
        }, {
          onConflict: 'id'
        })

      if (profileError) {
        console.error('Profile upsert error:', profileError)
        return res.status(400).json({ error: profileError.message })
      }

      console.log('Success! Profile upserted')
      return res.json({
        success: true,
        user_id: userId,
        email: email
      })
    } else {
      // No user ID found - this means user exists but we can't find them
      // Just update the profile by email
      console.log('Could not get user ID, updating profile by email only')
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: full_name || 'Business Owner',
          role: 'business_admin',
          business_id: business_id,
          is_active: true
        })
        .eq('email', email)

      if (profileError) {
        console.error('Profile update error:', profileError)
        return res.status(400).json({ error: 'User exists but could not update profile: ' + profileError.message })
      }

      return res.json({
        success: true,
        email: email,
        message: 'Profile updated (user already existed)'
      })
    }
  } catch (error: any) {
    console.error('Unexpected error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create staff account
router.post('/create-staff', requireApiKey, async (req, res) => {
  try {
    const { email, password, full_name, phone_number, business_id, requester_role } = req.body

    if (!email || !password || !business_id) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (requester_role !== 'business_admin' && requester_role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden: Business admin access required' })
    }

    let userId: string | null = null

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || 'Staff Member',
        role: 'staff'
      }
    })

    if (authError) {
      if (authError.message.includes('already been registered') || authError.code === 'email_exists') {
        const { data: profileData } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle()
        
        if (profileData) {
          userId = profileData.id
          await supabaseAdmin.auth.admin.updateUserById(userId, { password })
        }
      } else {
        return res.status(400).json({ error: authError.message })
      }
    } else {
      userId = authData.user.id
    }

    if (userId) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          full_name: full_name || 'Staff Member',
          phone_number: phone_number || null,
          role: 'staff',
          business_id: business_id,
          is_active: true,
          email: email
        }, {
          onConflict: 'id'
        })

      if (profileError) {
        return res.status(400).json({ error: profileError.message })
      }

      res.json({
        success: true,
        user_id: userId,
        email: email
      })
    } else {
      res.json({
        success: true,
        email: email,
        message: 'User updated'
      })
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Reset user password
router.post('/reset-password', requireApiKey, async (req, res) => {
  try {
    const { user_id, new_password, requester_role } = req.body

    if (!user_id || !new_password) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (requester_role !== 'business_admin' && requester_role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { password: new_password }
    )

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Update user email
router.post('/update-email', requireApiKey, async (req, res) => {
  try {
    const { user_id, new_email, requester_role } = req.body

    if (!user_id || !new_email) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (requester_role !== 'business_admin' && requester_role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { 
        email: new_email,
        email_confirm: true 
      }
    )

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    await supabaseAdmin
      .from('profiles')
      .update({ email: new_email })
      .eq('id', user_id)

    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Delete user
router.post('/delete-user', requireApiKey, requireSuperAdmin, async (req, res) => {
  try {
    const { user_id } = req.body

    if (!user_id) {
      return res.status(400).json({ error: 'Missing user_id' })
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
