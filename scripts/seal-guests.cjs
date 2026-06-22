/**
 * seal-guests.cjs
 * ───────────────
 * Build-time script that encrypts guest images so the public repo
 * only ever contains opaque .bin blobs with hashed filenames.
 *
 * Usage:  GUEST_SECRET=<key> node scripts/seal-guests.cjs
 *
 * Reads:   private/guests/*            (raw photos — gitignored)
 *          src/data/guests.json        (guest registry)
 *
 * Writes:  public/guests/<hash>.bin    (AES-256-GCM encrypted blobs)
 *          src/data/.guest-map.json    (slug → { hash, iv } — gitignored,
 *                                       but bundled into the JS by Vite)
 */

// ── Imports ────────────────────────────────────────────────────────
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const satori = require('satori').default || require('satori')
const { Resvg } = require('@resvg/resvg-js')
const { html } = require('satori-html')

const ROOT = path.resolve(__dirname, '..')
const PRIVATE_DIR = path.join(ROOT, 'private', 'guests')
const PUBLIC_DIR = path.join(ROOT, 'public', 'guests')
const GUESTS_JSON = path.join(ROOT, 'src', 'data', 'guests.json')
const MAP_OUT = path.join(ROOT, 'src', 'data', '.guest-map.json')

// ── Secret key ──────────────────────────────────────────────────
// In CI / Vercel: set GUEST_SECRET env var.
// Locally: you can also create a .env.local with GUEST_SECRET=...
const SECRET = process.env.GUEST_SECRET
if (!SECRET) {
  // For local dev convenience, generate a deterministic key from a local file
  // if it exists, otherwise create one.
  const keyFile = path.join(ROOT, '.guest-key')
  let localKey
  if (fs.existsSync(keyFile)) {
    localKey = fs.readFileSync(keyFile, 'utf-8').trim()
  } else {
    localKey = crypto.randomBytes(32).toString('hex')
    fs.writeFileSync(keyFile, localKey + '\n')
    console.log(`  🔑  Generated local dev key → .guest-key (add to .gitignore if not already)`)
  }
  // Use the local key
  process.env.GUEST_SECRET = localKey
}

const MASTER_KEY = crypto
  .createHash('sha256')
  .update(process.env.GUEST_SECRET)
  .digest() // 32 bytes → AES-256

// ── Salt for client-side key derivation ─────────────────────────
// This is a public, non-secret salt. Its purpose is to make the
// PBKDF2 derivation on the client side match what we do here.
const SALT = 'dada-silver-jubilee-2026'

/**
 * Derive a per-guest AES-256 key from the slug.
 * Client will replicate this exact derivation.
 */
function deriveKey(slug) {
  return crypto.pbkdf2Sync(
    slug + ':' + process.env.GUEST_SECRET,
    SALT,
    100_000,
    32,
    'sha256',
  )
}

/**
 * Hash a slug to produce the opaque public filename (no extension leak).
 */
function hashSlug(slug) {
  return crypto
    .createHash('sha256')
    .update(slug + ':filename:' + SALT)
    .digest('hex')
    .slice(0, 16) // 16 hex chars is plenty for uniqueness
}

async function generateOgImage(name, fontBuffer, outPath) {
  const markup = html`
    <div style="height: 100%; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #11192F; color: #F1E9DB; font-family: 'serif';">
      <div style="position: absolute; top: 40px; left: 40px; right: 40px; bottom: 40px; border: 1px solid rgba(241, 233, 219, 0.2); border-radius: 20px; display: flex;"></div>
      <div style="font-size: 42px; font-weight: 400; opacity: 0.8; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 40px; display: flex;">
        A Silver Jubilee
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; font-size: 100px; font-weight: 600; text-align: center; line-height: 1.2; font-style: italic;">
        <span style="display: flex;">An invitation for</span>
        <span style="display: flex;">${name}</span>
      </div>
    </div>
  `

  const svg = await satori(markup, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'serif',
        data: fontBuffer,
        weight: 600,
        style: 'italic',
      },
    ],
  })

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()
  fs.writeFileSync(outPath, pngBuffer)
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔒  seal-guests: encrypting guest images and generating OG cards …\n')

  // Load the installed Cormorant Garamond font for Satori
  console.log('   ↓  Loading local font for OG images...')
  const fontPath = path.join(ROOT, 'node_modules', '@fontsource', 'cormorant-garamond', 'files', 'cormorant-garamond-latin-600-italic.woff')
  const fontBuffer = fs.readFileSync(fontPath)

  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true })
  }

  const guests = JSON.parse(fs.readFileSync(GUESTS_JSON, 'utf-8'))
  const guestMap = {}

  if (!fs.existsSync(PRIVATE_DIR)) {
    console.log('   ⚠  private/guests/ not found — assuming we are in CI/Vercel and using pre-encrypted blobs.')
    // We still want to generate OG images even if private images aren't present
  } else {
    // Clean old .bin files from public/guests/
    for (const f of fs.readdirSync(PUBLIC_DIR)) {
      if (f.endsWith('.bin')) {
        fs.unlinkSync(path.join(PUBLIC_DIR, f))
      }
    }
  }

  for (const [slug, guest] of Object.entries(guests)) {
    // 1. Generate the OG image statically
    const ogPath = path.join(PUBLIC_DIR, `og-${slug}.png`)
    await generateOgImage(guest.name, fontBuffer, ogPath)

    // 2. Encrypt the raw image (if available)
    if (fs.existsSync(PRIVATE_DIR)) {
      const imgField = guest.img || slug
      const baseName = imgField.includes('.') ? imgField : null

      let srcFile = null
      if (baseName && fs.existsSync(path.join(PRIVATE_DIR, baseName))) {
        srcFile = path.join(PRIVATE_DIR, baseName)
      } else {
        for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) {
          const candidate = path.join(PRIVATE_DIR, slug + ext)
          if (fs.existsSync(candidate)) {
            srcFile = candidate
            break
          }
        }
      }

      if (srcFile) {
        const raw = fs.readFileSync(srcFile)
        const key = deriveKey(slug)
        const iv = crypto.randomBytes(12)
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
        const encrypted = Buffer.concat([cipher.update(raw), cipher.final()])
        const authTag = cipher.getAuthTag()
        const blob = Buffer.concat([iv, authTag, encrypted])
        
        const fileHash = hashSlug(slug)
        const outPath = path.join(PUBLIC_DIR, fileHash + '.bin')
        fs.writeFileSync(outPath, blob)

        guestMap[slug] = { h: fileHash }
        const sizeKB = (blob.length / 1024).toFixed(1)
        console.log(`   ✅  ${slug} → ${fileHash}.bin (${sizeKB} KB) + og-${slug}.png`)
      } else {
        console.log(`   ✅  ${slug} → [No private image] + og-${slug}.png`)
      }
    } else {
      console.log(`   ✅  ${slug} → og-${slug}.png`)
      // If we don't have private images, retain the existing guestMap mapping
      const existingMapPath = MAP_OUT
      if (fs.existsSync(existingMapPath)) {
        try {
          const existingMap = JSON.parse(fs.readFileSync(existingMapPath, 'utf-8'))
          if (existingMap[slug]) guestMap[slug] = existingMap[slug]
        } catch { }
      }
    }
  }

  // Write the guest map
  fs.writeFileSync(MAP_OUT, JSON.stringify(guestMap, null, 2))
  console.log(`\n   📦  Wrote guest map → src/data/.guest-map.json`)
  console.log(`   🏁  Done — ${Object.keys(guests).length} guests processed.\n`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
