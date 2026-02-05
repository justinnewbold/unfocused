import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  Command,
  Plus,
  X,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Target,
  Coffee,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Smartphone,
  Keyboard,
  ChevronRight,
  Settings,
  Mic,
  Bell,
  Edit3,
  Trash2,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const SHORTCUTS_KEY = 'nero_shortcut_actions'

// Available actions
const AVAILABLE_ACTIONS = [
  { id: 'start-focus', name: 'Start Focus Session', icon: Play, category: 'focus', color: 'yellow' },
  { id: 'quick-break', name: 'Take a Break', icon: Coffee, category: 'focus', color: 'green' },
  { id: 'end-session', name: 'End Current Session', icon: Pause, category: 'focus', color: 'red' },
  { id: 'add-task', name: 'Add Quick Task', icon: Plus, category: 'tasks', color: 'blue' },
  { id: 'complete-task', name: 'Complete Next Task', icon: CheckCircle, category: 'tasks', color: 'green' },
  { id: 'view-tasks', name: 'View Task List', icon: Target, category: 'tasks', color: 'purple' },
  { id: 'toggle-sounds', name: 'Toggle Focus Sounds', icon: Volume2, category: 'audio', color: 'indigo' },
  { id: 'mute-all', name: 'Mute All Sounds', icon: VolumeX, category: 'audio', color: 'slate' },
  { id: 'log-mood', name: 'Log Current Mood', icon: Sun, category: 'tracking', color: 'orange' },
  { id: 'voice-note', name: 'Record Voice Note', icon: Mic, category: 'tracking', color: 'pink' },
  { id: 'snooze-reminders', name: 'Snooze Reminders', icon: Bell, category: 'notifications', color: 'amber' },
  { id: 'night-mode', name: 'Toggle Night Mode', icon: Moon, category: 'settings', color: 'violet' },
]

// Default shortcuts
const DEFAULT_SHORTCUTS = [
  { id: 'shortcut-1', actionId: 'start-focus', trigger: 'siri', phrase: 'Start my focus' },
  { id: 'shortcut-2', actionId: 'quick-break', trigger: 'siri', phrase: 'I need a break' },
  { id: 'shortcut-3', actionId: 'add-task', trigger: 'keyboard', key: 'N', modifiers: ['cmd'] },
]

// Load shortcuts
const loadShortcuts = () => {
  try {
    const stored = localStorage.getItem(SHORTCUTS_KEY)
    return stored ? JSON.parse(stored) : DEFAULT_SHORTCUTS
  } catch {
    return DEFAULT_SHORTCUTS
  }
}

// Save shortcuts
const saveShortcuts = (shortcuts) => {
  localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(shortcuts))
}

