/**
 * Vercel serverless entry point (Node runtime).
 *
 * One flat function for the whole API; `vercel.json` rewrites every `/api/*`
 * path here (`{"source": "/api/(.*)", "destination": "/api"}`). The request
 * still reaches Hono with its original path, so the routes in server/app.js
 * are declared with their full `/api/...` names.
 *
 * Why not `api/[...route].js`: catch-all filenames are a Next.js router
 * feature. Outside Next.js, Vercel reads `[...route]` as a dynamic segment
 * *named* `...route` — exactly one path segment — so `/api/health` reached
 * this function while `/api/invoice/download` was answered by Vercel's own
 * 404 before any code ran. The rewrite is what closes that gap.
 */
import { handle } from 'hono/vercel'
import { app } from '../server/app.js'

export const config = { runtime: 'nodejs' }

// The Web Standard `fetch` export, not a Node `(req, res)` bridge: Vercel's
// Node runtime consumes the request stream to expose its own `request.body`
// helper, so a `getRequestListener(app.fetch)` bridge saw an already-drained
// body and every multipart POST failed to parse. `handle()` is Hono's
// supported adapter and hands Hono the untouched Request.
export default { fetch: handle(app) }
