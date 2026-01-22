import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layers,
  Play,
  Plus,
  Edit3,
  Trash2,
  Volume2,
  Timer,
  Battery,
  MessageSquare,
  Check,
  X,
  Sparkles,
  Coffee,
  Briefcase,
  Palette,
  Moon,
  Zap,
  Settings,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Default bundles
const DEFAULT_BUNDLES = [
  {
    id: 'deep_work',
    name: 'Deep Work',
    icon: 'Briefcase',
    description: 'Maximum focus for complex tasks',
    settings: {
      sound: 'brown',
      timerDuration: 45,
      energyFilter: 'high',
      neroTone: 'minimal',
    },
    color: 'blue',
  },
  {
    id: 'creative',
    name: 'Creative Flow',
    icon: 'Palette',
    description: 'Relaxed focus for creative work',
    settings: {
      sound: 'rain',
      timerDuration: 30,
      energyFilter: 'any',
      neroTone: 'supportive',
    },
    color: 'purple',
  },
  {
    id: 'admin',
    name: 'Admin Tasks',
    icon: 'Coffee',
    description: 'Quick tasks and emails',
    settings: {
      sound: 'none',
      timerDuration: 15,
      energyFilter: 'low',
      neroTone: 'direct',
    },
    color: 'orange',
  },
  {
    id: 'wind_down',
    name: 'Wind Down',
    icon: 'Moon',
    description: 'End of day routine',
    settings: {
      sound: 'ocean',
      timerDuration: 20,
      energyFilter: 'low',
      neroTone: 'supportive',
    },
    color: 'calm',
  },
]

// Icon mapping
const ICONS = {
  Briefcase,
  Palette,
  Coffee,
  Moon,
  Zap,
  Sparkles,
  Timer,
  Layers,
}

// Sound options
const SOUND_OPTIONS = [
  { id: 'none', label: 'No Sound' },
  { id: 'brown', label: 'Brown Noise' },
  { id: 'white', label: 'White Noise' },
  { id: 'rain', label: 'Rain' },
  { id: 'ocean', label: 'Ocean Waves' },
]

// Timer presets
const TIMER_PRESETS = [15, 25, 30, 45, 60, 90]

// Energy filter options
const ENERGY_OPTIONS = [
  { id: 'any', label: 'Any Energy' },
  { id: 'low', label: 'Low Energy Tasks' },
  { id: 'medium', label: 'Medium Energy' },
  { id: 'high', label: 'High Energy Tasks' },
]

// Nero tone options
const TONE_OPTIONS = [
  { id: 'supportive', label: 'Supportive', description: 'Encouraging and gentle' },
  { id: 'direct', label: 'Direct', description: 'Brief and to the point' },
  { id: 'minimal', label: 'Minimal', description: 'Only essential messages' },
]

// Color options
const COLORS = ['nero', 'blue', 'purple', 'orange', 'green', 'calm', 'pink']

// Storage key
const STORAGE_KEY = 'nero_context_bundles'

// Get bundles from storage
const getBundles = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load bundles:', e)
  }
  return DEFAULT_BUNDLES
}

// Save bundles to storage
const saveBundles = (bundles) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bundles))
  } catch (e) {
    console.error('Failed to save bundles:', e)
  }
}

