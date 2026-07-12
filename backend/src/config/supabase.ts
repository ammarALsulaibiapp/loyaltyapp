import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import ws from 'ws'

// Load environment variables first
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables')
}

// Service role client - has admin access to auth and bypasses RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    // @ts-ignore - Fix for Node.js 18 WebSocket support
    fetch: (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
  },
  realtime: {
    transport: ws as any
  }
})
