import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Clock,
  AlertTriangle,
  Coffee,
  Droplets,
  Eye,
  Move,
  X,
  Bell,
  BellOff,
  Settings,
  Check,
  Pause,
  Play,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const STORAGE_KEY = 'nero_hyperfocus_settings'
const LOG_KEY = 'nero_hyperfocus_log'

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  checkIntervalMinutes: 45,
  reminders: {
    water: true,
    posture: true,
    eyes: true,
    stretch: true,
  },
  hardStopEnabled: false,
  hardStopTime: null,
}

// Get settings
const getSettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS
  } catch (e) {
    return DEFAULT_SETTINGS
  }
}

// Save settings
const saveSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (e) {
    console.error('Failed to save settings:', e)
  }
}

// Log hyperfocus episode
const logEpisode = (duration) => {
  try {
    const log = JSON.parse(localStorage.getItem(LOG_KEY) || '[]')
    log.push({
      date: new Date().toISOString(),
      durationMinutes: duration,
    })
    localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-100)))
  } catch (e) {
    console.error('Failed to log episode:', e)
  }
}

// Reminder types
const REMINDER_TYPES = [
  {
    id: 'water',
    icon: Droplets,
    title: 'Hydration Check',
    message: "Time for water! Your brain needs hydration to focus.",
    color: 'blue',
  },
  {
    id: 'posture',
    icon: Move,
    title: 'Posture Check',
    message: "Quick posture check! Shoulders back, sit up straight.",
    color: 'green',
  },
  {
    id: 'eyes',
    icon: Eye,
    title: '20-20-20 Rule',
    message: "Look at something 20 feet away for 20 seconds.",
    color: 'purple',
  },
  {
    id: 'stretch',
    icon: Move,
    title: 'Stretch Break',
    message: "Stand up and stretch for 30 seconds. Your body will thank you!",
    color: 'orange',
  },
]

// Check-in Modal
function CheckInModal({ onDismiss, onTakeBreak, sessionMinutes, reminderType }) {
  const prefersReducedMotion = useReducedMotion()
  const reminder = REMINDER_TYPES.find(r => r.id === reminderType) || REMINDER_TYPES[0]
  const Icon = reminder.icon

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        {...getMotionProps(prefersReducedMotion, {
          initial: { opacity: 0, scale: 0.9, y: 20 },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.9, y: 20 },
        })}
        className="bg-surface rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-white/10"
      >
        {/* Header */}
        <div className={`p-6 bg-${reminder.color}-500/20 border-b border-white/10`}>
          <div className="flex items-center justify-center mb-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`w-16 h-16 rounded-full bg-${reminder.color}-500/30 flex items-center justify-center`}
            >
              <Icon className={`w-8 h-8 text-${reminder.color}-400`} />
            </motion.div>
          </div>
          <h2 className="font-display text-xl font-semibold text-center">
            {reminder.title}
          </h2>
          <p className="text-center text-white/60 mt-1">
            You've been focused for {sessionMinutes} minutes
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-center text-white/80">
            {reminder.message}
          </p>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onDismiss}
              className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
            >
              <Check className="w-6 h-6 text-green-400" />
              <span className="text-sm">Done, continue</span>
            </button>
            <button
              onClick={onTakeBreak}
              className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
            >
              <Coffee className="w-6 h-6 text-amber-400" />
              <span className="text-sm">Take a break</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Hard Stop Warning Modal
