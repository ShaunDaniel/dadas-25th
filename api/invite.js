import guests from '../src/data/guests.json'

export const config = {
  runtime: 'edge',
}

export default async function handler(req) {
  try {
    const url = new URL(req.url)
    const slug = url.pathname.slice(1) // Remove leading slash

    // By default, just serve index.html (SPA fallback)
    // Fetch the root index.html from the current deployment
    const rootUrl = new URL('/index.html', req.url)
    const response = await fetch(rootUrl)
    let html = await response.text()

    if (guests[slug]) {
      const name = guests[slug].name
      const ogUrl = new URL(`/api/og?name=${encodeURIComponent(name)}`, req.url).toString()
      
      html = html.replace(
        'content="https://dadas-25th.vercel.app/og.png"',
        `content="${ogUrl}"`
      )
      html = html.replace(
        'content="Dada\'s 25th — A Silver Jubilee"',
        `content="An invitation for ${name} — Dada's 25th"`
      )
      
      // Also update the twitter:image
      html = html.replace(
        '<meta name="twitter:image" content="https://dadas-25th.vercel.app/og.png" />',
        `<meta name="twitter:image" content="${ogUrl}" />`
      )
    }

    return new Response(html, {
      status: 200,
      headers: { 
        'Content-Type': 'text/html; charset=utf-8', 
        'Cache-Control': 's-maxage=60, stale-while-revalidate' 
      },
    })
  } catch (err) {
    console.error('Invite handler error:', err)
    return new Response('Internal Server Error', { status: 500 })
  }
}
