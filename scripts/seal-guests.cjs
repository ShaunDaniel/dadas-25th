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

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

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

// ── Main ────────────────────────────────────────────────────────
function main() {
  console.log('\n🔒  seal-guests: encrypting guest images …\n')

  if (!fs.existsSync(PRIVATE_DIR)) {
    console.log('   ⚠  private/guests/ not found — assuming we are in CI/Vercel and using pre-encrypted blobs.')
    // If the map doesn't exist at all, write an empty one to prevent build crashes
    if (!fs.existsSync(MAP_OUT)) {
      fs.writeFileSync(MAP_OUT, JSON.stringify({}))
    }
    return
  }

  const guests = JSON.parse(fs.readFileSync(GUESTS_JSON, 'utf-8'))
  const guestMap = {}

  // Clean old .bin files from public/guests/
  if (fs.existsSync(PUBLIC_DIR)) {
    for (const f of fs.readdirSync(PUBLIC_DIR)) {
      if (f.endsWith('.bin')) {
        fs.unlinkSync(path.join(PUBLIC_DIR, f))
      }
    }
  } else {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true })
  }

  for (const [slug, guest] of Object.entries(guests)) {
    // Find the image file in private/guests/
    const imgField = guest.img || slug
    const baseName = imgField.includes('.') ? imgField : null

    // Try to find the file — check exact name, then common extensions
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

    if (!srcFile) {
      console.log(`   ⏭  ${slug}: no image found — skipping`)
      continue
    }

    // Read the raw image
    const raw = fs.readFileSync(srcFile)

    // Derive a per-guest key
    const key = deriveKey(slug)

    // Encrypt with AES-256-GCM
    const iv = crypto.randomBytes(12) // 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    const encrypted = Buffer.concat([cipher.update(raw), cipher.final()])
    const authTag = cipher.getAuthTag() // 16 bytes

    // Build the blob: [IV (12)] [AuthTag (16)] [Ciphertext (...)]
    const blob = Buffer.concat([iv, authTag, encrypted])

    // Write to public/guests/<hash>.bin
    const fileHash = hashSlug(slug)
    const outPath = path.join(PUBLIC_DIR, fileHash + '.bin')
    fs.writeFileSync(outPath, blob)

    // Record in the map
    guestMap[slug] = {
      h: fileHash, // hashed filename
    }

    const sizeKB = (blob.length / 1024).toFixed(1)
    console.log(`   ✅  ${slug} → ${fileHash}.bin  (${sizeKB} KB)`)
  }

  // Write the guest map (gitignored, but Vite will bundle it)
  fs.writeFileSync(MAP_OUT, JSON.stringify(guestMap, null, 2))
  console.log(`\n   📦  Wrote guest map → src/data/.guest-map.json`)
  console.log(`   🏁  Done — ${Object.keys(guestMap).length} images sealed.\n`)
}

main()
