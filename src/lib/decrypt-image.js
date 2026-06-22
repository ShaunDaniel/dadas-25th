/**
 * decrypt-image.js
 * ────────────────
 * Client-side AES-256-GCM decryption using Web Crypto API.
 * Mirrors the encryption done by scripts/seal-guests.cjs.
 */

const SALT = 'dada-silver-jubilee-2026'

/**
 * Derive the per-guest AES-256-GCM key from the slug.
 * Must match the server-side derivation in seal-guests.cjs.
 *
 * Server uses: pbkdf2(slug + ':' + SECRET, SALT, 100000, 32, 'sha256')
 * Client uses: the same, but the SECRET is embedded at build time via the
 *              Vite env var VITE_GUEST_SECRET.
 */
async function deriveKey(slug) {
  const secret = import.meta.env.VITE_GUEST_SECRET || ''
  const enc = new TextEncoder()

  // Import the passphrase as raw key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(slug + ':' + secret),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  // Derive AES-GCM key with same params as Node.js script
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(SALT),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  )
}

/**
 * Fetch and decrypt an encrypted guest image.
 *
 * @param {string} slug   — the guest's URL slug (e.g. "verona")
 * @param {string} hash   — the hashed filename from .guest-map.json
 * @returns {Promise<string|null>}  blob URL for the decrypted image, or null
 */
export async function decryptGuestImage(slug, hash) {
  try {
    const url = `${import.meta.env.BASE_URL}guests/${hash}.bin`
    const resp = await fetch(url)
    if (!resp.ok) return null

    const buf = await resp.arrayBuffer()
    const data = new Uint8Array(buf)

    // Layout: [IV (12 bytes)] [AuthTag (16 bytes)] [Ciphertext (...)]
    const iv = data.slice(0, 12)
    const authTag = data.slice(12, 28)
    const ciphertext = data.slice(28)

    // Web Crypto expects the auth tag appended to the ciphertext
    const combined = new Uint8Array(ciphertext.length + authTag.length)
    combined.set(ciphertext)
    combined.set(authTag, ciphertext.length)

    const key = await deriveKey(slug)

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      combined,
    )

    // Create a blob URL from the decrypted image bytes
    const blob = new Blob([decrypted], { type: 'image/jpeg' })
    return URL.createObjectURL(blob)
  } catch (err) {
    console.warn(`[decrypt] Failed for "${slug}":`, err.message)
    return null
  }
}
