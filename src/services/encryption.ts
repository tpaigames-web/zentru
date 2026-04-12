/**
 * Zentru Encryption Service
 *
 * End-to-End Encryption (E2EE) layer for future server sync.
 * Uses Web Crypto API (built into browsers, no extra dependencies).
 *
 * Architecture:
 * 1. User sets a "sync password" when enabling cloud sync
 * 2. Password → PBKDF2 → AES-256-GCM encryption key
 * 3. All data encrypted on device BEFORE sending to server
 * 4. Server only stores ciphertext (cannot read data)
 * 5. Data decrypted on device AFTER downloading from server
 *
 * Key points:
 * - Server NEVER sees the plaintext data or the password
 * - Even if the database is leaked, data is unreadable
 * - Only the user with the correct password can decrypt
 */

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const PBKDF2_ITERATIONS = 600000 // OWASP recommended for 2025+
const SALT_LENGTH = 16
const IV_LENGTH = 12

/**
 * Derive an AES-256 encryption key from a user password.
 * Uses PBKDF2 with high iteration count for brute-force resistance.
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  )
}

/**
 * Encrypt data with AES-256-GCM.
 * Returns base64-encoded string containing: salt + iv + ciphertext
 */
export async function encrypt(
  data: string,
  password: string,
): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await deriveKey(password, salt)

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(data),
  )

  // Combine salt + iv + ciphertext into one buffer
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length)

  return bufferToBase64(combined)
}

/**
 * Decrypt data with AES-256-GCM.
 * Input: base64 string from encrypt()
 */
export async function decrypt(
  encryptedBase64: string,
  password: string,
): Promise<string> {
  const combined = base64ToBuffer(encryptedBase64)
  const salt = combined.slice(0, SALT_LENGTH)
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH)

  const key = await deriveKey(password, salt)

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext,
  )

  return new TextDecoder().decode(decrypted)
}

/**
 * Encrypt a JavaScript object (serialize → encrypt).
 */
export async function encryptObject<T>(
  obj: T,
  password: string,
): Promise<string> {
  return encrypt(JSON.stringify(obj), password)
}

/**
 * Decrypt to a JavaScript object (decrypt → deserialize).
 */
export async function decryptObject<T>(
  encryptedBase64: string,
  password: string,
): Promise<T> {
  const json = await decrypt(encryptedBase64, password)
  return JSON.parse(json)
}

/**
 * Generate a hash of the password for server-side verification.
 * This allows the server to verify the user without knowing the password.
 * Uses a DIFFERENT salt than encryption to prevent correlation attacks.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  const hashBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )

  const combined = new Uint8Array(salt.length + hashBits.byteLength)
  combined.set(salt, 0)
  combined.set(new Uint8Array(hashBits), salt.length)

  return bufferToBase64(combined)
}

/**
 * Verify a password against a hash.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const combined = base64ToBuffer(storedHash)
  const salt = combined.slice(0, SALT_LENGTH)

  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  const hashBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )

  const storedBits = combined.slice(SALT_LENGTH)
  return timingSafeEqual(new Uint8Array(hashBits), storedBits)
}

// ---- Utility functions ----

function bufferToBase64(buffer: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i])
  }
  return btoa(binary)
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Constant-time comparison to prevent timing attacks.
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i]
  }
  return result === 0
}
