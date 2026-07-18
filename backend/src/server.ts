import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import customerAuthRoutes from './routes/customerAuth'
import walletRoutes from './routes/wallet'
import notificationRoutes from './routes/notifications'
import deleteRoutes from './routes/delete'
import aiRetentionRoutes from './routes/aiRetention'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Trust Railway proxy (fix for rate limiter)
app.set('trust proxy', 1)

// CORS - Allow all origins
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type']
}))

// Handle preflight
app.options('*', cors())

// Security middleware - AFTER CORS - Relaxed for production
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}))

// Rate limiting - SKIP OPTIONS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => req.method === 'OPTIONS'
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
app.use('/api/notifications', notificationRoutes)
app.use('/api/delete', deleteRoutes)
app.use('/api/ai-retention', aiRetentionRoutes)

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

// Start server
const PORT_NUM = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001

const server = app.listen(PORT_NUM, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT_NUM}`)
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`✅ CORS: Allowing ALL origins`)
  console.log(`🎯 Listening on all interfaces (0.0.0.0)`)
})

// Handle server errors
server.on('error', (error: any) => {
  console.error('❌ Server error:', error)
  process.exit(1)
})