export default function ShortcutActions({ onAction }) {
  const prefersReducedMotion = useReducedMotion()
  const [shortcuts, setShortcuts] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingShortcut, setEditingShortcut] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')

  // New shortcut state
  const [newShortcut, setNewShortcut] = useState({
    actionId: '',
    trigger: 'siri',
    phrase: '',
    key: '',
    modifiers: [],
  })

  // Load shortcuts on mount
  useEffect(() => {
    setShortcuts(loadShortcuts())
  }, [])

  // Add shortcut
  const addShortcut = () => {
    if (!newShortcut.actionId) return

    const shortcut = {
      id: `shortcut-${Date.now()}`,
      ...newShortcut,
    }

    const updated = [...shortcuts, shortcut]
    setShortcuts(updated)
    saveShortcuts(updated)
    resetNewShortcut()
    setShowAddModal(false)
  }

  // Delete shortcut
  const deleteShortcut = (id) => {
    const updated = shortcuts.filter(s => s.id !== id)
    setShortcuts(updated)
    saveShortcuts(updated)
  }

  // Reset new shortcut form
  const resetNewShortcut = () => {
    setNewShortcut({
      actionId: '',
      trigger: 'siri',
      phrase: '',
      key: '',
      modifiers: [],
    })
  }

  // Get action by ID
  const getAction = (actionId) => AVAILABLE_ACTIONS.find(a => a.id === actionId)

  // Execute shortcut
  const executeShortcut = (shortcut) => {
    const action = getAction(shortcut.actionId)
    if (action) {
      onAction?.(action.id)
    }
  }

  // Categories
  const categories = [
    { id: 'all', name: 'All' },
    { id: 'focus', name: 'Focus' },
    { id: 'tasks', name: 'Tasks' },
    { id: 'audio', name: 'Audio' },
    { id: 'tracking', name: 'Tracking' },
  ]

  // Filter actions
  const filteredActions = activeCategory === 'all'
    ? AVAILABLE_ACTIONS
    : AVAILABLE_ACTIONS.filter(a => a.category === activeCategory)

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
              <Command className="w-6 h-6 text-orange-400" />
              Quick Actions
            </h2>
            <p className="text-sm text-white/50">Siri, widgets & keyboard shortcuts</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-white/70 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-4 gap-2">
            {AVAILABLE_ACTIONS.slice(0, 8).map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.id}
                  onClick={() => onAction?.(action.id)}
                  className={`p-3 rounded-xl bg-${action.color}-500/10 hover:bg-${action.color}-500/20 transition-colors flex flex-col items-center gap-1`}
                >
                  <Icon className={`w-5 h-5 text-${action.color}-400`} />
                  <span className="text-xs text-center text-white/70 line-clamp-2">
                    {action.name.split(' ').slice(0, 2).join(' ')}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Configured Shortcuts */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-white/70 mb-3">Your Shortcuts</h3>
          {shortcuts.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <Zap className="w-10 h-10 text-white/20 mx-auto mb-2" />
              <p className="text-sm text-white/50">No shortcuts configured</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-3 px-4 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-sm transition-colors"
              >
                Create Your First Shortcut
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {shortcuts.map((shortcut) => {
                const action = getAction(shortcut.actionId)
                if (!action) return null
                const Icon = action.icon

                return (
                  <motion.div
                    key={shortcut.id}
                    {...getMotionProps(prefersReducedMotion, {
                      initial: { opacity: 0, x: -10 },
                      animate: { opacity: 1, x: 0 }
                    })}
                    className="glass-card p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-${action.color}-500/20 flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 text-${action.color}-400`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{action.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {shortcut.trigger === 'siri' ? (
                              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                                🎤 "{shortcut.phrase}"
                              </span>
                            ) : (
                              <span className="text-xs bg-slate-500/20 text-slate-400 px-2 py-0.5 rounded font-mono">
                                {shortcut.modifiers?.includes('cmd') && '⌘'}
                                {shortcut.modifiers?.includes('shift') && '⇧'}
                                {shortcut.modifiers?.includes('alt') && '⌥'}
                                {shortcut.key}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => executeShortcut(shortcut)}
                          className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteShortcut(shortcut.id)}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Integration Tips */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/70">Integration Tips</h3>

          {/* Siri */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <Mic className="w-5 h-5 text-purple-400" />
              <span className="font-medium">Siri Shortcuts</span>
            </div>
            <p className="text-sm text-white/60 mb-2">
              Use voice commands like "Hey Siri, start my focus" to trigger actions hands-free.
            </p>
            <button className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">
              Open Shortcuts App <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Keyboard */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <Keyboard className="w-5 h-5 text-slate-400" />
              <span className="font-medium">Keyboard Shortcuts</span>
            </div>
            <p className="text-sm text-white/60">
              Quick keyboard combos for desktop. Press ⌘K to see all available shortcuts.
            </p>
          </div>

          {/* Apple Watch */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <Smartphone className="w-5 h-5 text-blue-400" />
              <span className="font-medium">Apple Watch</span>
            </div>
            <p className="text-sm text-white/60">
              Start focus sessions and log moods right from your wrist.
            </p>
          </div>
        </div>

        {/* Add Shortcut Modal */}
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
                className="bg-[#1a1a2e] rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="font-display text-lg font-semibold mb-4">Create Shortcut</h3>

                {/* Trigger Type */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Trigger Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setNewShortcut(prev => ({ ...prev, trigger: 'siri' }))}
                      className={`p-3 rounded-xl flex items-center gap-2 transition-colors ${
                        newShortcut.trigger === 'siri'
                          ? 'bg-purple-500/20 border border-purple-500/30 text-purple-400'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                      <span>Siri / Voice</span>
                    </button>
                    <button
                      onClick={() => setNewShortcut(prev => ({ ...prev, trigger: 'keyboard' }))}
                      className={`p-3 rounded-xl flex items-center gap-2 transition-colors ${
                        newShortcut.trigger === 'keyboard'
                          ? 'bg-slate-500/20 border border-slate-500/30 text-slate-300'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <Keyboard className="w-4 h-4" />
                      <span>Keyboard</span>
                    </button>
                  </div>
                </div>

                {/* Action Selection */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Action</label>
                  <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap transition-colors ${
                          activeCategory === cat.id
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-white/5 text-white/50 hover:bg-white/10'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredActions.map((action) => {
                      const Icon = action.icon
                      return (
                        <button
                          key={action.id}
                          onClick={() => setNewShortcut(prev => ({ ...prev, actionId: action.id }))}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                            newShortcut.actionId === action.id
                              ? `bg-${action.color}-500/20 border border-${action.color}-500/30`
                              : 'bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <Icon className={`w-4 h-4 text-${action.color}-400`} />
                          <span className="text-sm">{action.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Siri Phrase */}
                {newShortcut.trigger === 'siri' && (
                  <div className="mb-4">
                    <label className="block text-sm text-white/70 mb-1">Siri Phrase</label>
                    <input
                      type="text"
                      value={newShortcut.phrase}
                      onChange={(e) => setNewShortcut(prev => ({ ...prev, phrase: e.target.value }))}
                      placeholder='e.g., "Start my focus"'
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-orange-500/50 outline-none"
                    />
                  </div>
                )}

                {/* Keyboard Shortcut */}
                {newShortcut.trigger === 'keyboard' && (
                  <div className="mb-4">
                    <label className="block text-sm text-white/70 mb-2">Key Combination</label>
                    <div className="flex gap-2 mb-2">
                      {['cmd', 'shift', 'alt'].map((mod) => (
                        <button
                          key={mod}
                          onClick={() => {
                            setNewShortcut(prev => ({
                              ...prev,
                              modifiers: prev.modifiers.includes(mod)
                                ? prev.modifiers.filter(m => m !== mod)
                                : [...prev.modifiers, mod]
                            }))
                          }}
                          className={`px-3 py-2 rounded-lg font-mono text-sm transition-colors ${
                            newShortcut.modifiers.includes(mod)
                              ? 'bg-slate-500/30 text-white'
                              : 'bg-white/5 text-white/50'
                          }`}
                        >
                          {mod === 'cmd' ? '⌘' : mod === 'shift' ? '⇧' : '⌥'}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={newShortcut.key}
                      onChange={(e) => setNewShortcut(prev => ({ ...prev, key: e.target.value.toUpperCase().slice(0, 1) }))}
                      placeholder="Key (e.g., N)"
                      maxLength={1}
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-orange-500/50 outline-none font-mono text-center text-lg"
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      resetNewShortcut()
                    }}
                    className="flex-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addShortcut}
                    disabled={!newShortcut.actionId}
                    className="flex-1 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Create Shortcut
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
