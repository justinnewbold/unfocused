import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Accessibility,
  Eye,
  Type,
  Palette,
  Volume2,
  Monitor,
  Sparkles,
  Check,
  Moon,
  Sun,
  Contrast,
  Glasses,
  Ear,
  Hand,
  Zap,
  Settings,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const ACCESSIBILITY_KEY = 'nero_accessibility_settings'

// Default settings
const defaultSettings = {
  // Visual
  fontSize: 'medium', // small, medium, large, xl
  dyslexiaFont: false,
  highContrast: false,
  reduceMotion: false,
  colorBlindMode: 'none', // none, protanopia, deuteranopia, tritanopia

  // Reading
  lineSpacing: 'normal', // compact, normal, relaxed
  letterSpacing: 'normal', // normal, wide
  wordSpacing: 'normal', // normal, wide

  // Screen Reader
  screenReaderOptimized: false,
  announceNotifications: true,
  describedImages: true,

  // Motor
  largerTouchTargets: false,
  reduceHoldGestures: false,

  // Cognitive
  simplifiedUI: false,
  reducedAnimations: false,
  focusIndicators: true,
}

// Font size options
const FONT_SIZES = [
  { id: 'small', name: 'Small', scale: 0.875 },
  { id: 'medium', name: 'Medium', scale: 1 },
  { id: 'large', name: 'Large', scale: 1.125 },
  { id: 'xl', name: 'Extra Large', scale: 1.25 },
]

// Color blind modes
const COLOR_BLIND_MODES = [
  { id: 'none', name: 'None', description: 'Standard colors' },
  { id: 'protanopia', name: 'Protanopia', description: 'Red-blind' },
  { id: 'deuteranopia', name: 'Deuteranopia', description: 'Green-blind' },
  { id: 'tritanopia', name: 'Tritanopia', description: 'Blue-blind' },
]

// Load settings
const loadSettings = () => {
  try {
    const stored = localStorage.getItem(ACCESSIBILITY_KEY)
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings
  } catch {
    return defaultSettings
  }
}

// Save settings
const saveSettings = (settings) => {
  localStorage.setItem(ACCESSIBILITY_KEY, JSON.stringify(settings))
  applySettings(settings)
}

// Apply settings to document
const applySettings = (settings) => {
  const root = document.documentElement

  // Font size
  const fontScale = FONT_SIZES.find(f => f.id === settings.fontSize)?.scale || 1
  root.style.setProperty('--font-scale', fontScale.toString())

  // Dyslexia font
  if (settings.dyslexiaFont) {
    root.classList.add('dyslexia-font')
  } else {
    root.classList.remove('dyslexia-font')
  }

  // High contrast
  if (settings.highContrast) {
    root.classList.add('high-contrast')
  } else {
    root.classList.remove('high-contrast')
  }

  // Reduced motion
  if (settings.reduceMotion || settings.reducedAnimations) {
    root.classList.add('reduce-motion')
  } else {
    root.classList.remove('reduce-motion')
  }

  // Color blind mode
  root.setAttribute('data-color-blind', settings.colorBlindMode)

  // Line spacing
  root.setAttribute('data-line-spacing', settings.lineSpacing)

  // Letter spacing
  root.setAttribute('data-letter-spacing', settings.letterSpacing)

  // Larger touch targets
  if (settings.largerTouchTargets) {
    root.classList.add('large-touch-targets')
  } else {
    root.classList.remove('large-touch-targets')
  }

  // Simplified UI
  if (settings.simplifiedUI) {
    root.classList.add('simplified-ui')
  } else {
    root.classList.remove('simplified-ui')
  }
}

