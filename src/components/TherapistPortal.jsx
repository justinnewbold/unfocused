import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserCheck,
  Share2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  MessageSquare,
  Calendar,
  TrendingUp,
  FileText,
  Bell,
  Plus,
  X,
  Check,
  Shield,
  Clock,
  ChevronRight,
  Send,
  Clipboard,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage keys
const PROVIDERS_KEY = 'nero_providers'
const SHARED_DATA_KEY = 'nero_shared_data_settings'
const MESSAGES_KEY = 'nero_provider_messages'

// Data categories that can be shared
const DATA_CATEGORIES = [
  { id: 'tasks', name: 'Task Completion', icon: Check, description: 'Completed tasks and productivity patterns' },
  { id: 'mood', name: 'Mood Tracking', icon: TrendingUp, description: 'Mood logs and emotional patterns' },
  { id: 'sleep', name: 'Sleep Data', icon: Clock, description: 'Sleep quality and duration' },
  { id: 'medication', name: 'Medication', icon: Bell, description: 'Medication adherence records' },
  { id: 'focus', name: 'Focus Sessions', icon: Eye, description: 'Focus session durations and patterns' },
  { id: 'journal', name: 'Journal Entries', icon: FileText, description: 'Selected journal entries (you choose)' },
]

// Load providers
const loadProviders = () => {
  try {
    const stored = localStorage.getItem(PROVIDERS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save providers
const saveProviders = (providers) => {
  localStorage.setItem(PROVIDERS_KEY, JSON.stringify(providers))
}

// Load sharing settings
const loadSharingSettings = () => {
  try {
    const stored = localStorage.getItem(SHARED_DATA_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

// Save sharing settings
const saveSharingSettings = (settings) => {
  localStorage.setItem(SHARED_DATA_KEY, JSON.stringify(settings))
}

export default function TherapistPortal() {
  const prefersReducedMotion = useReducedMotion()
  const [providers, setProviders] = useState([])
  const [sharingSettings, setSharingSettings] = useState({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [activeTab, setActiveTab] = useState('providers')

  // New provider form
  const [newProvider, setNewProvider] = useState({
    name: '',
    role: 'therapist',
    email: '',
    notes: '',
  })

  // Load data on mount
  useEffect(() => {
    setProviders(loadProviders())
    setSharingSettings(loadSharingSettings())
  }, [])

  // Add provider
  const addProvider = () => {
    if (!newProvider.name.trim()) return

    const provider = {
      id: Date.now().toString(),
      ...newProvider,
      sharedCategories: [],
      lastShared: null,
      createdAt: new Date().toISOString(),
    }

    const updated = [...providers, provider]
    setProviders(updated)
    saveProviders(updated)

    setNewProvider({ name: '', role: 'therapist', email: '', notes: '' })
    setShowAddModal(false)
  }

  // Remove provider
  const removeProvider = (id) => {
    const updated = providers.filter(p => p.id !== id)
    setProviders(updated)
    saveProviders(updated)

    // Clean up sharing settings
    const updatedSettings = { ...sharingSettings }
    delete updatedSettings[id]
    setSharingSettings(updatedSettings)
    saveSharingSettings(updatedSettings)
  }

  // Toggle data category sharing
  const toggleCategorySharing = (providerId, categoryId) => {
    const providerSettings = sharingSettings[providerId] || { categories: [] }
    const categories = providerSettings.categories.includes(categoryId)
      ? providerSettings.categories.filter(c => c !== categoryId)
      : [...providerSettings.categories, categoryId]

    const updated = {
      ...sharingSettings,
      [providerId]: { ...providerSettings, categories }
    }
    setSharingSettings(updated)
    saveSharingSettings(updated)
  }

  // Generate share link (simulated)
  const generateShareLink = (providerId) => {
    const provider = providers.find(p => p.id === providerId)
    const settings = sharingSettings[providerId] || { categories: [] }

    // Update last shared
    const updatedProviders = providers.map(p =>
      p.id === providerId ? { ...p, lastShared: new Date().toISOString() } : p
    )
    setProviders(updatedProviders)
    saveProviders(updatedProviders)

    // Simulated share link
    const shareCode = btoa(`nero-share-${providerId}-${Date.now()}`)
    navigator.clipboard?.writeText(`https://nero.app/shared/${shareCode}`)

    return shareCode
  }

  // Get provider settings
  const getProviderSettings = (providerId) => {
    return sharingSettings[providerId] || { categories: [] }
  }

  // Provider roles
  const ROLES = [
    { id: 'therapist', name: 'Therapist' },
    { id: 'psychiatrist', name: 'Psychiatrist' },
    { id: 'coach', name: 'ADHD Coach' },
    { id: 'counselor', name: 'Counselor' },
    { id: 'other', name: 'Other Provider' },
  ]

  return (
    <div className="h-full overflow-y-auto p-4 pb-8">
      <motion.div
        className="max-w-lg mx-auto"
        {...getMotionProps(prefersReducedMotion, {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 }
        })}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <Shield className="w-6 h-6 text-purple-400" />
              Provider Portal
            </h2>
            <p className="text-sm text-white/50">Share progress with your care team</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="mb-6 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-purple-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-purple-400">Your Data, Your Control</p>
              <p className="text-xs text-white/60 mt-1">
                You choose exactly what to share. Providers only see what you allow.
                You can revoke access at any time.
              </p>
            </div>
          </div>
        </div>

        {/* Providers List */}
        {providers.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <UserCheck className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <h3 className="font-medium mb-2">No Providers Added</h3>
            <p className="text-sm text-white/50 mb-4">
              Add your therapist, psychiatrist, or ADHD coach to share your progress
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-colors"
            >
              Add Your First Provider
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {providers.map((provider) => {
              const settings = getProviderSettings(provider.id)
              const sharedCount = settings.categories.length

              return (
                <motion.div
                  key={provider.id}
                  {...getMotionProps(prefersReducedMotion, {
                    initial: { opacity: 0, y: 10 },
                    animate: { opacity: 1, y: 0 }
                  })}
                  className="glass-card p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-medium">{provider.name}</h3>
                        <p className="text-xs text-white/50 capitalize">{provider.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedProvider(
                        selectedProvider === provider.id ? null : provider.id
                      )}
                      className="p-2 rounded-lg hover:bg-white/10"
                    >
                      <ChevronRight className={`w-4 h-4 transition-transform ${
                        selectedProvider === provider.id ? 'rotate-90' : ''
                      }`} />
                    </button>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-white/50">
                      <Eye className="w-3 h-3" />
                      <span>{sharedCount} categories shared</span>
                    </div>
                    {provider.lastShared && (
                      <div className="flex items-center gap-1 text-white/50">
                        <Clock className="w-3 h-3" />
                        <span>Last: {new Date(provider.lastShared).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Expanded Settings */}
                  <AnimatePresence>
                    {selectedProvider === provider.id && (
                      <motion.div
                        {...getMotionProps(prefersReducedMotion, {
                          initial: { opacity: 0, height: 0 },
                          animate: { opacity: 1, height: 'auto' },
                          exit: { opacity: 0, height: 0 }
                        })}
                        className="mt-4 pt-4 border-t border-white/10"
                      >
                        <p className="text-sm text-white/70 mb-3">Choose what to share:</p>
                        <div className="space-y-2">
                          {DATA_CATEGORIES.map((category) => {
                            const Icon = category.icon
                            const isShared = settings.categories.includes(category.id)

                            return (
                              <button
                                key={category.id}
                                onClick={() => toggleCategorySharing(provider.id, category.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                  isShared
                                    ? 'bg-purple-500/20 border border-purple-500/30'
                                    : 'bg-white/5 hover:bg-white/10'
                                }`}
                              >
                                <Icon className={`w-4 h-4 ${isShared ? 'text-purple-400' : 'text-white/50'}`} />
                                <div className="flex-1 text-left">
                                  <p className="text-sm font-medium">{category.name}</p>
                                  <p className="text-xs text-white/50">{category.description}</p>
                                </div>
                                {isShared ? (
                                  <Unlock className="w-4 h-4 text-purple-400" />
                                ) : (
                                  <Lock className="w-4 h-4 text-white/30" />
                                )}
                              </button>
                            )
                          })}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => {
                              generateShareLink(provider.id)
                              // Show feedback
                            }}
                            disabled={sharedCount === 0}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                              sharedCount > 0
                                ? 'bg-purple-500 hover:bg-purple-600 text-white'
                                : 'bg-white/10 text-white/30 cursor-not-allowed'
                            }`}
                          >
                            <Share2 className="w-4 h-4" />
                            Generate Share Link
                          </button>
                          <button
                            onClick={() => removeProvider(provider.id)}
                            className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* What Providers See */}
        <div className="mt-6 p-4 bg-white/5 rounded-xl">
          <h3 className="text-sm font-medium mb-3">What Your Provider Sees</h3>
          <div className="space-y-2 text-sm text-white/60">
            <p>• Aggregated summaries, not raw data</p>
            <p>• Trends and patterns over time</p>
            <p>• Only the categories you enable</p>
            <p>• No access to private notes or thoughts</p>
          </div>
        </div>

        {/* Add Provider Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 }
              })}
              className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                {...getMotionProps(prefersReducedMotion, {
                  initial: { scale: 0.95 },
                  animate: { scale: 1 },
                  exit: { scale: 0.95 }
                })}
                className="bg-[#1a1a2e] rounded-2xl p-6 w-full max-w-md"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="font-display text-lg font-semibold mb-4">Add Provider</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Name</label>
                    <input
                      type="text"
                      value={newProvider.name}
                      onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Dr. Smith"
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/70 mb-1">Role</label>
                    <select
                      value={newProvider.role}
                      onChange={(e) => setNewProvider(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 outline-none"
                    >
                      {ROLES.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-white/70 mb-1">Email (optional)</label>
                    <input
                      type="email"
                      value={newProvider.email}
                      onChange={(e) => setNewProvider(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="provider@email.com"
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/70 mb-1">Notes</label>
                    <textarea
                      value={newProvider.notes}
                      onChange={(e) => setNewProvider(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any notes about this provider..."
                      rows={2}
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addProvider}
                    disabled={!newProvider.name.trim()}
                    className="flex-1 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add Provider
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
