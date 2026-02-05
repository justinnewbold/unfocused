import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Download,
  Upload,
  Link,
  Unlink,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FolderOpen,
  ExternalLink,
  Settings,
  Database,
  Cloud,
  CloudOff,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const SYNC_KEY = 'nero_note_sync_settings'

// Supported note apps
const NOTE_APPS = [
  {
    id: 'notion',
    name: 'Notion',
    icon: '📝',
    color: 'white',
    description: 'Sync tasks and notes to Notion databases',
    features: ['Tasks', 'Projects', 'External Brain', 'Weekly Reviews'],
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    icon: '💎',
    color: 'purple',
    description: 'Export notes in Markdown format for Obsidian vaults',
    features: ['External Brain', 'Weekly Reviews', 'Insights'],
  },
  {
    id: 'apple_notes',
    name: 'Apple Notes',
    icon: '🍎',
    color: 'yellow',
    description: 'Quick capture directly to Apple Notes',
    features: ['Quick Capture', 'Voice Notes'],
  },
  {
    id: 'google_keep',
    name: 'Google Keep',
    icon: '📌',
    color: 'yellow',
    description: 'Sync quick captures and reminders',
    features: ['Quick Capture', 'Reminders'],
  },
  {
    id: 'todoist',
    name: 'Todoist',
    icon: '✅',
    color: 'red',
    description: 'Two-way task sync with Todoist',
    features: ['Tasks', 'Projects', 'Deadlines'],
  },
  {
    id: 'roam',
    name: 'Roam Research',
    icon: '🔗',
    color: 'blue',
    description: 'Export linked notes and daily pages',
    features: ['External Brain', 'Daily Notes'],
  },
]

// Sync status types
const SYNC_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  SYNCING: 'syncing',
  ERROR: 'error',
}

// Load settings
const loadSettings = () => {
  try {
    const stored = localStorage.getItem(SYNC_KEY)
    return stored ? JSON.parse(stored) : {
      connectedApps: [],
      autoSync: true,
      syncInterval: 30,
      syncOnCapture: true,
      exportFormat: 'markdown',
    }
  } catch {
    return {}
  }
}

// Save settings
const saveSettings = (settings) => {
  localStorage.setItem(SYNC_KEY, JSON.stringify(settings))
}

