import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Music,
  Waves,
  CloudRain,
  Wind,
  Bird,
  Coffee,
  Flame,
  Zap,
  Plus,
  X,
  Check,
  Sliders,
  Save,
  Trash2,
  Upload,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage keys
const SOUND_PRESETS_KEY = 'nero_sound_presets'
const SOUND_SETTINGS_KEY = 'nero_sound_settings'

// Built-in ambient sounds (simulated with descriptions)
const AMBIENT_SOUNDS = [
  { id: 'rain', name: 'Rain', icon: CloudRain, color: 'blue', description: 'Gentle rain on window' },
  { id: 'ocean', name: 'Ocean Waves', icon: Waves, color: 'cyan', description: 'Calm ocean waves' },
  { id: 'forest', name: 'Forest', icon: Bird, color: 'green', description: 'Birds and rustling leaves' },
  { id: 'fire', name: 'Fireplace', icon: Flame, color: 'orange', description: 'Crackling fire' },
  { id: 'cafe', name: 'Café', icon: Coffee, color: 'amber', description: 'Coffee shop ambiance' },
  { id: 'wind', name: 'Wind', icon: Wind, color: 'slate', description: 'Gentle breeze' },
  { id: 'thunder', name: 'Thunder', icon: Zap, color: 'purple', description: 'Distant thunder' },
  { id: 'whitenoise', name: 'White Noise', icon: Volume2, color: 'gray', description: 'Static white noise' },
]

// Notification sound options
const NOTIFICATION_SOUNDS = [
  { id: 'gentle', name: 'Gentle Chime', description: 'Soft bell tone' },
  { id: 'nature', name: 'Nature', description: 'Bird chirp' },
  { id: 'digital', name: 'Digital', description: 'Soft beep' },
  { id: 'meditation', name: 'Meditation', description: 'Singing bowl' },
  { id: 'none', name: 'Silent', description: 'No sound' },
]

// Load presets
const loadPresets = () => {
  try {
    const stored = localStorage.getItem(SOUND_PRESETS_KEY)
    return stored ? JSON.parse(stored) : [
      { id: 'focus', name: 'Deep Focus', sounds: { rain: 60, whitenoise: 20 } },
      { id: 'relax', name: 'Relaxation', sounds: { ocean: 70, wind: 30 } },
      { id: 'nature', name: 'Nature Walk', sounds: { forest: 80, wind: 20 } },
    ]
  } catch {
    return []
  }
}

// Save presets
const savePresets = (presets) => {
  localStorage.setItem(SOUND_PRESETS_KEY, JSON.stringify(presets))
}

// Load settings
const loadSettings = () => {
  try {
    const stored = localStorage.getItem(SOUND_SETTINGS_KEY)
    return stored ? JSON.parse(stored) : {
      masterVolume: 50,
      notificationSound: 'gentle',
      focusStartSound: true,
      focusEndSound: true,
      breakReminder: true,
    }
  } catch {
    return { masterVolume: 50, notificationSound: 'gentle' }
  }
}

// Save settings
const saveSettings = (settings) => {
  localStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify(settings))
}

