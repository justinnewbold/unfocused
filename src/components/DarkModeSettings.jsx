import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Moon,
  Sun,
  Monitor,
  Palette,
  Eye,
  Contrast,
  Sparkles,
  Check,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage keys
const THEME_KEY = 'nero_theme_settings'

// Default theme settings
const DEFAULT_SETTINGS = {
  mode: 'dark', // 'light' | 'dark' | 'system'
  accentColor: 'nero', // 'nero' | 'purple' | 'blue' | 'green' | 'orange' | 'pink'
  contrast: 'normal', // 'normal' | 'high'
  reducedMotion: false,
  dimImages: false,
}

// Accent colors
const ACCENT_COLORS = [
  { id: 'nero', name: 'Nero (Default)', preview: 'bg-nero-500', textColor: 'text-nero-400' },
  { id: 'purple', name: 'Purple', preview: 'bg-purple-500', textColor: 'text-purple-400' },
  { id: 'blue', name: 'Blue', preview: 'bg-blue-500', textColor: 'text-blue-400' },
  { id: 'green', name: 'Green', preview: 'bg-green-500', textColor: 'text-green-400' },
  { id: 'orange', name: 'Orange', preview: 'bg-orange-500', textColor: 'text-orange-400' },
  { id: 'pink', name: 'Pink', preview: 'bg-pink-500', textColor: 'text-pink-400' },
  { id: 'cyan', name: 'Cyan', preview: 'bg-cyan-500', textColor: 'text-cyan-400' },
]

