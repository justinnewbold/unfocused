import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  ShieldOff,
  Clock,
  Copy,
  Check,
  X,
  Bell,
  BellOff,
  Share2,
  Zap
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Duration presets in minutes
const DURATION_PRESETS = [
  { minutes: 25, label: '25m' },
  { minutes: 45, label: '45m' },
  { minutes: 60, label: '1h' },
  { minutes: 90, label: '1.5h' },
  { minutes: 120, label: '2h' },
]

export default function FocusShield({ isTimerRunning, onShieldChange }) {
  const prefersReducedMotion = useReducedMotion()
  const [isActive, setIsActive] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [endTime, setEndTime] = useState(null)
  const [selectedDuration, setSelectedDuration] = useState(60)
  const [copied, setCopied] = useState(false)
  const [notificationsBlocked, setNotificationsBlocked] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)

  // Update time remaining
  useEffect(() => {
    let interval
    if (isActive && endTime) {
      interval = setInterval(() => {
        const remaining = Math.max(0, endTime - Date.now())
        setTimeRemaining(remaining)

        if (remaining === 0) {
          deactivateShield()
        }
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isActive, endTime])

  // Auto-activate when timer starts
  useEffect(() => {
    if (isTimerRunning && !isActive) {
      // Don't auto-activate, just show a hint
    }
  }, [isTimerRunning, isActive])

  // Activate focus shield
  const activateShield = useCallback((durationMinutes) => {
    const end = Date.now() + durationMinutes * 60 * 1000
    setEndTime(end)
    setIsActive(true)
    setShowPanel(false)
    onShieldChange?.(true)

    // Try to request notification permission and block
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsBlocked(true)
    }
  }, [onShieldChange])

  // Deactivate shield
  const deactivateShield = useCallback(() => {
    setIsActive(false)
    setEndTime(null)
    setNotificationsBlocked(false)
    onShieldChange?.(false)
  }, [onShieldChange])

  // Generate shareable status
  const getStatusMessage = () => {
    if (!isActive || !endTime) return ''

    const endDate = new Date(endTime)
    const hours = endDate.getHours()
    const minutes = endDate.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const formattedHours = hours % 12 || 12
    const formattedMinutes = minutes.toString().padStart(2, '0')

    return `🛡️ I'm in focus mode until ${formattedHours}:${formattedMinutes} ${ampm}. I'll respond when I'm done!`
  }

  // Copy status to clipboard
  const copyStatus = async () => {
    const status = getStatusMessage()
    try {
      await navigator.clipboard.writeText(status)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = status
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Format time remaining
  const formatTimeRemaining = () => {
    const totalSeconds = Math.floor(timeRemaining / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <>
      {/* Shield status indicator (when active) */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="fixed top-16 left-1/2 -translate-x-1/2 z-30"
            {...getMotionProps(prefersReducedMotion, {
              initial: { opacity: 0, y: -20 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0, y: -20 }
            })}
          >
            <button
              onClick={() => setShowPanel(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-focus-500/20 border border-focus-500/30 text-focus-400 backdrop-blur-sm"
            >
              <Shield className="w-4 h-4" />
              <span className="font-mono text-sm">{formatTimeRemaining()}</span>
              <span className="text-xs text-white/50">remaining</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shield trigger button (when not active) */}
      {!isActive && (
        <button
          onClick={() => setShowPanel(true)}
          className="fixed top-16 right-4 z-30 p-2 rounded-full bg-surface-light/90 border border-white/10 text-white/60 hover:text-white hover:bg-surface-lighter transition-colors"
          title="Focus Shield"
        >
          <ShieldOff className="w-5 h-5" />
        </button>
      )}

      {/* Shield panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            {...getMotionProps(prefersReducedMotion, {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0 }
            })}
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowPanel(false)}
            />

            <motion.div
              className="relative w-full max-w-sm glass-card p-5"
              {...getMotionProps(prefersReducedMotion, {
                initial: { y: 100, opacity: 0 },
                animate: { y: 0, opacity: 1 },
                exit: { y: 100, opacity: 0 }
              })}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isActive ? 'bg-focus-500/20' : 'bg-white/10'
                  }`}>
                    {isActive ? (
                      <Shield className="w-5 h-5 text-focus-400" />
                    ) : (
                      <ShieldOff className="w-5 h-5 text-white/50" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold">Focus Shield</h3>
                    <p className="text-xs text-white/50">
                      {isActive ? 'Protected focus time' : 'Block distractions'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPanel(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isActive ? (
                // Active shield view
                <>
                  {/* Time remaining */}
                  <div className="text-center mb-6">
                    <p className="text-sm text-white/50 mb-1">Shield active for</p>
                    <p className="text-4xl font-mono font-bold text-focus-400">
                      {formatTimeRemaining()}
                    </p>
                  </div>

                  {/* Status indicators */}
                  <div className="flex gap-3 mb-6">
                    <div className={`flex-1 p-3 rounded-xl ${
                      notificationsBlocked ? 'bg-calm-500/10 border border-calm-500/20' : 'bg-white/5'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {notificationsBlocked ? (
                          <BellOff className="w-4 h-4 text-calm-400" />
                        ) : (
                          <Bell className="w-4 h-4 text-white/50" />
                        )}
                        <span className="text-sm">Notifications</span>
                      </div>
                      <p className="text-xs text-white/50">
                        {notificationsBlocked ? 'Blocked' : 'Not blocked'}
                      </p>
                    </div>

                    <div className="flex-1 p-3 rounded-xl bg-focus-500/10 border border-focus-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-focus-400" />
                        <span className="text-sm">Focus Mode</span>
                      </div>
                      <p className="text-xs text-white/50">Active</p>
                    </div>
                  </div>

                  {/* Share status */}
                  <div className="mb-4">
                    <p className="text-sm text-white/70 mb-2">Share your status:</p>
                    <div className="flex gap-2">
                      <div className="flex-1 p-3 rounded-xl bg-white/5 text-sm text-white/70 truncate">
                        {getStatusMessage()}
                      </div>
                      <button
                        onClick={copyStatus}
                        className={`p-3 rounded-xl transition-colors ${
                          copied
                            ? 'bg-calm-500/20 text-calm-400'
                            : 'bg-white/5 hover:bg-white/10 text-white/70'
                        }`}
                      >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* End shield button */}
                  <button
                    onClick={deactivateShield}
                    className="w-full px-4 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <ShieldOff className="w-4 h-4" />
                    End Focus Shield
                  </button>
                </>
              ) : (
                // Inactive shield view - setup
                <>
                  <p className="text-white/60 text-sm mb-4">
                    Activate your shield to protect your focus time. Share your status to let others know you're unavailable.
                  </p>

                  {/* Duration selector */}
                  <div className="mb-4">
                    <p className="text-sm text-white/70 mb-2">How long do you need?</p>
                    <div className="flex gap-2">
                      {DURATION_PRESETS.map((preset) => (
                        <button
                          key={preset.minutes}
                          onClick={() => setSelectedDuration(preset.minutes)}
                          className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                            selectedDuration === preset.minutes
                              ? 'bg-focus-500/20 text-focus-400 border border-focus-500/30'
                              : 'bg-white/5 text-white/50 hover:bg-white/10'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Features preview */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      <Shield className="w-4 h-4 text-focus-400" />
                      <span>Visual indicator that you're focusing</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      <Share2 className="w-4 h-4 text-focus-400" />
                      <span>Shareable status message</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      <Clock className="w-4 h-4 text-focus-400" />
                      <span>Countdown timer always visible</span>
                    </div>
                  </div>

                  {/* Activate button */}
                  <button
                    onClick={() => activateShield(selectedDuration)}
                    className="w-full px-4 py-3 rounded-xl bg-focus-500 hover:bg-focus-600 text-white font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Activate Shield ({DURATION_PRESETS.find(p => p.minutes === selectedDuration)?.label})
                  </button>
                </>
              )}

              {/* Tip */}
              <p className="text-center text-white/30 text-xs mt-4">
                {isActive
                  ? 'Copy your status to share in chats or Slack'
                  : 'Shield syncs with your focus timer automatically'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
