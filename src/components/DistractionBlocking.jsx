import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  ShieldOff,
  Plus,
  X,
  Smartphone,
  Globe,
  MessageSquare,
  Mail,
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  Gamepad2,
  Music,
  ShoppingCart,
  Clock,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Check,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage keys
const BLOCKLIST_KEY = 'nero_distraction_blocklist'
const BLOCK_SCHEDULE_KEY = 'nero_block_schedule'
const BLOCK_STATE_KEY = 'nero_block_state'

// Pre-defined distraction categories
const DISTRACTION_CATEGORIES = [
  {
    id: 'social_media',
    name: 'Social Media',
    icon: Instagram,
    color: 'pink',
    apps: ['Instagram', 'TikTok', 'Snapchat', 'Facebook', 'Twitter/X', 'LinkedIn'],
  },
  {
    id: 'messaging',
    name: 'Messaging',
    icon: MessageSquare,
    color: 'blue',
    apps: ['WhatsApp', 'Messenger', 'Telegram', 'Discord', 'Slack', 'iMessage'],
  },
  {
    id: 'video',
    name: 'Video & Streaming',
    icon: Youtube,
    color: 'red',
    apps: ['YouTube', 'Netflix', 'Twitch', 'TikTok', 'Hulu', 'Disney+'],
  },
  {
    id: 'email',
    name: 'Email',
    icon: Mail,
    color: 'yellow',
    apps: ['Gmail', 'Outlook', 'Apple Mail', 'Yahoo Mail'],
  },
  {
    id: 'games',
    name: 'Games',
    icon: Gamepad2,
    color: 'purple',
    apps: ['Steam', 'Mobile Games', 'Console', 'Browser Games'],
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: ShoppingCart,
    color: 'green',
    apps: ['Amazon', 'eBay', 'Etsy', 'Target', 'Shopping Apps'],
  },
  {
    id: 'news',
    name: 'News & Forums',
    icon: Globe,
    color: 'orange',
    apps: ['Reddit', 'Hacker News', 'News Sites', 'Forums'],
  },
  {
    id: 'music',
    name: 'Music & Audio',
    icon: Music,
    color: 'cyan',
    apps: ['Spotify', 'Apple Music', 'Podcasts', 'SoundCloud'],
  },
]

