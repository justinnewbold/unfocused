import { createClient } from '@supabase/supabase-js'

// These will be set in Vercel environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Only create the client if credentials are available
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Database types for TypeScript-like documentation
export const TABLES = {
  users: 'users',
  tasks: 'tasks',
  breadcrumbs: 'breadcrumbs',
  energy_logs: 'energy_logs',
  nero_memory: 'nero_memory',
  conversations: 'conversations',
}

// Energy levels enum
export const ENERGY_LEVELS = {
  DEPLETED: 1,
  LOW: 2,
  MODERATE: 3,
  GOOD: 4,
  PEAK: 5,
}

// Task status enum
export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DEFERRED: 'deferred',
}
