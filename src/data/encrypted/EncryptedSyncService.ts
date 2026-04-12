/**
 * Encrypted Sync Service
 *
 * This service wraps the data layer to provide encrypted cloud sync.
 * When enabled, all data is encrypted before upload and decrypted after download.
 *
 * Current status: PREPARED but NOT ACTIVE.
 * Activate when server backend is ready.
 *
 * Usage flow:
 * 1. User enables "Cloud Sync" in Settings
 * 2. User sets a sync password (stored ONLY on device)
 * 3. All data encrypted with user's password → uploaded to server
 * 4. Server stores encrypted blobs (cannot read content)
 * 5. On other device: enter same password → download & decrypt
 *
 * Security guarantees:
 * - AES-256-GCM encryption (military grade)
 * - PBKDF2 key derivation (600,000 iterations)
 * - Unique salt per encryption operation
 * - Server stores only ciphertext
 * - Zero-knowledge: server cannot decrypt user data
 * - Password never transmitted to server
 */

import { encryptObject, decryptObject } from '@/services/encryption'

export interface SyncConfig {
  enabled: boolean
  serverUrl: string
  syncPassword: string  // stored only in device secure storage
  lastSyncAt?: number
  userId?: string
}

export interface EncryptedPayload {
  userId: string
  dataType: string  // 'cards' | 'transactions' | 'categories' | etc.
  encryptedData: string  // base64 AES-256-GCM ciphertext
  timestamp: number
  checksum: string
}

/**
 * Encrypt a data collection for upload.
 */
export async function prepareUpload<T>(
  data: T[],
  dataType: string,
  config: SyncConfig,
): Promise<EncryptedPayload> {
  const encrypted = await encryptObject(data, config.syncPassword)

  // Generate checksum for integrity verification
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(encrypted))
  const checksum = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return {
    userId: config.userId || '',
    dataType,
    encryptedData: encrypted,
    timestamp: Date.now(),
    checksum,
  }
}

/**
 * Decrypt a downloaded payload.
 */
export async function processDownload<T>(
  payload: EncryptedPayload,
  config: SyncConfig,
): Promise<T[]> {
  // Verify checksum
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(payload.encryptedData))
  const checksum = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  if (checksum !== payload.checksum) {
    throw new Error('Data integrity check failed - data may have been tampered with')
  }

  return decryptObject<T[]>(payload.encryptedData, config.syncPassword)
}

/**
 * Future: Full sync orchestrator.
 * Will handle conflict resolution, incremental sync, etc.
 */
export class SyncOrchestrator {
  private _config: SyncConfig

  constructor(config: SyncConfig) {
    this._config = config
  }

  get config() { return this._config }

  // TODO: Implement when server is ready
  // async pushChanges(changes: ChangeSet): Promise<void>
  // async pullChanges(since: number): Promise<ChangeSet>
  // async resolveConflicts(local: ChangeSet, remote: ChangeSet): Promise<ChangeSet>
  // async fullSync(): Promise<SyncResult>
}