// Load blocklist
const loadBlocklist = () => {
  try {
    const stored = localStorage.getItem(BLOCKLIST_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save blocklist
const saveBlocklist = (list) => {
  localStorage.setItem(BLOCKLIST_KEY, JSON.stringify(list))
}

// Load block state
const loadBlockState = () => {
  try {
    const stored = localStorage.getItem(BLOCK_STATE_KEY)
    return stored ? JSON.parse(stored) : { isActive: false, startedAt: null, duration: null }
  } catch {
    return { isActive: false, startedAt: null, duration: null }
  }
}

// Save block state
const saveBlockState = (state) => {
  localStorage.setItem(BLOCK_STATE_KEY, JSON.stringify(state))
}

// Load schedule
const loadSchedule = () => {
  try {
    const stored = localStorage.getItem(BLOCK_SCHEDULE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save schedule
const saveSchedule = (schedule) => {
  localStorage.setItem(BLOCK_SCHEDULE_KEY, JSON.stringify(schedule))
}

export default function DistractionBlocking({ isTimerActive }) {
  const prefersReducedMotion = useReducedMotion()
  const [blocklist, setBlocklist] = useState([])
  const [blockState, setBlockState] = useState({ isActive: false, startedAt: null, duration: null })
  const [schedule, setSchedule] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewMode, setViewMode] = useState('blocklist') // 'blocklist' | 'schedule'

  // Load data on mount
  useEffect(() => {
    setBlocklist(loadBlocklist())
    setBlockState(loadBlockState())
    setSchedule(loadSchedule())
  }, [])

  // Check if blocking is currently active
  const isBlocking = useMemo(() => {
    if (blockState.isActive) return true
    if (isTimerActive) return true

    // Check scheduled blocks
    const now = new Date()
    const currentDay = now.getDay()
    const currentTime = now.getHours() * 60 + now.getMinutes()

    return schedule.some(s => {
      if (!s.enabled) return false
      if (!s.days.includes(currentDay)) return false

      const [startH, startM] = s.startTime.split(':').map(Number)
      const [endH, endM] = s.endTime.split(':').map(Number)
      const start = startH * 60 + startM
      const end = endH * 60 + endM

      return currentTime >= start && currentTime <= end
    })
  }, [blockState.isActive, isTimerActive, schedule])

  // Toggle category in blocklist
  const toggleCategory = (categoryId) => {
    let updated
    if (blocklist.includes(categoryId)) {
      updated = blocklist.filter(c => c !== categoryId)
    } else {
      updated = [...blocklist, categoryId]
    }
    setBlocklist(updated)
    saveBlocklist(updated)
  }

  // Quick block for duration
  const startQuickBlock = (minutes) => {
    const state = {
      isActive: true,
      startedAt: new Date().toISOString(),
      duration: minutes,
    }
    setBlockState(state)
    saveBlockState(state)
  }

  // Stop blocking
  const stopBlocking = () => {
    const state = { isActive: false, startedAt: null, duration: null }
    setBlockState(state)
    saveBlockState(state)
  }

  // Add schedule
  const addSchedule = (newSchedule) => {
    const updated = [...schedule, { ...newSchedule, id: Date.now().toString(), enabled: true }]
    setSchedule(updated)
    saveSchedule(updated)
    setShowAddModal(false)
  }

  // Toggle schedule
  const toggleSchedule = (scheduleId) => {
    const updated = schedule.map(s =>
      s.id === scheduleId ? { ...s, enabled: !s.enabled } : s
    )
    setSchedule(updated)
    saveSchedule(updated)
  }

  // Delete schedule
  const deleteSchedule = (scheduleId) => {
    const updated = schedule.filter(s => s.id !== scheduleId)
    setSchedule(updated)
    saveSchedule(updated)
  }

  // Remaining time for quick block
  const remainingTime = useMemo(() => {
    if (!blockState.isActive || !blockState.startedAt || !blockState.duration) return null

    const elapsed = (Date.now() - new Date(blockState.startedAt).getTime()) / 1000 / 60
    const remaining = blockState.duration - elapsed

    if (remaining <= 0) {
      // Auto stop
      stopBlocking()
      return null
    }

    return Math.ceil(remaining)
  }, [blockState])

  // Format time display
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${minutes} ${ampm}`
  }

  // Day abbreviations
  const dayAbbrev = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
            <h2 className="font-display text-xl font-semibold">Distraction Blocking</h2>
            <p className="text-sm text-white/50">Set boundaries with distractions</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
            isBlocking ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
          }`}>
            {isBlocking ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
            <span className="text-sm">{isBlocking ? 'Active' : 'Inactive'}</span>
          </div>
        </div>

        {/* Current Block Status */}
        {isBlocking && (
          <motion.div
            {...getMotionProps(prefersReducedMotion, {
              initial: { opacity: 0, scale: 0.95 },
              animate: { opacity: 1, scale: 1 }
            })}
            className="mb-4 p-4 glass-card border border-red-500/30 bg-gradient-to-r from-red-500/10 to-orange-500/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="font-medium">Blocking Active</p>
                  {remainingTime && (
                    <p className="text-sm text-white/50">{remainingTime} minutes remaining</p>
                  )}
                  {isTimerActive && (
                    <p className="text-sm text-white/50">Active during focus session</p>
                  )}
                </div>
              </div>

              {blockState.isActive && (
                <button
                  onClick={stopBlocking}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm transition-colors"
                >
                  Stop
                </button>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {blocklist.map(catId => {
                const cat = DISTRACTION_CATEGORIES.find(c => c.id === catId)
                if (!cat) return null
                const Icon = cat.icon
                return (
                  <span key={catId} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 text-xs">
                    <Icon className="w-3 h-3" />
                    {cat.name}
                  </span>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Quick Block Buttons */}
        {!isBlocking && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-white/70 mb-2">Quick Block</h3>
            <div className="flex gap-2">
              {[15, 30, 60, 120].map((mins) => (
                <button
                  key={mins}
                  onClick={() => startQuickBlock(mins)}
                  disabled={blocklist.length === 0}
                  className={`flex-1 px-3 py-2 rounded-xl text-sm transition-colors ${
                    blocklist.length > 0
                      ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                      : 'bg-white/5 text-white/30 cursor-not-allowed'
                  }`}
                >
                  {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                </button>
              ))}
            </div>
            {blocklist.length === 0 && (
              <p className="text-xs text-white/40 mt-2">Select categories below to enable blocking</p>
            )}
          </div>
        )}

        {/* View Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'blocklist', label: 'Categories' },
            { id: 'schedule', label: 'Schedule' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                viewMode === tab.id
                  ? 'bg-white/10 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Blocklist View */}
        {viewMode === 'blocklist' && (
          <div className="space-y-2">
            <p className="text-sm text-white/50 mb-3">
              Select which distractions to block during focus time:
            </p>

            {DISTRACTION_CATEGORIES.map((category) => {
              const Icon = category.icon
              const isSelected = blocklist.includes(category.id)

              return (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isSelected
                      ? `bg-${category.color}-500/20 border border-${category.color}-500/30`
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-${category.color}-500/20 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${category.color}-400`} />
                  </div>

                  <div className="flex-1 text-left">
                    <p className="font-medium">{category.name}</p>
                    <p className="text-xs text-white/50">{category.apps.slice(0, 4).join(', ')}</p>
                  </div>

                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-green-500' : 'bg-white/10'
                  }`}>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                </button>
              )
            })}

            <div className="mt-4 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-400 font-medium">Important</p>
                  <p className="text-xs text-white/60 mt-1">
                    This is a reminder system. For actual app blocking, consider using your
                    device's built-in Screen Time (iOS) or Digital Wellbeing (Android) features.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule View */}
        {viewMode === 'schedule' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-white/50">Scheduled blocking times:</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {schedule.map((s) => (
              <div
                key={s.id}
                className={`glass-card p-3 ${!s.enabled ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{s.name || 'Focus Block'}</p>
                    <p className="text-sm text-white/50">
                      {formatTime(s.startTime)} - {formatTime(s.endTime)}
                    </p>
                    <div className="flex gap-1 mt-1">
                      {s.days.map(d => (
                        <span key={d} className="text-xs px-1.5 py-0.5 rounded bg-white/10">
                          {dayAbbrev[d]}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSchedule(s.id)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      {s.enabled ? (
                        <ToggleRight className="w-6 h-6 text-green-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-white/30" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteSchedule(s.id)}
                      className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400/50" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {schedule.length === 0 && (
              <div className="text-center py-8">
                <Clock className="w-10 h-10 text-white/20 mx-auto mb-2" />
                <p className="text-sm text-white/50">No scheduled blocks</p>
                <p className="text-xs text-white/30 mt-1">
                  Add automatic blocking during your focus hours
                </p>
              </div>
            )}
          </div>
        )}

        {/* Add Schedule Modal */}
        <AnimatePresence>
          {showAddModal && (
            <AddScheduleModal
              prefersReducedMotion={prefersReducedMotion}
              onClose={() => setShowAddModal(false)}
              onSave={addSchedule}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// Add Schedule Modal Component
function AddScheduleModal({ prefersReducedMotion, onClose, onSave }) {
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    startTime: '09:00',
    endTime: '12:00',
    days: [1, 2, 3, 4, 5], // Mon-Fri by default
  })

  const dayAbbrev = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  const toggleDay = (day) => {
    setNewSchedule(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day].sort()
    }))
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      {...getMotionProps(prefersReducedMotion, {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
      })}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative w-full max-w-md glass-card p-5"
        {...getMotionProps(prefersReducedMotion, {
          initial: { y: 100, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: 100, opacity: 0 }
        })}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold">Add Schedule</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm text-white/70 mb-2">Name (optional)</label>
          <input
            type="text"
            value={newSchedule.name}
            onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Morning Focus"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
          />
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm text-white/70 mb-2">Start Time</label>
            <input
              type="time"
              value={newSchedule.startTime}
              onChange={(e) => setNewSchedule(prev => ({ ...prev, startTime: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/20"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-2">End Time</label>
            <input
              type="time"
              value={newSchedule.endTime}
              onChange={(e) => setNewSchedule(prev => ({ ...prev, endTime: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/20"
            />
          </div>
        </div>

        {/* Days */}
        <div className="mb-6">
          <label className="block text-sm text-white/70 mb-2">Days</label>
          <div className="flex gap-2">
            {dayAbbrev.map((day, i) => (
              <button
                key={i}
                onClick={() => toggleDay(i)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-colors ${
                  newSchedule.days.includes(i)
                    ? 'bg-nero-500 text-white'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(newSchedule)}
            disabled={newSchedule.days.length === 0}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
              newSchedule.days.length > 0
                ? 'bg-nero-500 hover:bg-nero-600 text-white'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            Add Schedule
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
