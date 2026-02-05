import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Share2,
  Copy,
  Check,
  Trophy,
  Flame,
  Target,
  Clock,
  Calendar,
  Settings,
  Mail,
  MessageCircle,
  Link2,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage keys
const PARTNER_SETTINGS_KEY = 'nero_partner_settings'
const SHAREABLE_STATS_KEY = 'nero_shareable_stats'

// Load settings
const loadSettings = () => {
  try {
    const stored = localStorage.getItem(PARTNER_SETTINGS_KEY)
    return stored ? JSON.parse(stored) : {
      shareEnabled: false,
      shareCode: null,
      partnerName: '',
      shareItems: {
        streaks: true,
        tasksCompleted: true,
        focusSessions: true,
        currentStreak: true,
        weeklyProgress: true,
      }
    }
  } catch {
    return {
      shareEnabled: false,
      shareCode: null,
      partnerName: '',
      shareItems: {
        streaks: true,
        tasksCompleted: true,
        focusSessions: true,
        currentStreak: true,
        weeklyProgress: true,
      }
    }
  }
}

// Save settings
const saveSettings = (settings) => {
  localStorage.setItem(PARTNER_SETTINGS_KEY, JSON.stringify(settings))
}

// Generate share code
const generateShareCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Get stats from localStorage
const getStats = () => {
  try {
    // Get insights stats
    const insightsRaw = localStorage.getItem('nero_insights_stats')
    const insights = insightsRaw ? JSON.parse(insightsRaw) : {}

    // Get rewards
    const rewardsRaw = localStorage.getItem('nero_rewards')
    const rewards = rewardsRaw ? JSON.parse(rewardsRaw) : { level: 1, xp: 0, streak: 0 }

    // Calculate week stats
    const today = new Date()
    let weekTasks = 0
    let weekFocus = 0

    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      if (insights[dateKey]) {
        weekTasks += insights[dateKey].tasksCompleted || 0
        weekFocus += insights[dateKey].focusSessions || 0
      }
    }

    // Get today's stats
    const todayKey = today.toISOString().split('T')[0]
    const todayStats = insights[todayKey] || { tasksCompleted: 0, focusSessions: 0 }

    return {
      level: rewards.level || 1,
      xp: rewards.xp || 0,
      currentStreak: rewards.streak || 0,
      todayTasks: todayStats.tasksCompleted || 0,
      todayFocus: todayStats.focusSessions || 0,
      weekTasks,
      weekFocus,
    }
  } catch {
    return {
      level: 1,
      xp: 0,
      currentStreak: 0,
      todayTasks: 0,
      todayFocus: 0,
      weekTasks: 0,
      weekFocus: 0,
    }
  }
}

