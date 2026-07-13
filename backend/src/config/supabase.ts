import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables first
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!



// Import ws for Node.js 18 WebSocket support
let websocketConstructor: any = undefined
if (typeof WebSocket === 'undefined') {
  try {
    websocketConstructor = require('ws')
  } catch (e) {
    console.warn('ws package not found, WebSocket features may not work')
  }
}

let supabaseAdminInstance: any = null

if (supabaseUrl && supabaseServiceRoleKey) {
  supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    realtime: websocketConstructor ? {
      transport: websocketConstructor
    } : undefined
  })
} else {
  console.error('❌ CRITICAL CONFIGURATION ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables are missing on the server! Database queries will fail.');
  
  // Create a dummy proxy object so imports don't crash but operations fail gracefully
  supabaseAdminInstance = new Proxy({}, {
    get: () => {
      throw new Error('Supabase client is unconfigured. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to environment variables.');
    }
  });
}

export const supabaseAdmin = supabaseAdminInstance