// Bundle Editor Modal
function BundleEditor({ bundle, onSave, onCancel }) {
  const prefersReducedMotion = useReducedMotion()
  const [form, setForm] = useState(bundle || {
    id: Date.now().toString(),
    name: '',
    icon: 'Layers',
    description: '',
    settings: {
      sound: 'none',
      timerDuration: 25,
      energyFilter: 'any',
      neroTone: 'supportive',
    },
    color: 'nero',
  })

  const handleSave = () => {
    if (!form.name.trim()) return
    onSave(form)
  }

  const updateSettings = (key, value) => {
    setForm(prev => ({
      ...prev,
      settings: { ...prev.settings, [key]: value },
    }))
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        {...getMotionProps(prefersReducedMotion, {
          initial: { opacity: 0, scale: 0.95, y: 20 },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.95, y: 20 },
        })}
        className="bg-surface rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg">
            {bundle ? 'Edit Bundle' : 'Create Bundle'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm text-white/70">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Deep Work Mode"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-nero-500/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm text-white/70">Description (optional)</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="e.g., For complex coding tasks"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-nero-500/50"
            />
          </div>

          {/* Icon & Color */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-white/70">Icon</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(ICONS).map((iconName) => {
                  const Icon = ICONS[iconName]
                  return (
                    <button
                      key={iconName}
                      onClick={() => setForm(prev => ({ ...prev, icon: iconName }))}
                      className={`p-2 rounded-lg transition-colors ${
                        form.icon === iconName
                          ? 'bg-nero-500 text-white'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/70">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setForm(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-lg transition-all ${
                      form.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-surface' : ''
                    }`}
                    style={{
                      backgroundColor: `var(--color-${color}-500, ${
                        color === 'blue' ? '#3b82f6' :
                        color === 'purple' ? '#a855f7' :
                        color === 'orange' ? '#f97316' :
                        color === 'green' ? '#22c55e' :
                        color === 'pink' ? '#ec4899' :
                        color === 'calm' ? '#06b6d4' :
                        '#8b5cf6'
                      })`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sound */}
          <div className="space-y-2">
            <label className="text-sm text-white/70 flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Ambient Sound
            </label>
            <div className="flex flex-wrap gap-2">
              {SOUND_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => updateSettings('sound', option.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    form.settings.sound === option.id
                      ? 'bg-nero-500 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timer */}
          <div className="space-y-2">
            <label className="text-sm text-white/70 flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Default Timer ({form.settings.timerDuration} min)
            </label>
            <div className="flex flex-wrap gap-2">
              {TIMER_PRESETS.map((duration) => (
                <button
                  key={duration}
                  onClick={() => updateSettings('timerDuration', duration)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    form.settings.timerDuration === duration
                      ? 'bg-nero-500 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {duration}m
                </button>
              ))}
            </div>
          </div>

          {/* Energy Filter */}
          <div className="space-y-2">
            <label className="text-sm text-white/70 flex items-center gap-2">
              <Battery className="w-4 h-4" />
              Task Energy Filter
            </label>
            <div className="flex flex-wrap gap-2">
              {ENERGY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => updateSettings('energyFilter', option.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    form.settings.energyFilter === option.id
                      ? 'bg-nero-500 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nero Tone */}
          <div className="space-y-2">
            <label className="text-sm text-white/70 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Nero's Tone
            </label>
            <div className="space-y-2">
              {TONE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => updateSettings('neroTone', option.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                    form.settings.neroTone === option.id
                      ? 'bg-nero-500/20 border border-nero-500/30'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    form.settings.neroTone === option.id
                      ? 'border-nero-500 bg-nero-500'
                      : 'border-white/30'
                  }`}>
                    {form.settings.neroTone === option.id && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{option.label}</p>
                    <p className="text-xs text-white/50">{option.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim()}
            className="flex-1 py-2.5 bg-nero-500 hover:bg-nero-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-colors"
          >
            Save Bundle
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Main Context Bundles Component
export default function ContextBundles({ onActivate, activeBundle }) {
  const prefersReducedMotion = useReducedMotion()
  const [bundles, setBundles] = useState(getBundles)
  const [editingBundle, setEditingBundle] = useState(null)
  const [showEditor, setShowEditor] = useState(false)

  // Save bundles when changed
  useEffect(() => {
    saveBundles(bundles)
  }, [bundles])

  const handleSaveBundle = (bundle) => {
    setBundles(prev => {
      const existing = prev.findIndex(b => b.id === bundle.id)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = bundle
        return updated
      }
      return [...prev, bundle]
    })
    setShowEditor(false)
    setEditingBundle(null)
  }

  const handleDeleteBundle = (bundleId) => {
    setBundles(prev => prev.filter(b => b.id !== bundleId))
  }

  const handleEditBundle = (bundle) => {
    setEditingBundle(bundle)
    setShowEditor(true)
  }

  const handleCreateBundle = () => {
    setEditingBundle(null)
    setShowEditor(true)
  }

  return (
    <div className="p-4 h-full overflow-auto">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold mb-2">Context Bundles</h1>
          <p className="text-white/60">One-tap environment presets for different work modes</p>
        </div>

        {/* Active Bundle Indicator */}
        {activeBundle && (
          <motion.div
            {...getMotionProps(prefersReducedMotion, {
              initial: { opacity: 0, y: -10 },
              animate: { opacity: 1, y: 0 },
            })}
            className="bg-nero-500/20 border border-nero-500/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-nero-500 flex items-center justify-center">
                <Play className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white/60">Currently Active</p>
                <p className="font-display font-semibold">{activeBundle.name}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Bundles Grid */}
        <div className="space-y-3">
          {bundles.map((bundle, index) => {
            const Icon = ICONS[bundle.icon] || Layers
            const isActive = activeBundle?.id === bundle.id

            return (
              <motion.div
                key={bundle.id}
                {...getMotionProps(prefersReducedMotion, {
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 },
                  transition: { delay: index * 0.05 },
                })}
                className={`group relative rounded-xl overflow-hidden transition-all ${
                  isActive
                    ? 'ring-2 ring-nero-500'
                    : 'hover:ring-1 hover:ring-white/20'
                }`}
              >
                <div className="bg-white/5 p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `var(--color-${bundle.color}-500, ${
                          bundle.color === 'blue' ? '#3b82f6' :
                          bundle.color === 'purple' ? '#a855f7' :
                          bundle.color === 'orange' ? '#f97316' :
                          bundle.color === 'green' ? '#22c55e' :
                          bundle.color === 'pink' ? '#ec4899' :
                          bundle.color === 'calm' ? '#06b6d4' :
                          '#8b5cf6'
                        })`,
                        opacity: isActive ? 1 : 0.7,
                      }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-lg">{bundle.name}</h3>
                      {bundle.description && (
                        <p className="text-sm text-white/60 mt-0.5">{bundle.description}</p>
                      )}

                      {/* Settings preview */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {bundle.settings.sound !== 'none' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded text-xs text-white/70">
                            <Volume2 className="w-3 h-3" />
                            {bundle.settings.sound}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded text-xs text-white/70">
                          <Timer className="w-3 h-3" />
                          {bundle.settings.timerDuration}m
                        </span>
                        {bundle.settings.energyFilter !== 'any' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded text-xs text-white/70">
                            <Battery className="w-3 h-3" />
                            {bundle.settings.energyFilter}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => onActivate(bundle)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          isActive
                            ? 'bg-nero-500 text-white'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {isActive ? 'Active' : 'Activate'}
                      </button>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditBundle(bundle)}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4 text-white/50" />
                        </button>
                        <button
                          onClick={() => handleDeleteBundle(bundle.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-400/70" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Create New Bundle */}
        <button
          onClick={handleCreateBundle}
          className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-white/20 rounded-xl text-white/60 hover:text-white/80 hover:border-white/30 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Custom Bundle</span>
        </button>

        {/* Tip */}
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-sm text-white/60">
            <span className="text-nero-400 font-medium">Tip:</span> Bundles help reduce decision fatigue.
            Create presets for different types of work and activate them with one tap to instantly configure your environment.
          </p>
        </div>
      </div>

      {/* Bundle Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <BundleEditor
            bundle={editingBundle}
            onSave={handleSaveBundle}
            onCancel={() => {
              setShowEditor(false)
              setEditingBundle(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
