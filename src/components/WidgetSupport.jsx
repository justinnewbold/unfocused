import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutGrid,
  Smartphone,
  Clock,
  Target,
  Zap,
  Flame,
  CheckCircle,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  X,
  Move,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const WIDGETS_KEY = 'nero_widget_settings'

// Available widgets
const AVAILABLE_WIDGETS = [
  {
    id: 'focus-timer',
    name: 'Focus Timer',
    description: 'Quick access to start focus sessions',
    icon: Clock,
    sizes: ['small', 'medium'],
    color: 'yellow',
  },
  {
    id: 'daily-progress',
    name: 'Daily Progress',
    description: 'Tasks completed today',
    icon: Target,
    sizes: ['small', 'medium', 'large'],
    color: 'green',
  },
  {
    id: 'streak-counter',
    name: 'Streak Counter',
    description: 'Your current focus streak',
    icon: Flame,
    sizes: ['small'],
    color: 'orange',
  },
  {
    id: 'quick-task',
    name: 'Quick Task',
    description: 'Add tasks instantly',
    icon: Plus,
    sizes: ['small', 'medium'],
    color: 'blue',
  },
  {
    id: 'next-event',
    name: 'Next Event',
    description: 'Upcoming calendar event',
    icon: Calendar,
    sizes: ['small', 'medium'],
    color: 'purple',
  },
  {
    id: 'weekly-stats',
    name: 'Weekly Stats',
    description: 'Your week at a glance',
    icon: BarChart3,
    sizes: ['medium', 'large'],
    color: 'cyan',
  },
  {
    id: 'motivation',
    name: 'Daily Motivation',
    description: 'Inspiring ADHD-friendly quotes',
    icon: Zap,
    sizes: ['small', 'medium'],
    color: 'pink',
  },
]

// Load widget settings
const loadWidgetSettings = () => {
  try {
    const stored = localStorage.getItem(WIDGETS_KEY)
    return stored ? JSON.parse(stored) : {
      enabled: ['focus-timer', 'daily-progress', 'streak-counter'],
      layout: {
        'focus-timer': { size: 'medium', position: 0 },
        'daily-progress': { size: 'medium', position: 1 },
        'streak-counter': { size: 'small', position: 2 },
      }
    }
  } catch {
    return { enabled: [], layout: {} }
  }
}

// Save widget settings
const saveWidgetSettings = (settings) => {
  localStorage.setItem(WIDGETS_KEY, JSON.stringify(settings))
}