export default function NoteAppSync({ onExport, onImport }) {
  const prefersReducedMotion = useReducedMotion()
  const [settings, setSettings] = useState(loadSettings())
  const [syncStatus, setSyncStatus] = useState({})
  const [isSyncing, setIsSyncing] = useState(false)
  const [viewMode, setViewMode] = useState('apps') // 'apps' | 'settings' | 'export'
  const [lastSync, setLastSync] = useState(null)

  // Load settings on mount
  useEffect(() => {
    setSettings(loadSettings())

    // Initialize sync status for connected apps
    const status = {}
    settings.connectedApps?.forEach(appId => {
      status[appId] = SYNC_STATUS.CONNECTED
    })
    setSyncStatus(status)
  }, [])

  // Update settings
  const updateSettings = (key, value) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    saveSettings(updated)
  }

  // Connect app (simulated)
  const connectApp = async (appId) => {
    setSyncStatus(prev => ({ ...prev, [appId]: SYNC_STATUS.SYNCING }))

    // Simulate OAuth flow
    await new Promise(resolve => setTimeout(resolve, 2000))

    const updated = [...(settings.connectedApps || []), appId]
    updateSettings('connectedApps', updated)
    setSyncStatus(prev => ({ ...prev, [appId]: SYNC_STATUS.CONNECTED }))
  }

  // Disconnect app
  const disconnectApp = (appId) => {
    const updated = settings.connectedApps.filter(id => id !== appId)
    updateSettings('connectedApps', updated)
    setSyncStatus(prev => {
      const newStatus = { ...prev }
      delete newStatus[appId]
      return newStatus
    })
  }

  // Manual sync
  const syncAll = async () => {
    setIsSyncing(true)

    // Update all connected apps to syncing
    const syncing = {}
    settings.connectedApps?.forEach(appId => {
      syncing[appId] = SYNC_STATUS.SYNCING
    })
    setSyncStatus(syncing)

    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Update to connected
    const connected = {}
    settings.connectedApps?.forEach(appId => {
      connected[appId] = SYNC_STATUS.CONNECTED
    })
    setSyncStatus(connected)
    setLastSync(new Date())
    setIsSyncing(false)
  }

  // Export data
  const exportData = (format) => {
    const data = {
      tasks: JSON.parse(localStorage.getItem('nero_prioritized_tasks') || '[]'),
      externalBrain: JSON.parse(localStorage.getItem('nero_external_brain') || '[]'),
      weeklyReviews: JSON.parse(localStorage.getItem('nero_weekly_reviews') || '[]'),
      exportedAt: new Date().toISOString(),
    }

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      downloadBlob(blob, 'nero-export.json')
    } else if (format === 'markdown') {
      const md = generateMarkdown(data)
      const blob = new Blob([md], { type: 'text/markdown' })
      downloadBlob(blob, 'nero-export.md')
    }

    onExport?.(data)
  }

  // Download helper
  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // Generate markdown export
  const generateMarkdown = (data) => {
    let md = `# Nero Export\n\nExported: ${new Date().toLocaleString()}\n\n`

    if (data.tasks?.length) {
      md += `## Tasks\n\n`
      data.tasks.forEach(task => {
        md += `- [ ] ${task.title}\n`
      })
      md += `\n`
    }

    if (data.externalBrain?.length) {
      md += `## External Brain Notes\n\n`
      data.externalBrain.forEach(note => {
        md += `### ${note.title || 'Note'}\n${note.content}\n\n`
      })
    }

    return md
  }

  // Import data
  const handleImport = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        onImport?.(data)

        // Store imported data
        if (data.tasks) {
          localStorage.setItem('nero_prioritized_tasks', JSON.stringify(data.tasks))
        }
        if (data.externalBrain) {
          localStorage.setItem('nero_external_brain', JSON.stringify(data.externalBrain))
        }
      } catch (err) {
        console.error('Import failed:', err)
      }
    }
    reader.readAsText(file)
  }

  // Check if app is connected
  const isConnected = (appId) => settings.connectedApps?.includes(appId)

  // Get status icon
  const getStatusIcon = (appId) => {
    const status = syncStatus[appId]
    if (status === SYNC_STATUS.SYNCING) return <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
    if (status === SYNC_STATUS.CONNECTED) return <CheckCircle className="w-4 h-4 text-green-400" />
    if (status === SYNC_STATUS.ERROR) return <AlertCircle className="w-4 h-4 text-red-400" />
    return null
  }

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
            <h2 className="font-display text-xl font-semibold">Note App Sync</h2>
            <p className="text-sm text-white/50">Import & export your data</p>
          </div>
          {settings.connectedApps?.length > 0 && (
            <button
              onClick={syncAll}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync All
            </button>
          )}
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'apps', label: 'Apps', icon: Cloud },
            { id: 'export', label: 'Export/Import', icon: Database },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                viewMode === tab.id
                  ? 'bg-white/10 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Apps View */}
        {viewMode === 'apps' && (
          <div className="space-y-3">
            {NOTE_APPS.map((app) => {
              const connected = isConnected(app.id)

              return (
                <motion.div
                  key={app.id}
                  {...getMotionProps(prefersReducedMotion, {
                    initial: { opacity: 0, y: 10 },
                    animate: { opacity: 1, y: 0 }
                  })}
                  className={`glass-card p-4 ${connected ? 'border border-green-500/30' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
                      {app.icon}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{app.name}</h3>
                        {getStatusIcon(app.id)}
                      </div>
                      <p className="text-xs text-white/50 mt-1">{app.description}</p>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {app.features.map((feature) => (
                          <span key={feature} className="text-xs px-2 py-0.5 rounded-full bg-white/10">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => connected ? disconnectApp(app.id) : connectApp(app.id)}
                      disabled={syncStatus[app.id] === SYNC_STATUS.SYNCING}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        connected
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                      }`}
                    >
                      {connected ? (
                        <>
                          <Unlink className="w-3 h-3" />
                          Disconnect
                        </>
                      ) : (
                        <>
                          <Link className="w-3 h-3" />
                          Connect
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )
            })}

            {lastSync && (
              <p className="text-xs text-white/40 text-center mt-4">
                Last synced: {lastSync.toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Export/Import View */}
        {viewMode === 'export' && (
          <div className="space-y-4">
            {/* Export */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Download className="w-5 h-5 text-green-400" />
                <h3 className="font-medium">Export Data</h3>
              </div>
              <p className="text-sm text-white/50 mb-4">
                Download all your Nero data to use in other apps or as a backup.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => exportData('json')}
                  className="flex-1 px-4 py-2 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm transition-colors"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => exportData('markdown')}
                  className="flex-1 px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-sm transition-colors"
                >
                  Export Markdown
                </button>
              </div>
            </div>

            {/* Import */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="w-5 h-5 text-blue-400" />
                <h3 className="font-medium">Import Data</h3>
              </div>
              <p className="text-sm text-white/50 mb-4">
                Import data from a previous Nero export (JSON format).
              </p>
              <label className="block">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 cursor-pointer transition-colors">
                  <FolderOpen className="w-4 h-4" />
                  Choose File
                </div>
              </label>
            </div>

            {/* Data Overview */}
            <div className="glass-card p-4">
              <h3 className="font-medium mb-3">Your Data</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">Tasks</span>
                  <span>{JSON.parse(localStorage.getItem('nero_prioritized_tasks') || '[]').length} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">External Brain Notes</span>
                  <span>{JSON.parse(localStorage.getItem('nero_external_brain') || '[]').length} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Weekly Reviews</span>
                  <span>{JSON.parse(localStorage.getItem('nero_weekly_reviews') || '[]').length} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Mood Entries</span>
                  <span>{JSON.parse(localStorage.getItem('nero_mood_history') || '[]').length} items</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings View */}
        {viewMode === 'settings' && (
          <div className="space-y-3">
            {/* Auto Sync */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium">Auto Sync</p>
                  <p className="text-xs text-white/50">Sync connected apps automatically</p>
                </div>
                <button
                  onClick={() => updateSettings('autoSync', !settings.autoSync)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.autoSync ? 'bg-blue-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.autoSync ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {settings.autoSync && (
                <div>
                  <p className="text-sm text-white/70 mb-2">Sync every {settings.syncInterval} minutes</p>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    step="5"
                    value={settings.syncInterval}
                    onChange={(e) => updateSettings('syncInterval', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Sync on Capture */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sync on Quick Capture</p>
                  <p className="text-xs text-white/50">Immediately sync new captures</p>
                </div>
                <button
                  onClick={() => updateSettings('syncOnCapture', !settings.syncOnCapture)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.syncOnCapture ? 'bg-blue-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.syncOnCapture ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>

            {/* Export Format */}
            <div className="glass-card p-4">
              <p className="font-medium mb-3">Default Export Format</p>
              <div className="flex gap-2">
                {['markdown', 'json'].map((format) => (
                  <button
                    key={format}
                    onClick={() => updateSettings('exportFormat', format)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
                      settings.exportFormat === format
                        ? 'bg-white/10 text-white'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