function HardStopModal({ time, onDismiss, onExtend }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        {...getMotionProps(prefersReducedMotion, {
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
        })}
        className="bg-surface rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-red-500/30"
      >
        <div className="p-6 bg-red-500/20 border-b border-red-500/30">
          <div className="flex items-center justify-center mb-4">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="w-16 h-16 rounded-full bg-red-500/30 flex items-center justify-center"
            >
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </motion.div>
          </div>
          <h2 className="font-display text-xl font-semibold text-center text-red-400">
            Hard Stop!
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-center text-white/80">
            You set a hard stop for <span className="font-bold text-white">{time}</span>.
            Time to wrap up!
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onDismiss}
              className="py-3 bg-red-500 hover:bg-red-600 rounded-xl font-medium transition-colors"
            >
              Stop Now
            </button>
            <button
              onClick={onExtend}
              className="py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors"
            >
              +15 minutes
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function HyperfocusGuard({ isTimerRunning, sessionStartTime, onRequestBreak }) {
  const prefersReducedMotion = useReducedMotion()
  const [settings, setSettings] = useState(getSettings)
  const [showSettings, setShowSettings] = useState(false)
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [showHardStop, setShowHardStop] = useState(false)
  const [currentReminder, setCurrentReminder] = useState('water')
  const [sessionMinutes, setSessionMinutes] = useState(0)
  const [lastCheckIn, setLastCheckIn] = useState(Date.now())

  // Save settings when changed
  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  // Track session time and trigger reminders
  useEffect(() => {
    if (!isTimerRunning || !settings.enabled) return

    const interval = setInterval(() => {
      const now = Date.now()
      const start = sessionStartTime || now
      const minutes = Math.floor((now - start) / 60000)
      setSessionMinutes(minutes)

      // Check if it's time for a reminder
      const minutesSinceLastCheckIn = Math.floor((now - lastCheckIn) / 60000)
      if (minutesSinceLastCheckIn >= settings.checkIntervalMinutes) {
        // Rotate through enabled reminders
        const enabledReminders = REMINDER_TYPES.filter(r => settings.reminders[r.id])
        if (enabledReminders.length > 0) {
          const randomReminder = enabledReminders[Math.floor(Math.random() * enabledReminders.length)]
          setCurrentReminder(randomReminder.id)
          setShowCheckIn(true)
          setLastCheckIn(now)
          logEpisode(minutes)
        }
      }

      // Check hard stop
      if (settings.hardStopEnabled && settings.hardStopTime) {
        const [hours, mins] = settings.hardStopTime.split(':').map(Number)
        const stopTime = new Date()
        stopTime.setHours(hours, mins, 0, 0)

        if (now >= stopTime.getTime() && now < stopTime.getTime() + 60000) {
          setShowHardStop(true)
        }
      }
    }, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [isTimerRunning, sessionStartTime, settings, lastCheckIn])

  const handleDismissCheckIn = () => {
    setShowCheckIn(false)
  }

  const handleTakeBreak = () => {
    setShowCheckIn(false)
    onRequestBreak?.()
  }

  const handleDismissHardStop = () => {
    setShowHardStop(false)
    onRequestBreak?.()
  }

  const handleExtendHardStop = () => {
    if (!settings.hardStopTime) return
    const [hours, mins] = settings.hardStopTime.split(':').map(Number)
    const newTime = new Date()
    newTime.setHours(hours, mins + 15, 0, 0)
    setSettings(prev => ({
      ...prev,
      hardStopTime: `${newTime.getHours().toString().padStart(2, '0')}:${newTime.getMinutes().toString().padStart(2, '0')}`,
    }))
    setShowHardStop(false)
  }

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const updateReminder = (key, value) => {
    setSettings(prev => ({
      ...prev,
      reminders: { ...prev.reminders, [key]: value },
    }))
  }

  return (
    <>
      {/* Settings Panel - shown as a view */}
      <div className="p-4 h-full overflow-auto">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-sm mb-3">
              <Shield className="w-4 h-4" />
              <span>Hyperfocus Guard</span>
            </div>
            <h1 className="font-display text-2xl font-bold mb-2">Protect Your Focus</h1>
            <p className="text-white/60">Gentle reminders to prevent unhealthy hyperfocus</p>
          </div>

          {/* Current Session */}
          {isTimerRunning && (
            <motion.div
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
              })}
              className="bg-nero-500/20 border border-nero-500/30 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-nero-500 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/60">Current Session</p>
                  <p className="font-display font-semibold text-lg">{sessionMinutes} minutes</p>
                </div>
                {settings.enabled ? (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                    Protected
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                    Unprotected
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* Master Toggle */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.enabled ? (
                  <Bell className="w-5 h-5 text-nero-400" />
                ) : (
                  <BellOff className="w-5 h-5 text-white/50" />
                )}
                <div>
                  <p className="font-medium">Hyperfocus Guard</p>
                  <p className="text-sm text-white/50">
                    {settings.enabled ? 'Active - will send reminders' : 'Disabled'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => updateSetting('enabled', !settings.enabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  settings.enabled ? 'bg-nero-500' : 'bg-white/20'
                }`}
              >
                <motion.div
                  className="w-5 h-5 rounded-full bg-white absolute top-0.5"
                  animate={{ left: settings.enabled ? '26px' : '2px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          </div>

          {/* Check Interval */}
          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">Check-in Interval</p>
              <span className="text-nero-400 font-medium">{settings.checkIntervalMinutes} min</span>
            </div>
            <input
              type="range"
              min="15"
              max="90"
              step="5"
              value={settings.checkIntervalMinutes}
              onChange={(e) => updateSetting('checkIntervalMinutes', Number(e.target.value))}
              className="w-full accent-nero-500"
            />
            <div className="flex justify-between text-xs text-white/50">
              <span>15 min</span>
              <span>90 min</span>
            </div>
          </div>

          {/* Reminder Types */}
          <div className="space-y-3">
            <h3 className="font-medium text-white/70">Reminder Types</h3>
            {REMINDER_TYPES.map((reminder) => {
              const Icon = reminder.icon
              return (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 text-${reminder.color}-400`} />
                    <div>
                      <p className="text-sm font-medium">{reminder.title}</p>
                      <p className="text-xs text-white/50">{reminder.message}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateReminder(reminder.id, !settings.reminders[reminder.id])}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      settings.reminders[reminder.id] ? 'bg-nero-500' : 'bg-white/20'
                    }`}
                  >
                    <motion.div
                      className="w-4 h-4 rounded-full bg-white absolute top-0.5"
                      animate={{ left: settings.reminders[reminder.id] ? '22px' : '2px' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Hard Stop */}
          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Hard Stop Time</p>
                <p className="text-sm text-white/50">Force a break at a specific time</p>
              </div>
              <button
                onClick={() => updateSetting('hardStopEnabled', !settings.hardStopEnabled)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  settings.hardStopEnabled ? 'bg-red-500' : 'bg-white/20'
                }`}
              >
                <motion.div
                  className="w-4 h-4 rounded-full bg-white absolute top-0.5"
                  animate={{ left: settings.hardStopEnabled ? '22px' : '2px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
            {settings.hardStopEnabled && (
              <input
                type="time"
                value={settings.hardStopTime || ''}
                onChange={(e) => updateSetting('hardStopTime', e.target.value)}
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            )}
          </div>

          {/* Tip */}
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-sm text-white/60">
              <AlertTriangle className="w-4 h-4 inline mr-1 text-amber-400" />
              <span className="text-amber-400 font-medium">Why this matters:</span> Hyperfocus can lead to
              dehydration, poor posture, eye strain, and burnout. Regular check-ins help maintain sustainable focus.
            </p>
          </div>
        </div>
      </div>

      {/* Check-in Modal */}
      <AnimatePresence>
        {showCheckIn && (
          <CheckInModal
            onDismiss={handleDismissCheckIn}
            onTakeBreak={handleTakeBreak}
            sessionMinutes={sessionMinutes}
            reminderType={currentReminder}
          />
        )}
      </AnimatePresence>

      {/* Hard Stop Modal */}
      <AnimatePresence>
        {showHardStop && (
          <HardStopModal
            time={settings.hardStopTime}
            onDismiss={handleDismissHardStop}
            onExtend={handleExtendHardStop}
          />
        )}
      </AnimatePresence>
    </>
  )
}