export default function WidgetSupport() {
  const prefersReducedMotion = useReducedMotion()
  const [settings, setSettings] = useState({ enabled: [], layout: {} })
  const [selectedWidget, setSelectedWidget] = useState(null)
  const [previewMode, setPreviewMode] = useState(false)

  // Load settings on mount
  useEffect(() => {
    setSettings(loadWidgetSettings())
  }, [])

  // Toggle widget
  const toggleWidget = (widgetId) => {
    const isEnabled = settings.enabled.includes(widgetId)
    const newEnabled = isEnabled
      ? settings.enabled.filter(id => id !== widgetId)
      : [...settings.enabled, widgetId]

    const newLayout = { ...settings.layout }
    if (!isEnabled) {
      newLayout[widgetId] = { size: 'small', position: newEnabled.length - 1 }
    } else {
      delete newLayout[widgetId]
    }

    const updated = { enabled: newEnabled, layout: newLayout }
    setSettings(updated)
    saveWidgetSettings(updated)
  }

  // Change widget size
  const changeWidgetSize = (widgetId, size) => {
    const updated = {
      ...settings,
      layout: {
        ...settings.layout,
        [widgetId]: { ...settings.layout[widgetId], size }
      }
    }
    setSettings(updated)
    saveWidgetSettings(updated)
  }

  // Get enabled widgets with data
  const enabledWidgets = settings.enabled
    .map(id => {
      const widget = AVAILABLE_WIDGETS.find(w => w.id === id)
      return widget ? { ...widget, ...settings.layout[id] } : null
    })
    .filter(Boolean)

  // Widget preview component
  const WidgetPreview = ({ widget, size = 'small' }) => {
    const Icon = widget.icon
    const sizeClasses = {
      small: 'w-24 h-24',
      medium: 'w-32 h-32',
      large: 'w-48 h-32',
    }

    return (
      <div className={`${sizeClasses[size]} rounded-2xl bg-${widget.color}-500/20 border border-${widget.color}-500/30 p-3 flex flex-col items-center justify-center`}>
        <Icon className={`w-8 h-8 text-${widget.color}-400 mb-2`} />
        <p className="text-xs text-center font-medium">{widget.name}</p>
      </div>
    )
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
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <LayoutGrid className="w-6 h-6 text-indigo-400" />
              Widget Settings
            </h2>
            <p className="text-sm text-white/50">Customize your home screen widgets</p>
          </div>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`p-2 rounded-xl transition-colors ${
              previewMode ? 'bg-indigo-500 text-white' : 'bg-indigo-500/20 text-indigo-400'
            }`}
          >
            {previewMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Preview Mode */}
        {previewMode && (
          <motion.div
            {...getMotionProps(prefersReducedMotion, {
              initial: { opacity: 0, y: -10 },
              animate: { opacity: 1, y: 0 }
            })}
            className="mb-6"
          >
            <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="w-4 h-4 text-white/50" />
                <span className="text-sm text-white/50">Home Screen Preview</span>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {enabledWidgets.map((widget) => (
                  <WidgetPreview
                    key={widget.id}
                    widget={widget}
                    size={widget.size}
                  />
                ))}
                {enabledWidgets.length === 0 && (
                  <p className="text-sm text-white/30 py-8">No widgets enabled</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Enabled Widgets */}
        {enabledWidgets.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-white/70 mb-3">Active Widgets</h3>
            <div className="space-y-2">
              {enabledWidgets.map((widget) => {
                const Icon = widget.icon
                return (
                  <motion.div
                    key={widget.id}
                    {...getMotionProps(prefersReducedMotion, {
                      initial: { opacity: 0, x: -10 },
                      animate: { opacity: 1, x: 0 }
                    })}
                    className="glass-card p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-${widget.color}-500/20 flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 text-${widget.color}-400`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{widget.name}</p>
                          <p className="text-xs text-white/50">Size: {widget.size}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Size toggle */}
                        <div className="flex gap-1">
                          {widget.sizes.map((size) => (
                            <button
                              key={size}
                              onClick={() => changeWidgetSize(widget.id, size)}
                              className={`px-2 py-1 rounded text-xs transition-colors ${
                                settings.layout[widget.id]?.size === size
                                  ? `bg-${widget.color}-500/30 text-${widget.color}-400`
                                  : 'bg-white/5 text-white/50 hover:bg-white/10'
                              }`}
                            >
                              {size.charAt(0).toUpperCase()}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => toggleWidget(widget.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* Available Widgets */}
        <div>
          <h3 className="text-sm font-medium text-white/70 mb-3">Available Widgets</h3>
          <div className="grid grid-cols-2 gap-3">
            {AVAILABLE_WIDGETS.map((widget) => {
              const Icon = widget.icon
              const isEnabled = settings.enabled.includes(widget.id)

              return (
                <motion.button
                  key={widget.id}
                  onClick={() => toggleWidget(widget.id)}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-xl text-left transition-colors ${
                    isEnabled
                      ? `bg-${widget.color}-500/20 border border-${widget.color}-500/30`
                      : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-6 h-6 ${isEnabled ? `text-${widget.color}-400` : 'text-white/50'}`} />
                    {isEnabled && <CheckCircle className={`w-4 h-4 text-${widget.color}-400`} />}
                  </div>
                  <p className="font-medium text-sm">{widget.name}</p>
                  <p className="text-xs text-white/50 mt-1">{widget.description}</p>
                  <div className="flex gap-1 mt-2">
                    {widget.sizes.map((size) => (
                      <span key={size} className="text-xs px-1.5 py-0.5 bg-white/10 rounded">
                        {size.charAt(0).toUpperCase()}
                      </span>
                    ))}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-indigo-400" />
            How to Add Widgets
          </h3>
          <ol className="text-xs text-white/60 space-y-1">
            <li>1. Long-press on your home screen</li>
            <li>2. Tap the + button or "Widgets"</li>
            <li>3. Search for "Nero"</li>
            <li>4. Drag your chosen widget to the home screen</li>
          </ol>
        </div>

        {/* Platform Note */}
        <div className="mt-4 p-3 bg-white/5 rounded-xl">
          <p className="text-xs text-white/50 text-center">
            Widgets are available on iOS 14+ and Android 12+. Settings sync automatically.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