// Load settings
const loadSettings = () => {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

// Save settings
const saveSettings = (settings) => {
  localStorage.setItem(THEME_KEY, JSON.stringify(settings))
}

// Apply theme to document
const applyTheme = (settings) => {
  const root = document.documentElement

  // Determine actual mode
  let isDark = settings.mode === 'dark'
  if (settings.mode === 'system') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  // Apply mode class
  if (isDark) {
    root.classList.add('dark')
    root.classList.remove('light')
  } else {
    root.classList.add('light')
    root.classList.remove('dark')
  }

  // Apply contrast
  if (settings.contrast === 'high') {
    root.classList.add('high-contrast')
  } else {
    root.classList.remove('high-contrast')
  }

  // Apply reduced motion
  if (settings.reducedMotion) {
    root.classList.add('reduce-motion')
  } else {
    root.classList.remove('reduce-motion')
  }

  // Apply dim images
  if (settings.dimImages) {
    root.classList.add('dim-images')
  } else {
    root.classList.remove('dim-images')
  }

  // Apply accent color as CSS variable
  root.style.setProperty('--accent-color', settings.accentColor)
}

export default function DarkModeSettings({ onSettingsChange }) {
  const prefersReducedMotion = useReducedMotion()
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  // Load settings on mount
  useEffect(() => {
    const loaded = loadSettings()
    setSettings(loaded)
    applyTheme(loaded)
  }, [])

  // Listen for system theme changes
  useEffect(() => {
    if (settings.mode !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => applyTheme(settings)

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [settings])

  // Update setting
  const updateSetting = (key, value) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    saveSettings(updated)
    applyTheme(updated)
    onSettingsChange?.(updated)
  }

  // Theme mode options
  const themeModes = [
    { id: 'light', name: 'Light', icon: Sun, description: 'Bright and clear' },
    { id: 'dark', name: 'Dark', icon: Moon, description: 'Easy on the eyes' },
    { id: 'system', name: 'System', icon: Monitor, description: 'Match device settings' },
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
        <div className="mb-6">
          <h2 className="font-display text-xl font-semibold">Appearance</h2>
          <p className="text-sm text-white/50">Customize your visual experience</p>
        </div>

        {/* Theme Mode */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-white/70 mb-3">Theme</h3>
          <div className="grid grid-cols-3 gap-3">
            {themeModes.map((mode) => {
              const Icon = mode.icon
              const isSelected = settings.mode === mode.id

              return (
                <button
                  key={mode.id}
                  onClick={() => updateSetting('mode', mode.id)}
                  className={`relative p-4 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-white/10 border-2 border-nero-500'
                      : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? 'text-nero-400' : 'text-white/50'}`} />
                  <p className="text-sm font-medium text-center">{mode.name}</p>
                  <p className="text-xs text-white/40 text-center mt-1">{mode.description}</p>

                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-nero-400" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Accent Color */}
        <div className="mb-6 glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-white/50" />
            <h3 className="text-sm font-medium text-white/70">Accent Color</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.id}
                onClick={() => updateSetting('accentColor', color.id)}
                className={`relative w-10 h-10 rounded-full ${color.preview} transition-all ${
                  settings.accentColor === color.id
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-surface scale-110'
                    : 'hover:scale-105'
                }`}
                title={color.name}
              >
                {settings.accentColor === color.id && (
                  <Check className="w-5 h-5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-white/40 mt-3">
            Selected: {ACCENT_COLORS.find(c => c.id === settings.accentColor)?.name}
          </p>
        </div>

        {/* Accessibility Options */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/70 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Accessibility
          </h3>

          {/* High Contrast */}
          <button
            onClick={() => updateSetting('contrast', settings.contrast === 'high' ? 'normal' : 'high')}
            className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
              settings.contrast === 'high'
                ? 'bg-white/10 border border-white/20'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <Contrast className="w-5 h-5 text-white/50" />
              <div className="text-left">
                <p className="font-medium">High Contrast</p>
                <p className="text-xs text-white/50">Increase text and element contrast</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full relative transition-colors ${
              settings.contrast === 'high' ? 'bg-nero-500' : 'bg-white/20'
            }`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                settings.contrast === 'high' ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </div>
          </button>

          {/* Reduced Motion */}
          <button
            onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
            className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
              settings.reducedMotion
                ? 'bg-white/10 border border-white/20'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-white/50" />
              <div className="text-left">
                <p className="font-medium">Reduce Motion</p>
                <p className="text-xs text-white/50">Minimize animations throughout the app</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full relative transition-colors ${
              settings.reducedMotion ? 'bg-nero-500' : 'bg-white/20'
            }`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                settings.reducedMotion ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </div>
          </button>

          {/* Dim Images */}
          <button
            onClick={() => updateSetting('dimImages', !settings.dimImages)}
            className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
              settings.dimImages
                ? 'bg-white/10 border border-white/20'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-white/50" />
              <div className="text-left">
                <p className="font-medium">Dim Images</p>
                <p className="text-xs text-white/50">Reduce brightness of images</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full relative transition-colors ${
              settings.dimImages ? 'bg-nero-500' : 'bg-white/20'
            }`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                settings.dimImages ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </div>
          </button>
        </div>

        {/* Preview Card */}
        <div className="mt-6 glass-card p-4">
          <h3 className="text-sm font-medium text-white/70 mb-3">Preview</h3>
          <div className={`p-4 rounded-xl bg-white/5 border border-white/10 ${
            settings.contrast === 'high' ? 'border-white/30' : ''
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full ${ACCENT_COLORS.find(c => c.id === settings.accentColor)?.preview || 'bg-nero-500'}`} />
              <div>
                <p className="font-medium">Sample Task</p>
                <p className="text-xs text-white/50">This is how text looks</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className={`px-3 py-1.5 rounded-lg ${ACCENT_COLORS.find(c => c.id === settings.accentColor)?.preview || 'bg-nero-500'} text-white text-sm`}>
                Primary
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-sm">
                Secondary
              </button>
            </div>
          </div>
        </div>

        {/* Reset */}
        <button
          onClick={() => {
            setSettings(DEFAULT_SETTINGS)
            saveSettings(DEFAULT_SETTINGS)
            applyTheme(DEFAULT_SETTINGS)
          }}
          className="mt-6 w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 text-sm transition-colors"
        >
          Reset to Defaults
        </button>
      </motion.div>
    </div>
  )
}
