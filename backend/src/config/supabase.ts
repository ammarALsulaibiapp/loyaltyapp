import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables first
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables')
}

// Import ws for Node.js 18 WebSocket support
let websocketConstructor: any = undefined
if (typeof WebSocket === 'undefined') {
  try {
    websocketConstructor = require('ws')
  } catch (e) {
    console.warn('ws package not found, WebSocket features may not work')
  }
}

// Service role client - has admin access to auth and bypasses RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  realtime: websocketConstructor ? {
    transport: websocketConstructor
  } : undefined
})
