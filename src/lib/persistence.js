/**
 * Debounced persistence layer that abstracts localStorage with Supabase-ready interface.
 * All components should use this instead of direct localStorage calls.
 */

import { supabase, TABLES } from './supabase'

// In-memory cache for fast reads
const cache = new Map()

// Pending write timers for debouncing
const pendingWrites = new Map()

// Default debounce delay (ms)
const DEBOUNCE_MS = 300

// Whether Supabase is configured and available
const isSupabaseAvailable = () => {
  try {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    return Boolean(url && key && url !== 'undefined' && key !== 'undefined')
  } catch {
    return false
  }
}

/**
 * Read a value from the persistence layer.
 * Checks in-memory cache first, then localStorage, then Supabase.
 */
export function read(key, defaultValue = null) {
  // Check cache first
  if (cache.has(key)) {
    return cache.get(key)
  }

  // Try localStorage
  try {
    const stored = localStorage.getItem(key)
    if (stored !== null) {
      const parsed = JSON.parse(stored)
      cache.set(key, parsed)
      return parsed
    }
  } catch {
    // Corrupted data - clear it
    localStorage.removeItem(key)
  }

  // Return default
  cache.set(key, defaultValue)
  return defaultValue
}

/**
 * Write a value to the persistence layer with debouncing.
 * Writes to cache immediately, debounces localStorage writes.
 */
export function write(key, value, options = {}) {
  const { immediate = false, debounceMs = DEBOUNCE_MS } = options

  // Always update cache immediately for fast reads
  cache.set(key, value)

  // Clear any pending write for this key
  if (pendingWrites.has(key)) {
    clearTimeout(pendingWrites.get(key))
  }

  const doWrite = () => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      // localStorage is full or unavailable
      console.warn(`[persistence] Failed to write key "${key}":`, e.message)
      handleStorageQuota(key, value)
    }
    pendingWrites.delete(key)

    // If Supabase is available, sync in background
    if (isSupabaseAvailable()) {
      syncToSupabase(key, value).catch(() => {
        // Silently fail - localStorage is the source of truth for now
      })
    }
  }

  if (immediate) {
    doWrite()
  } else {
    pendingWrites.set(key, setTimeout(doWrite, debounceMs))
  }
}

/**
 * Remove a value from the persistence layer.
 */
export function remove(key) {
  cache.delete(key)
  if (pendingWrites.has(key)) {
    clearTimeout(pendingWrites.get(key))
    pendingWrites.delete(key)
  }
  try {
    localStorage.removeItem(key)
  } catch {
    // Ignore
  }
}

/**
 * Update a value using a transform function. Atomic read-modify-write.
 */
export function update(key, transformFn, defaultValue = null) {
  const current = read(key, defaultValue)
  const next = transformFn(current)
  write(key, next)
  return next
}

/**
 * Clear the in-memory cache (useful for testing).
 */
export function clearCache() {
  cache.clear()
}

/**
 * Flush all pending writes immediately (useful before page unload).
 */
export function flushAll() {
  for (const [key, timer] of pendingWrites.entries()) {
    clearTimeout(timer)
    const value = cache.get(key)
    if (value !== undefined) {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch {
        // Best effort
      }
    }
  }
  pendingWrites.clear()
}

/**
 * Get all keys stored in the persistence layer.
 */
export function getAllKeys() {
  const keys = new Set()
  for (let i = 0; i < localStorage.length; i++) {
    keys.add(localStorage.key(i))
  }
  return Array.from(keys)
}

/**
 * Export all persisted data as a plain object.
 */
export function exportAll() {
  // Flush pending writes first
  flushAll()

  const data = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    try {
      data[key] = JSON.parse(localStorage.getItem(key))
    } catch {
      data[key] = localStorage.getItem(key)
    }
  }
  return data
}

/**
 * Import data from an exported object, merging with existing data.
 */
export function importAll(data) {
  for (const [key, value] of Object.entries(data)) {
    write(key, value, { immediate: true })
  }
}

/**
 * Handle localStorage quota exceeded by removing oldest entries.
 */
function handleStorageQuota(key, value) {
  // Try to free up space by removing old insight data (oldest first)
  try {
    const insightsRaw = localStorage.getItem('neroInsights')
    if (insightsRaw) {
      const insights = JSON.parse(insightsRaw)
      const dates = Object.keys(insights).sort()
      // Remove entries older than 30 days
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 30)
      const cutoffKey = cutoff.toISOString().split('T')[0]

      let removed = false
      for (const date of dates) {
        if (date < cutoffKey) {
          delete insights[date]
          removed = true
        }
      }

      if (removed) {
        localStorage.setItem('neroInsights', JSON.stringify(insights))
        // Retry the original write
        localStorage.setItem(key, JSON.stringify(value))
      }
    }
  } catch {
    // Last resort - can't free space
    console.error('[persistence] Unable to free storage space')
  }
}

/**
 * Sync a key-value pair to Supabase (background, best-effort).
 */
async function syncToSupabase(key, value) {
  if (!supabase) return // Client not initialized

  // Map known keys to Supabase tables
  const tableMap = {
    neroInsights: TABLES.energy_logs,
    neroTasks: TABLES.tasks,
    neroBreadcrumbs: TABLES.breadcrumbs,
    neroConversations: TABLES.conversations,
  }

  const table = tableMap[key]
  if (!table) return // Not a synced key

  try {
    await supabase.from(table).upsert({
      key,
      data: value,
      updated_at: new Date().toISOString(),
    })
  } catch {
    // Network error - will retry on next write
  }
}

// Flush pending writes on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushAll)
  window.addEventListener('pagehide', flushAll)
}