export default function CustomSounds() {
  const prefersReducedMotion = useReducedMotion()
  const [presets, setPresets] = useState([])
  const [settings, setSettings] = useState({ masterVolume: 50, notificationSound: 'gentle' })
  const [activeSounds, setActiveSounds] = useState({})
  const [isPlaying, setIsPlaying] = useState(false)
  const [showMixer, setShowMixer] = useState(false)
  const [showSavePreset, setShowSavePreset] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [activeTab, setActiveTab] = useState('ambient')

  // Load data on mount
  useEffect(() => {
    setPresets(loadPresets())
    setSettings(loadSettings())
  }, [])

  // Toggle sound
  const toggleSound = (soundId) => {
    setActiveSounds(prev => {
      if (prev[soundId] !== undefined) {
        const { [soundId]: removed, ...rest } = prev
        return rest
      }
      return { ...prev, [soundId]: 50 }
    })
  }

  // Adjust sound volume
  const adjustSoundVolume = (soundId, volume) => {
    setActiveSounds(prev => ({
      ...prev,
      [soundId]: volume
    }))
  }

  // Play/Pause all
  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }

  // Load preset
  const loadPreset = (preset) => {
    setActiveSounds(preset.sounds)
    setIsPlaying(true)
  }

  // Save current mix as preset
  const saveCurrentAsPreset = () => {
    if (!newPresetName.trim() || Object.keys(activeSounds).length === 0) return

    const preset = {
      id: Date.now().toString(),
      name: newPresetName.trim(),
      sounds: { ...activeSounds },
      createdAt: new Date().toISOString(),
    }

    const updated = [...presets, preset]
    setPresets(updated)
    savePresets(updated)
    setNewPresetName('')
    setShowSavePreset(false)
  }

  // Delete preset
  const deletePreset = (presetId) => {
    const updated = presets.filter(p => p.id !== presetId)
    setPresets(updated)
    savePresets(updated)
  }

  // Update settings
  const updateSettings = (key, value) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    saveSettings(updated)
  }

  // Active sound count
  const activeSoundCount = Object.keys(activeSounds).length

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
              <Music className="w-6 h-6 text-indigo-400" />
              Sound Studio
            </h2>
            <p className="text-sm text-white/50">Custom soundscapes for focus</p>
          </div>
          <div className="flex items-center gap-2">
            {activeSoundCount > 0 && (
              <button
                onClick={togglePlayback}
                className={`p-3 rounded-xl transition-colors ${
                  isPlaying
                    ? 'bg-indigo-500 text-white'
                    : 'bg-indigo-500/20 text-indigo-400'
                }`}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'ambient', name: 'Ambient', icon: Waves },
            { id: 'presets', name: 'Presets', icon: Save },
            { id: 'notifications', name: 'Alerts', icon: Volume2 },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{tab.name}</span>
              </button>
            )
          })}
        </div>

        {/* Ambient Sounds Tab */}
        {activeTab === 'ambient' && (
          <div className="space-y-4">
            {/* Now Playing */}
            {activeSoundCount > 0 && (
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isPlaying ? (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <Volume2 className="w-5 h-5 text-indigo-400" />
                      </motion.div>
                    ) : (
                      <VolumeX className="w-5 h-5 text-white/50" />
                    )}
                    <span className="font-medium">
                      {isPlaying ? 'Now Playing' : 'Paused'}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowSavePreset(true)}
                    className="text-sm text-indigo-400 hover:text-indigo-300"
                  >
                    <Save className="w-4 h-4 inline mr-1" />
                    Save Mix
                  </button>
                </div>

                {/* Active Sound Levels */}
                <div className="space-y-3">
                  {Object.entries(activeSounds).map(([soundId, volume]) => {
                    const sound = AMBIENT_SOUNDS.find(s => s.id === soundId)
                    if (!sound) return null
                    const Icon = sound.icon

                    return (
                      <div key={soundId} className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 text-${sound.color}-400`} />
                        <span className="text-sm w-20">{sound.name}</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={volume}
                          onChange={(e) => adjustSoundVolume(soundId, parseInt(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-xs text-white/50 w-8">{volume}%</span>
                        <button
                          onClick={() => toggleSound(soundId)}
                          className="p-1 rounded hover:bg-white/10"
                        >
                          <X className="w-3 h-3 text-white/50" />
                        </button>
                      </div>
                    )
                  })}
                </div>

                {/* Master Volume */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-4 h-4 text-white/50" />
                    <span className="text-sm text-white/70">Master</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.masterVolume}
                      onChange={(e) => updateSettings('masterVolume', parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-xs text-white/50 w-8">{settings.masterVolume}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sound Grid */}
            <div className="grid grid-cols-2 gap-3">
              {AMBIENT_SOUNDS.map((sound) => {
                const Icon = sound.icon
                const isActive = activeSounds[sound.id] !== undefined

                return (
                  <motion.button
                    key={sound.id}
                    onClick={() => toggleSound(sound.id)}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-xl text-left transition-colors ${
                      isActive
                        ? `bg-${sound.color}-500/20 border border-${sound.color}-500/30`
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`w-6 h-6 ${isActive ? `text-${sound.color}-400` : 'text-white/50'}`} />
                      {isActive && (
                        <Check className={`w-4 h-4 text-${sound.color}-400`} />
                      )}
                    </div>
                    <p className="font-medium text-sm">{sound.name}</p>
                    <p className="text-xs text-white/50">{sound.description}</p>
                  </motion.button>
                )
              })}
            </div>

            {/* Tip */}
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-xs text-white/60">
                <strong className="text-white/80">Focus Tip:</strong> Layer multiple sounds
                to create your perfect focus environment. Many with ADHD find steady ambient
                noise helps reduce distractions.
              </p>
            </div>
          </div>
        )}

        {/* Presets Tab */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            {presets.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <Save className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <h3 className="font-medium mb-2">No Saved Presets</h3>
                <p className="text-sm text-white/50">
                  Create a sound mix and save it for quick access
                </p>
              </div>
            ) : (
              presets.map((preset) => (
                <motion.div
                  key={preset.id}
                  {...getMotionProps(prefersReducedMotion, {
                    initial: { opacity: 0, y: 10 },
                    animate: { opacity: 1, y: 0 }
                  })}
                  className="glass-card p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{preset.name}</h3>
                      <p className="text-xs text-white/50">
                        {Object.keys(preset.sounds).length} sounds
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => loadPreset(preset)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-sm transition-colors"
                      >
                        <Play className="w-3 h-3 inline mr-1" />
                        Play
                      </button>
                      {!['focus', 'relax', 'nature'].includes(preset.id) && (
                        <button
                          onClick={() => deletePreset(preset.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400/50 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sound preview */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {Object.entries(preset.sounds).map(([soundId, volume]) => {
                      const sound = AMBIENT_SOUNDS.find(s => s.id === soundId)
                      if (!sound) return null
                      const Icon = sound.icon

                      return (
                        <div
                          key={soundId}
                          className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg text-xs"
                        >
                          <Icon className="w-3 h-3" />
                          <span>{sound.name}</span>
                          <span className="text-white/40">{volume}%</span>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            {/* Notification Sound Selection */}
            <div className="glass-card p-4">
              <h3 className="font-medium mb-3">Notification Sound</h3>
              <div className="space-y-2">
                {NOTIFICATION_SOUNDS.map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => updateSettings('notificationSound', sound.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      settings.notificationSound === sound.id
                        ? 'bg-indigo-500/20 border border-indigo-500/30'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium">{sound.name}</p>
                      <p className="text-xs text-white/50">{sound.description}</p>
                    </div>
                    {settings.notificationSound === sound.id && (
                      <Check className="w-4 h-4 text-indigo-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Triggers */}
            <div className="glass-card p-4">
              <h3 className="font-medium mb-3">Sound Triggers</h3>
              <div className="space-y-3">
                {[
                  { id: 'focusStartSound', name: 'Focus Session Start', description: 'Play sound when focus starts' },
                  { id: 'focusEndSound', name: 'Focus Session End', description: 'Play sound when focus ends' },
                  { id: 'breakReminder', name: 'Break Reminders', description: 'Sound for break notifications' },
                ].map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">{option.name}</p>
                      <p className="text-xs text-white/50">{option.description}</p>
                    </div>
                    <button
                      onClick={() => updateSettings(option.id, !settings[option.id])}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings[option.id] ? 'bg-indigo-500' : 'bg-white/20'
                      }`}
                    >
                      <motion.div
                        className="w-5 h-5 bg-white rounded-full shadow"
                        animate={{ x: settings[option.id] ? 26 : 2 }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ADHD-Friendly Tip */}
            <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <p className="text-sm">
                <strong className="text-indigo-400">Sound Sensitivity:</strong> Many people with
                ADHD are sensitive to sounds. Choose notifications that are noticeable but
                won't startle you.
              </p>
            </div>
          </div>
        )}

        {/* Save Preset Modal */}
        <AnimatePresence>
          {showSavePreset && (
            <motion.div
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 }
              })}
              className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
              onClick={() => setShowSavePreset(false)}
            >
              <motion.div
                {...getMotionProps(prefersReducedMotion, {
                  initial: { scale: 0.95 },
                  animate: { scale: 1 },
                  exit: { scale: 0.95 }
                })}
                className="bg-[#1a1a2e] rounded-2xl p-6 w-full max-w-md"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="font-display text-lg font-semibold mb-4">Save Sound Mix</h3>

                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-1">Preset Name</label>
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="My Focus Mix"
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500/50 outline-none"
                  />
                </div>

                {/* Preview */}
                <div className="p-3 bg-white/5 rounded-lg mb-4">
                  <p className="text-xs text-white/50 mb-2">Sounds in this mix:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(activeSounds).map(([soundId, volume]) => {
                      const sound = AMBIENT_SOUNDS.find(s => s.id === soundId)
                      if (!sound) return null

                      return (
                        <span key={soundId} className="text-sm bg-white/10 px-2 py-1 rounded">
                          {sound.name} ({volume}%)
                        </span>
                      )
                    })}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSavePreset(false)}
                    className="flex-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveCurrentAsPreset}
                    disabled={!newPresetName.trim()}
                    className="flex-1 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Save Preset
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
