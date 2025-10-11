import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { toExpressHandler } from '@bloom/adapters-v2/express'
import { auth } from './lib/auth.js'

const app = express()
const PORT = process.env.PORT || 5002

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())

// Bloom Auth routes (handles /auth/*)
app.use('/auth/*', toExpressHandler({ auth }))

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Error]', err)
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`)
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`[Server] Auth routes: http://localhost:${PORT}/auth/*`)
})
