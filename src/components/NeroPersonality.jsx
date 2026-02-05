import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Heart,
  Zap,
  Shield,
  Smile,
  Target,
  MessageCircle,
  Volume2,
  Check,
  RefreshCw,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const PERSONALITY_KEY = 'nero_personality'

// Personality types
const PERSONALITIES = [
  {
    id: 'gentle',
    name: 'Gentle Guide',
    icon: Heart,
    color: 'pink',
    description: 'Soft, patient, and understanding. Like a supportive friend.',
    examples: [
      "It's okay if you didn't finish everything today. You're doing your best.",
      "Hey, I noticed you've been at this for a while. Maybe a small break?",
      "Whatever you accomplish today is enough. I believe in you.",
    ],
    traits: ['Patient', 'Warm', 'Encouraging', 'Non-judgmental'],
  },
  {
    id: 'coach',
    name: 'Encouraging Coach',
    icon: Target,
    color: 'orange',
    description: 'Motivating and action-oriented. Pushes you forward positively.',
    examples: [
      "You've got this! Let's tackle one thing at a time.",
      "Great progress! Ready for the next challenge?",
      "I see you building momentum. Keep that energy going!",
    ],
    traits: ['Motivating', 'Energetic', 'Goal-focused', 'Upbeat'],
  },
  {
    id: 'direct',
    name: 'Straight Shooter',
    icon: Zap,
    color: 'yellow',
    description: 'Clear, concise, no-nonsense. Gets right to the point.',
    examples: [
      "Task added. What's next?",
      "Timer done. 5-minute break, then back to work.",
      "You said you'd work on this. Let's go.",
    ],
    traits: ['Direct', 'Efficient', 'Clear', 'Brief'],
  },
  {
    id: 'playful',
    name: 'Playful Buddy',
    icon: Smile,
    color: 'green',
    description: 'Fun, lighthearted, uses humor to motivate.',
    examples: [
      "Ooh, another task conquered! Your brain is on fire today! 🔥",
      "Break time! Go touch some grass. I'll wait. 🌱",
      "You just completed 3 tasks in a row. Who ARE you?!",
    ],
    traits: ['Funny', 'Playful', 'Casual', 'Uses emojis'],
  },
  {
    id: 'calm',
    name: 'Calm Anchor',
    icon: Shield,
    color: 'blue',
    description: 'Serene, grounding, helps manage anxiety and overwhelm.',
    examples: [
      "Take a breath. There's no rush. One step at a time.",
      "Your only job right now is this one thing. Everything else can wait.",
      "Notice how you feel. Whatever it is, it's valid.",
    ],
    traits: ['Calming', 'Grounding', 'Mindful', 'Reassuring'],
  },
]

// Communication preferences
const COMM_PREFS = [
  { id: 'proactive', label: 'Proactive Check-ins', description: 'Nero reaches out periodically' },
  { id: 'reactive', label: 'On-demand Only', description: 'Only responds when asked' },
  { id: 'celebratory', label: 'Celebrate Wins', description: 'Extra enthusiasm for completions' },
  { id: 'minimal', label: 'Minimal Messages', description: 'Keep notifications brief' },
]

// Load settings
const loadSettings = () => {
  try {
    const stored = localStorage.getItem(PERSONALITY_KEY)
    return stored ? JSON.parse(stored) : {
      personality: 'gentle',
      communicationPrefs: ['proactive', 'celebratory'],
      name: 'Nero',
      voiceEnabled: true,
    }
  } catch {
    return { personality: 'gentle', communicationPrefs: ['proactive', 'celebratory'], name: 'Nero' }
  }
}

// Save settings
const saveSettings = (settings) => {
  localStorage.setItem(PERSONALITY_KEY, JSON.stringify(settings))
}

