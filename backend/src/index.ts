import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { requireAuth, requireAdmin } from './middleware/auth'
import clientsRouter from './routes/clients'
import reportsRouter from './routes/reports'
import objectivesRouter from './routes/objectives'
import tasksRouter from './routes/tasks'
import dashboardRouter from './routes/dashboard'
import { env } from './config/env'

const app: Express = express()
const port = Number(env.PORT)

// Middleware
app.use(cors())
app.use(express.json())

// ============ Routes ============

// Health check (public)
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

// Admin routes - client management
app.use('/api/clients', requireAuth, requireAdmin, clientsRouter)

// Admin routes - report generation and management
app.use('/api/reports', requireAuth, requireAdmin, reportsRouter)

// Admin routes - objectives management
app.use('/api/clients', requireAuth, requireAdmin, objectivesRouter)

// Mixed auth routes - tasks
// POST /api/clients/:id/tasks (admin only)
// PATCH /api/tasks/:id/complete (client only - checks ownership)
app.use('/api', requireAuth, tasksRouter)

// Client routes - dashboard
app.use('/api/me', requireAuth, dashboardRouter)

// ============ Error Handling ============

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[error] Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' })
})

// Start server
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`)
})
