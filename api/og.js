import { ImageResponse } from '@vercel/og'

export const config = {
  runtime: 'edge',
}

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url)
    const name = searchParams.get('name')

    if (!name) {
      return new Response('Missing name parameter', { status: 400 })
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#11192F',
            color: '#F1E9DB',
            fontFamily: 'serif',
          }}
        >
          {/* Subtle background decoration */}
          <div
            style={{
              position: 'absolute',
              top: '40px',
              left: '40px',
              right: '40px',
              bottom: '40px',
              border: '1px solid rgba(241, 233, 219, 0.2)',
              borderRadius: '20px',
            }}
          />
          
          <div
            style={{
              fontSize: 42,
              fontWeight: 400,
              opacity: 0.8,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 40,
            }}
          >
            A Silver Jubilee
          </div>
          
          <div
            style={{
              fontSize: 100,
              fontWeight: 600,
              textAlign: 'center',
              lineHeight: 1.2,
              fontStyle: 'italic',
            }}
          >
            An invitation for
            <br />
            {name}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e) {
    console.error(e)
    return new Response('Failed to generate the image', {
      status: 500,
    })
  }
}
