import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '../config/supabase'

const router = Router()

const JWT_SECRET = process.env.CUSTOMER_JWT_SECRET || process.env.API_SECRET_KEY || 'fallback-secret-change-me'
const SALT_ROUNDS = 12

// =====================================================
// POST /api/customer-auth/register
// Register a new customer account (phone + name + password)
// =====================================================
router.post('/register', async (req, res) => {
  try {
    const { phone_number, full_name, password } = req.body

    // Validate required fields
    if (!phone_number || !full_name || !password) {
      return res.status(400).json({ error: 'Phone number, full name, and password are required' })
    }

    // Validate phone number format (at least 8 digits)
    const cleanPhone = phone_number.replace(/\s/g, '')
    if (cleanPhone.length < 8) {
      return res.status(400).json({ error: 'Phone number must be at least 8 digits' })
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    // Validate name
    if (full_name.trim().length < 2) {
      return res.status(400).json({ error: 'Full name must be at least 2 characters' })
    }

    // Check if phone number is already registered
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('customer_accounts')
      .select('id')
      .eq('phone_number', cleanPhone)
      .maybeSingle()

    if (checkError) {
      console.error('Check existing account error:', checkError)
      return res.status(500).json({ error: 'Database error during registration' })
    }

    if (existing) {
      return res.status(409).json({ error: 'An account with this phone number already exists. Please login instead.' })
    }

    // Hash the password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS)

    // Insert the new customer account
    const { data: account, error: insertError } = await supabaseAdmin
      .from('customer_accounts')
      .insert({
        phone_number: cleanPhone,
        full_name: full_name.trim(),
        password_hash
      })
      .select('id, phone_number, full_name, created_at')
      .single()

    if (insertError) {
      console.error('Insert customer account error:', insertError)
      return res.status(500).json({ error: 'Failed to create account' })
    }

    // Generate JWT token (default 7 days)
    const token = jwt.sign(
      {
        id: account.id,
        phone_number: account.phone_number,
        full_name: account.full_name,
        type: 'customer'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      success: true,
      token,
      customer: {
        id: account.id,
        phone_number: account.phone_number,
        full_name: account.full_name
      }
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// =====================================================
// POST /api/customer-auth/login
// Login with phone + password → JWT
// =====================================================
router.post('/login', async (req, res) => {
  try {
    const { phone_number, password, remember_me } = req.body

    // Validate required fields
    if (!phone_number || !password) {
      return res.status(400).json({ error: 'Phone number and password are required' })
    }

    const cleanPhone = phone_number.replace(/\s/g, '')

    // Find the account
    const { data: account, error: findError } = await supabaseAdmin
      .from('customer_accounts')
      .select('id, phone_number, full_name, password_hash')
      .eq('phone_number', cleanPhone)
      .maybeSingle()

    if (findError) {
      console.error('Find account error:', findError)
      return res.status(500).json({ error: 'Database error during login' })
    }

    if (!account) {
      return res.status(401).json({ error: 'Invalid phone number or password' })
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, account.password_hash)
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid phone number or password' })
    }

    // Generate JWT token
    const expiresIn = remember_me ? '30d' : '7d'
    const token = jwt.sign(
      {
        id: account.id,
        phone_number: account.phone_number,
        full_name: account.full_name,
        type: 'customer'
      },
      JWT_SECRET,
      { expiresIn }
    )

    res.json({
      success: true,
      token,
      customer: {
        id: account.id,
        phone_number: account.phone_number,
        full_name: account.full_name
      }
    })
  } catch (error: any) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// =====================================================
// GET /api/customer-auth/me
// Validate JWT → return customer profile + all loyalty cards
// =====================================================
router.get('/me', async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]

    // Verify JWT
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired. Please login again.' })
      }
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Ensure it's a customer token
    if (decoded.type !== 'customer') {
      return res.status(403).json({ error: 'Invalid token type' })
    }

    // Fetch the customer account to confirm it still exists
    const { data: account, error: accountError } = await supabaseAdmin
      .from('customer_accounts')
      .select('id, phone_number, full_name')
      .eq('id', decoded.id)
      .single()

    if (accountError || !account) {
      return res.status(401).json({ error: 'Account not found' })
    }

    // Fetch all loyalty cards for this phone number across all businesses
    const { data: cards, error: cardsError } = await supabaseAdmin
      .from('customers')
      .select(`
        id,
        phone_number,
        full_name,
        total_visits,
        total_points,
        total_spent,
        membership_tier,
        qr_code,
        businesses (
          id,
          name,
          logo_url,
          brand_color,
          description
        )
      `)
      .eq('phone_number', account.phone_number)
      .eq('is_active', true)

    if (cardsError) {
      console.error('Fetch cards error:', cardsError)
    }

    // For each card, fetch active loyalty programs to compute next reward
    const cardsWithProgress = await Promise.all(
      (cards || []).map(async (card: any) => {
        if (!card.businesses) return card

        const { data: programs } = await supabaseAdmin
          .from('loyalty_programs')
          .select('*')
          .eq('business_id', card.businesses.id)
          .eq('is_active', true)
          .limit(1)

        let next_reward: string | undefined
        let visits_to_reward: number | undefined

        if (programs && programs.length > 0) {
          const program = programs[0]
          next_reward = program.reward_name

          if (program.type === 'visit_based' && program.required_visits) {
            visits_to_reward = program.required_visits - (card.total_visits % program.required_visits)
          } else if (program.type === 'stamp_card' && program.required_stamps) {
            visits_to_reward = program.required_stamps - (card.total_visits % program.required_stamps)
          } else if (program.type === 'points_based' && program.points_for_reward) {
            visits_to_reward = program.points_for_reward - (card.total_points % program.points_for_reward)
          }
        }

        return { ...card, next_reward, visits_to_reward }
      })
    )

    res.json({
      success: true,
      customer: {
        id: account.id,
        phone_number: account.phone_number,
        full_name: account.full_name
      },
      cards: cardsWithProgress
    })
  } catch (error: any) {
    console.error('/me error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