export default function AccessibilitySettings() {
  const prefersReducedMotion = useReducedMotion()
  const [settings, setSettings] = useState(defaultSettings)
  const [activeSection, setActiveSection] = useState('visual')

  // Load settings on mount
  useEffect(() => {
    const loaded = loadSettings()
    setSettings(loaded)
    applySettings(loaded)
  }, [])

  // Update setting
  const updateSetting = (key, value) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    saveSettings(updated)
  }

  // Toggle setting
  const toggleSetting = (key) => {
    updateSetting(key, !settings[key])
  }

  // Reset to defaults
  const resetToDefaults = () => {
    setSettings(defaultSettings)
    saveSettings(defaultSettings)
  }

  // Sections
  const sections = [
    { id: 'visual', name: 'Visual', icon: Eye },
    { id: 'reading', name: 'Reading', icon: Type },
    { id: 'screen-reader', name: 'Screen Reader', icon: Ear },
    { id: 'motor', name: 'Motor', icon: Hand },
    { id: 'cognitive', name: 'Cognitive', icon: Zap },
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
              <Accessibility className="w-6 h-6 text-blue-400" />
              Accessibility
            </h2>
            <p className="text-sm text-white/50">Customize for your needs</p>
          </div>
          <button
            onClick={resetToDefaults}
            className="text-sm text-white/50 hover:text-white/70"
          >
            Reset All
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {section.name}
              </button>
            )
          })}
        </div>

        {/* Visual Settings */}
        {activeSection === 'visual' && (
          <div className="space-y-4">
            {/* Font Size */}
            <div className="glass-card p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Type className="w-4 h-4 text-blue-400" />
                Font Size
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {FONT_SIZES.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => updateSetting('fontSize', size.id)}
                    className={`p-3 rounded-xl text-center transition-colors ${
                      settings.fontSize === size.id
                        ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span style={{ fontSize: `${size.scale}rem` }}>Aa</span>
                    <p className="text-xs mt-1 text-white/50">{size.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Dyslexia-Friendly Font */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Glasses className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-medium">Dyslexia-Friendly Font</p>
                    <p className="text-xs text-white/50">Uses OpenDyslexic or similar font</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting('dyslexiaFont')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.dyslexiaFont ? 'bg-blue-500' : 'bg-white/20'
                  }`}
                >
                  <motion.div
                    className="w-5 h-5 bg-white rounded-full shadow"
                    animate={{ x: settings.dyslexiaFont ? 26 : 2 }}
                  />
                </button>
              </div>
              {settings.dyslexiaFont && (
                <div className="mt-3 p-3 bg-white/5 rounded-lg">
                  <p className="text-sm" style={{ fontFamily: 'OpenDyslexic, sans-serif' }}>
                    This is how text will appear with the dyslexia-friendly font enabled.
                  </p>
                </div>
              )}
            </div>

            {/* High Contrast */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Contrast className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-medium">High Contrast</p>
                    <p className="text-xs text-white/50">Increase text and UI contrast</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting('highContrast')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.highContrast ? 'bg-blue-500' : 'bg-white/20'
                  }`}
                >
                  <motion.div
                    className="w-5 h-5 bg-white rounded-full shadow"
                    animate={{ x: settings.highContrast ? 26 : 2 }}
                  />
                </button>
              </div>
            </div>

            {/* Reduce Motion */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-medium">Reduce Motion</p>
                    <p className="text-xs text-white/50">Minimize animations and transitions</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting('reduceMotion')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.reduceMotion ? 'bg-blue-500' : 'bg-white/20'
                  }`}
                >
                  <motion.div
                    className="w-5 h-5 bg-white rounded-full shadow"
                    animate={{ x: settings.reduceMotion ? 26 : 2 }}
                  />
                </button>
              </div>
            </div>

            {/* Color Blind Mode */}
            <div className="glass-card p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4 text-blue-400" />
                Color Blind Mode
              </h3>
              <div className="space-y-2">
                {COLOR_BLIND_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => updateSetting('colorBlindMode', mode.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                      settings.colorBlindMode === mode.id
                        ? 'bg-blue-500/20 border border-blue-500/30'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm">{mode.name}</p>
                      <p className="text-xs text-white/50">{mode.description}</p>
                    </div>
                    {settings.colorBlindMode === mode.id && (
                      <Check className="w-4 h-4 text-blue-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reading Settings */}
        {activeSection === 'reading' && (
          <div className="space-y-4">
            {/* Line Spacing */}
            <div className="glass-card p-4">
              <h3 className="font-medium mb-3">Line Spacing</h3>
              <div className="grid grid-cols-3 gap-2">
                {['compact', 'normal', 'relaxed'].map((option) => (
                  <button
                    key={option}
                    onClick={() => updateSetting('lineSpacing', option)}
                    className={`p-3 rounded-xl text-center capitalize transition-colors ${
                      settings.lineSpacing === option
                        ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="mt-3 p-3 bg-white/5 rounded-lg">
                <p className={`text-sm leading-${settings.lineSpacing === 'compact' ? 'tight' : settings.lineSpacing === 'relaxed' ? 'loose' : 'normal'}`}>
                  This is a preview of how text will appear with {settings.lineSpacing} line spacing.
                  Multiple lines help you see the difference.
                </p>
              </div>
            </div>

            {/* Letter Spacing */}
            <div className="glass-card p-4">
              <h3 className="font-medium mb-3">Letter Spacing</h3>
              <div className="grid grid-cols-2 gap-2">
                {['normal', 'wide'].map((option) => (
                  <button
                    key={option}
                    onClick={() => updateSetting('letterSpacing', option)}
                    className={`p-3 rounded-xl text-center capitalize transition-colors ${
                      settings.letterSpacing === option
                        ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span style={{ letterSpacing: option === 'wide' ? '0.1em' : 'normal' }}>
                      {option}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Word Spacing */}
            <div className="glass-card p-4">
              <h3 className="font-medium mb-3">Word Spacing</h3>
              <div className="grid grid-cols-2 gap-2">
                {['normal', 'wide'].map((option) => (
                  <button
                    key={option}
                    onClick={() => updateSetting('wordSpacing', option)}
                    className={`p-3 rounded-xl text-center capitalize transition-colors ${
                      settings.wordSpacing === option
                        ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span style={{ wordSpacing: option === 'wide' ? '0.2em' : 'normal' }}>
                      Sample text
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Screen Reader Settings */}
        {activeSection === 'screen-reader' && (
          <div className="space-y-4">
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Ear className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-medium">Screen Reader Optimized</p>
                    <p className="text-xs text-white/50">Enhanced ARIA labels and navigation</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting('screenReaderOptimized')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.screenReaderOptimized ? 'bg-blue-500' : 'bg-white/20'
                  }`}
                >
                  <motion.div
                    className="w-5 h-5 bg-white rounded-full shadow"
                    animate={{ x: settings.screenReaderOptimized ? 26 : 2 }}
                  />
                </button>
              </div>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-medium">Announce Notifications</p>
                    <p className="text-xs text-white/50">Read notifications aloud</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting('announceNotifications')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.announceNotifications ? 'bg-blue-500' : 'bg-white/20'
                  }`}
                >
                  <motion.div
                    className="w-5 h-5 bg-white rounded-full shadow"
                    animate={{ x: settings.announceNotifications ? 26 : 2 }}
                  />
                </button>
              </div>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-medium">Image Descriptions</p>
                    <p className="text-xs text-white/50">Provide alt text for all images</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting('describedImages')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.describedImages ? 'bg-blue-500' : 'bg-white/20'
                  }`}
                >
                  <motion.div
                    className="w-5 h-5 bg-white rounded-full shadow"
                    animate={{ x: settings.describedImages ? 26 : 2 }}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Motor Settings */}
        {activeSection === 'motor' && (
          <div className="space-y-4">
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Hand className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-medium">Larger Touch Targets</p>
                    <p className="text-xs text-white/50">Increase button and link sizes</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting('largerTouchTargets')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.largerTouchTargets ? 'bg-blue-500' : 'bg-white/20'
                  }`}
                >
                  <motion.div
                    className="w-5 h-5 bg-white rounded-full shadow"
                    animate={{ x: settings.largerTouchTargets ? 26 : 2 }}
                  />
                </button>
              </div>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-medium">Reduce Hold Gestures</p>
                    <p className="text-xs text-white/50">Replace long-press with tap alternatives</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting('reduceHoldGestures')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.reduceHoldGestures ? 'bg-blue-500' : 'bg-white/20'
                  }`}
                >
                  <motion.div
                    className="w-5 h-5 bg-white rounded-full shadow"
                    animate={{ x: settings.reduceHoldGestures ? 26 : 2 }}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cognitive Settings */}
        {activeSection === 'cognitive' && (
          <div className="space-y-4">
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-medium">Simplified UI</p>
                    <p className="text-xs text-white/50">Hide non-essential elements</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting('simplifiedUI')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.simplifiedUI ? 'bg-blue-500' : 'bg-white/20'
                  }`}
                >
                  <motion.div
                    className="w-5 h-5 bg-white rounded-full shadow"
                    animate={{ x: settings.simplifiedUI ? 26 : 2 }}
                  />
                </button>
              </div>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-medium">Reduced Animations</p>
                    <p className="text-xs text-white/50">Keep essential animations only</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting('reducedAnimations')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.reducedAnimations ? 'bg-blue-500' : 'bg-white/20'
                  }`}
                >
                  <motion.div
                    className="w-5 h-5 bg-white rounded-full shadow"
                    animate={{ x: settings.reducedAnimations ? 26 : 2 }}
                  />
                </button>
              </div>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-medium">Focus Indicators</p>
                    <p className="text-xs text-white/50">Clear visual focus rings</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting('focusIndicators')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.focusIndicators ? 'bg-blue-500' : 'bg-white/20'
                  }`}
                >
                  <motion.div
                    className="w-5 h-5 bg-white rounded-full shadow"
                    animate={{ x: settings.focusIndicators ? 26 : 2 }}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
          <p className="text-sm">
            <strong className="text-blue-400">Designed for Everyone:</strong> These settings help
            make Nero more accessible. If you have specific needs not covered here, let us know!
          </p>
        </div>
      </motion.div>
    </div>
  )
}
