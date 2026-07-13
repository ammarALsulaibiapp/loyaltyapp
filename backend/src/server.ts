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

// CORS - MUST BE BEFORE ROUTES
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Handle preflight
app.options('*', cors())

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