export default function AccountabilityPartner() {
  const prefersReducedMotion = useReducedMotion()
  const [settings, setSettings] = useState(loadSettings())
  const [stats, setStats] = useState(getStats())
  const [copied, setCopied] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Refresh stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getStats())
    }, 60000) // Every minute

    return () => clearInterval(interval)
  }, [])

  // Update settings
  const updateSettings = (updates) => {
    const newSettings = { ...settings, ...updates }
    setSettings(newSettings)
    saveSettings(newSettings)
  }

  // Toggle sharing
  const toggleSharing = () => {
    if (!settings.shareEnabled) {
      // Enable sharing and generate code
      updateSettings({
        shareEnabled: true,
        shareCode: settings.shareCode || generateShareCode(),
      })
    } else {
      updateSettings({ shareEnabled: false })
    }
  }

  // Regenerate code
  const regenerateCode = () => {
    updateSettings({ shareCode: generateShareCode() })
  }

  // Copy share link
  const copyShareLink = () => {
    const shareData = generateShareMessage()
    navigator.clipboard.writeText(shareData)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Generate share message
  const generateShareMessage = () => {
    let message = `My Nero Progress Update:\n\n`

    if (settings.shareItems.currentStreak) {
      message += `- ${stats.currentStreak} day streak\n`
    }
    if (settings.shareItems.tasksCompleted) {
      message += `- ${stats.todayTasks} tasks completed today\n`
    }
    if (settings.shareItems.focusSessions) {
      message += `- ${stats.todayFocus} focus sessions today\n`
    }
    if (settings.shareItems.weeklyProgress) {
      message += `- ${stats.weekTasks} tasks this week\n`
    }

    message += `\nLevel ${stats.level} | ${stats.xp} XP`
    message += `\n\n(Tracked with Nero - ADHD Companion)`

    return message
  }

  // Toggle share item
  const toggleShareItem = (item) => {
    updateSettings({
      shareItems: {
        ...settings.shareItems,
        [item]: !settings.shareItems[item]
      }
    })
  }

  // Share via different methods
  const shareVia = (method) => {
    const message = encodeURIComponent(generateShareMessage())

    switch (method) {
      case 'text':
        window.open(`sms:?body=${message}`)
        break
      case 'email':
        window.open(`mailto:?subject=My%20Nero%20Progress&body=${message}`)
        break
      case 'whatsapp':
        window.open(`https://wa.me/?text=${message}`)
        break
      default:
        copyShareLink()
    }
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
            <h2 className="font-display text-xl font-semibold">Accountability</h2>
            <p className="text-sm text-white/50">Share progress with a partner</p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl transition-colors ${
              showSettings ? 'bg-white/10 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Current Stats Preview */}
        <div className="glass-card p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Your Progress</h3>
            <button
              onClick={() => setStats(getStats())}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Refresh stats"
            >
              <RefreshCw className="w-4 h-4 text-white/50" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white/5 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-white/50">Streak</span>
              </div>
              <p className="text-2xl font-bold text-orange-400">{stats.currentStreak} days</p>
            </div>

            <div className="p-3 bg-white/5 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-white/50">Level</span>
              </div>
              <p className="text-2xl font-bold text-yellow-400">{stats.level}</p>
            </div>

            <div className="p-3 bg-white/5 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-green-400" />
                <span className="text-xs text-white/50">Today's Tasks</span>
              </div>
              <p className="text-2xl font-bold text-green-400">{stats.todayTasks}</p>
            </div>

            <div className="p-3 bg-white/5 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-white/50">Focus Sessions</span>
              </div>
              <p className="text-2xl font-bold text-purple-400">{stats.todayFocus}</p>
            </div>
          </div>

          <div className="mt-3 p-3 bg-white/5 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-white/50">This Week</span>
            </div>
            <p className="text-sm text-white/70">
              {stats.weekTasks} tasks | {stats.weekFocus} focus sessions
            </p>
          </div>
        </div>

        {/* Share Toggle */}
        <div className="glass-card p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${settings.shareEnabled ? 'bg-green-500/20' : 'bg-white/10'} flex items-center justify-center`}>
                <Share2 className={`w-5 h-5 ${settings.shareEnabled ? 'text-green-400' : 'text-white/50'}`} />
              </div>
              <div>
                <p className="font-medium">Sharing {settings.shareEnabled ? 'Enabled' : 'Disabled'}</p>
                <p className="text-sm text-white/50">
                  {settings.shareEnabled ? 'Your progress is ready to share' : 'Enable to share with a partner'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleSharing}
              className={`w-14 h-8 rounded-full transition-colors relative ${
                settings.shareEnabled ? 'bg-green-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${
                  settings.shareEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Share Options */}
        {settings.shareEnabled && (
          <motion.div
            {...getMotionProps(prefersReducedMotion, {
              initial: { opacity: 0, height: 0 },
              animate: { opacity: 1, height: 'auto' }
            })}
            className="space-y-4"
          >
            {/* Quick Share Buttons */}
            <div className="glass-card p-4">
              <h3 className="font-medium mb-3">Share Your Progress</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={copyShareLink}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-nero-500/20 hover:bg-nero-500/30 text-nero-400 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Text'}
                </button>

                <button
                  onClick={() => shareVia('text')}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Text
                </button>

                <button
                  onClick={() => shareVia('email')}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </button>

                <button
                  onClick={() => shareVia('whatsapp')}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Message Preview</h3>
                <Eye className="w-4 h-4 text-white/50" />
              </div>
              <pre className="text-sm text-white/70 bg-white/5 p-3 rounded-lg whitespace-pre-wrap font-mono text-xs">
                {generateShareMessage()}
              </pre>
            </div>
          </motion.div>
        )}

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0, height: 0 },
                animate: { opacity: 1, height: 'auto' },
                exit: { opacity: 0, height: 0 }
              })}
              className="mt-4 glass-card p-4"
            >
              <h3 className="font-medium mb-3">What to Share</h3>
              <div className="space-y-2">
                {[
                  { id: 'currentStreak', label: 'Current Streak', icon: Flame },
                  { id: 'tasksCompleted', label: 'Tasks Completed', icon: Target },
                  { id: 'focusSessions', label: 'Focus Sessions', icon: Clock },
                  { id: 'weeklyProgress', label: 'Weekly Progress', icon: Calendar },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleShareItem(item.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      settings.shareItems[item.id]
                        ? 'bg-nero-500/20 border border-nero-500/30'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${settings.shareItems[item.id] ? 'text-nero-400' : 'text-white/50'}`} />
                    <span className={settings.shareItems[item.id] ? 'text-white' : 'text-white/70'}>
                      {item.label}
                    </span>
                    <div className="ml-auto">
                      {settings.shareItems[item.id] ? (
                        <Eye className="w-4 h-4 text-nero-400" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-white/30" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Partner Name */}
              <div className="mt-4">
                <label className="block text-sm text-white/70 mb-2">Partner's Name (optional)</label>
                <input
                  type="text"
                  value={settings.partnerName}
                  onChange={(e) => updateSettings({ partnerName: e.target.value })}
                  placeholder="Who are you sharing with?"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tips */}
        <div className="mt-6 p-4 bg-white/5 rounded-xl">
          <p className="text-sm text-white/50">
            <strong className="text-white/70">Accountability tip:</strong> Research shows that having an
            accountability partner can increase your chance of achieving goals by up to 95%.
            Share your progress regularly!
          </p>
        </div>
      </motion.div>
    </div>
  )
}
