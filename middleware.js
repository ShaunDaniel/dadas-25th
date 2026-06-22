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
  // Allow social media bots and anyone to fetch the generated OG images
  if (url.pathname.endsWith('.png')) {
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
