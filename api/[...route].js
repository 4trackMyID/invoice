/**
 * Vercel serverless entry point (Node runtime).
 *
 * Vercel maps every /api/* request to this catch-all, and getRequestListener
 * bridges Node's (req, res) pair to the Web Request/Response that Hono expects —
 * so the same `app` also powers the local dev server.
 */
import { getRequestListener } from '@hono/node-server'
import { app } from '../server/app.js'

export const config = { runtime: 'nodejs' }

export default getRequestListener(app.fetch)
