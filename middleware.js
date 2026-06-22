/**
 * Vercel Edge Middleware
 * ─────────────────────
 * Blocks direct access to /guests/*.bin files.
 * Only allows requests that originate from the site itself (valid Referer).
 */

export const config = {
  matcher: '/guests/:path*',
}

const ALLOWED_ORIGINS = [
  'dadas-25th.vercel.app',
  'localhost',
  '127.0.0.1',
]

export default function middleware(request) {
  const url = new URL(request.url)
  
  // We only want to protect the encrypted binary blobs.
  // Allow all other files (png, jpg, etc.) to pass through natively.
  if (!url.pathname.endsWith('.bin')) {
    return undefined
  }

  const referer = request.headers.get('referer') || ''
  const origin = request.headers.get('origin') || ''

  // Allow if the request comes from our own site
  const source = referer || origin
  const isAllowed = ALLOWED_ORIGINS.some(
    (host) => source.includes(host),
  )

  if (!isAllowed) {
    return new Response('Forbidden', {
      status: 403,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  // Let the request through — Vercel will serve the static file
  return undefined
}
