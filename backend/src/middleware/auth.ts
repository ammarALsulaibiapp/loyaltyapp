import { Request, Response, NextFunction } from 'express'

// Simple API key authentication
export const requireApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key']
  
  // Support both API_KEY and API_SECRET_KEY for backwards compatibility
  const validKey = process.env.API_SECRET_KEY || process.env.API_KEY
  
  if (!apiKey || apiKey !== validKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API key' })
  }
  
  next()
}

// Verify super admin role from request body
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const { requester_role } = req.body
  
  if (requester_role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden: Super admin access required' })
  }
  
  next()
}