export default function NeroPersonality({ onPersonalityChange }) {
  const prefersReducedMotion = useReducedMotion()
  const [settings, setSettings] = useState(loadSettings())
  const [previewMessage, setPreviewMessage] = useState('')

  // Load settings on mount
  useEffect(() => {
    const loaded = loadSettings()
    setSettings(loaded)
    updatePreview(loaded.personality)
  }, [])

  // Update settings
  const updateSettings = (key, value) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    saveSettings(updated)
    onPersonalityChange?.(updated)

    if (key === 'personality') {
      updatePreview(value)
    }
  }

  // Toggle communication preference
  const toggleCommPref = (prefId) => {
    const prefs = settings.communicationPrefs.includes(prefId)
      ? settings.communicationPrefs.filter(p => p !== prefId)
      : [...settings.communicationPrefs, prefId]
    updateSettings('communicationPrefs', prefs)
  }

  // Update preview message
  const updatePreview = (personalityId) => {
    const personality = PERSONALITIES.find(p => p.id === personalityId)
    if (personality) {
      const randomIndex = Math.floor(Math.random() * personality.examples.length)
      setPreviewMessage(personality.examples[randomIndex])
    }
  }

  // Get current personality
  const currentPersonality = PERSONALITIES.find(p => p.id === settings.personality)

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
          <h2 className="font-display text-xl font-semibold">Nero's Personality</h2>
          <p className="text-sm text-white/50">Customize how Nero communicates with you</p>
        </div>

        {/* Current Personality Preview */}
        {currentPersonality && (
          <motion.div
            {...getMotionProps(prefersReducedMotion, {
              initial: { opacity: 0, scale: 0.95 },
              animate: { opacity: 1, scale: 1 }
            })}
            className={`mb-6 p-4 glass-card border border-${currentPersonality.color}-500/30`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-${currentPersonality.color}-500/20 flex items-center justify-center`}>
                <currentPersonality.icon className={`w-5 h-5 text-${currentPersonality.color}-400`} />
              </div>
              <div>
                <p className="font-medium">{currentPersonality.name}</p>
                <p className="text-xs text-white/50">Current personality</p>
              </div>
            </div>

            <div className="p-3 bg-white/5 rounded-xl">
              <div className="flex items-start gap-2">
                <MessageCircle className="w-4 h-4 text-white/30 mt-0.5" />
                <p className="text-sm italic">"{previewMessage}"</p>
              </div>
            </div>

            <button
              onClick={() => updatePreview(settings.personality)}
              className="mt-2 text-xs text-white/40 hover:text-white/60 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Show another example
            </button>
          </motion.div>
        )}

        {/* Personality Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-white/70 mb-3">Choose Personality</h3>
          <div className="space-y-2">
            {PERSONALITIES.map((personality) => {
              const Icon = personality.icon
              const isSelected = settings.personality === personality.id

              return (
                <button
                  key={personality.id}
                  onClick={() => updateSettings('personality', personality.id)}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    isSelected
                      ? `bg-${personality.color}-500/20 border-2 border-${personality.color}-500`
                      : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-${personality.color}-500/20 flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 text-${personality.color}-400`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{personality.name}</p>
                        {isSelected && <Check className="w-4 h-4 text-green-400" />}
                      </div>
                      <p className="text-sm text-white/50 mt-1">{personality.description}</p>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {personality.traits.map((trait) => (
                          <span key={trait} className="text-xs px-2 py-0.5 rounded-full bg-white/10">
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Communication Preferences */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-white/70 mb-3">Communication Style</h3>
          <div className="space-y-2">
            {COMM_PREFS.map((pref) => {
              const isSelected = settings.communicationPrefs.includes(pref.id)

              return (
                <button
                  key={pref.id}
                  onClick={() => toggleCommPref(pref.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                    isSelected
                      ? 'bg-nero-500/20 border border-nero-500/30'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div>
                    <p className="font-medium text-sm">{pref.label}</p>
                    <p className="text-xs text-white/50">{pref.description}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                    isSelected ? 'bg-nero-500' : 'bg-white/10'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Nero's Name */}
        <div className="mb-6 glass-card p-4">
          <h3 className="text-sm font-medium text-white/70 mb-2">Nero's Name</h3>
          <p className="text-xs text-white/50 mb-3">Give your AI companion a custom name</p>
          <input
            type="text"
            value={settings.name}
            onChange={(e) => updateSettings('name', e.target.value)}
            placeholder="Nero"
            maxLength={20}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
          />
        </div>

        {/* Voice Responses */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-white/50" />
              <div>
                <p className="font-medium">Voice Responses</p>
                <p className="text-xs text-white/50">Nero speaks messages aloud</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings('voiceEnabled', !settings.voiceEnabled)}
              className={`w-12 h-6 rounded-full relative transition-colors ${
                settings.voiceEnabled ? 'bg-nero-500' : 'bg-white/20'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                settings.voiceEnabled ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-white/5 rounded-xl">
          <p className="text-sm text-white/50">
            <strong className="text-white/70">Tip:</strong> Different moods call for different
            approaches. Feel free to change Nero's personality whenever you need a different
            kind of support.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
