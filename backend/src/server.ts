import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import customerAuthRoutes from './routes/customerAuth'
import walletRoutes from './routes/wallet'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet())

// CORS - allow multiple origins (normalizing to extract pure origins, e.g. stripping paths like /login or trailing slashes)
const allowedOrigins = (process.env.FRONTEND_URL?.split(',') || ['*']).map(url => {
  try {
    const trimmed = url.trim()
    if (trimmed === '*') return '*'
    const parsed = new URL(trimmed)
    return parsed.origin
  } catch {
    return url.trim()
  }
})

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      console.warn(`⚠️ CORS blocked request from origin: ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(null, false)
    }
  },
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
app.use(limiter)

// Body parser
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/customer-auth', customerAuthRoutes)
app.use('/api/wallet', walletRoutes)

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

// Start server
const PORT_NUM = process.env.PORT && process.env.PORT.trim() !== '' ? parseInt(process.env.PORT, 10) : 3001

app.listen(PORT_NUM, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT_NUM}`)
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`)
})
