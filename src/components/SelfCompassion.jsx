import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  MessageCircle,
  BookOpen,
  Sun,
  Cloud,
  Star,
  Coffee,
  X,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const FAVORITES_KEY = 'nero_compassion_favorites'

// Self-compassion prompts organized by situation
const PROMPTS = {
  struggling: [
    "It's okay to struggle. This is hard, and you're doing your best.",
    "You don't have to be perfect. Being human is enough.",
    "This difficult moment will pass. You've survived hard times before.",
    "Your worth isn't measured by your productivity.",
    "It's okay to take a break. Rest is not laziness.",
    "Be gentle with yourself. You're fighting battles others can't see.",
    "Progress isn't linear. Today's struggle is part of tomorrow's growth.",
  ],
  frustrated: [
    "Frustration means you care. That's a good thing.",
    "It's okay to feel frustrated. Let the feeling pass through you.",
    "You're not behind. You're on your own timeline.",
    "This task doesn't define your capability.",
    "Take a breath. The task will still be there in 5 minutes.",
    "What would you say to a friend feeling this way?",
    "Your brain works differently, not worse.",
  ],
  overwhelmed: [
    "You don't have to do everything at once. Just the next tiny step.",
    "It's okay to ask for help. That's strength, not weakness.",
    "You're allowed to say no to things.",
    "Overwhelming feelings are temporary visitors, not permanent residents.",
    "Focus on one thing. Just one.",
    "Your plate is full because you're capable. But it's okay to remove something.",
    "The world won't end if you don't finish everything today.",
  ],
  failure: [
    "Failure is how we learn. Every expert was once a beginner.",
    "You are not your mistakes. You are not your failures.",
    "One bad day doesn't erase all your good days.",
    "Setbacks are setups for comebacks.",
    "You tried. That took courage. Try again when you're ready.",
    "Would you be this hard on someone you love? Be that loving to yourself.",
    "This moment of failure is just a chapter, not your whole story.",
  ],
  general: [
    "You are worthy of love and belonging, exactly as you are.",
    "Your ADHD is part of you, not all of you.",
    "You have survived 100% of your worst days so far.",
    "It's okay to not be okay sometimes.",
    "You bring unique gifts to the world that only you can offer.",
    "Comparison is the thief of joy. Your journey is yours alone.",
    "You are enough, right now, as you are.",
    "Self-compassion isn't selfish. It's necessary.",
  ],
}

// Affirmations
const AFFIRMATIONS = [
  "I am worthy of good things.",
  "I am capable of handling challenges.",
  "I am allowed to take up space.",
  "I am learning and growing every day.",
  "I am doing my best with what I have.",
  "I am more than my productivity.",
  "I am allowed to rest without guilt.",
  "I am enough, exactly as I am.",
  "I am resilient and adaptable.",
  "I am worthy of self-compassion.",
]

// Grounding exercises
const GROUNDING_EXERCISES = [
  {
    title: "5-4-3-2-1",
    description: "Name 5 things you see, 4 things you feel, 3 things you hear, 2 things you smell, 1 thing you taste.",
  },
  {
    title: "Box Breathing",
    description: "Breathe in for 4 counts, hold for 4, breathe out for 4, hold for 4. Repeat 4 times.",
  },
  {
    title: "Body Scan",
    description: "Starting from your toes, slowly notice each part of your body. Release any tension you find.",
  },
  {
    title: "Cold Water",
    description: "Splash cold water on your face or hold an ice cube. The sensation helps reset your nervous system.",
  },
  {
    title: "Name Your Feeling",
    description: "Simply say: 'I am feeling [emotion].' Naming it helps process it.",
  },
]

// Load favorites
const loadFavorites = () => {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save favorites
const saveFavorites = (favorites) => {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
}

export default function SelfCompassion() {
  const prefersReducedMotion = useReducedMotion()
  const [currentSituation, setCurrentSituation] = useState('general')
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [currentAffirmation, setCurrentAffirmation] = useState('')
  const [favorites, setFavorites] = useState([])
  const [copied, setCopied] = useState(false)
  const [showExercise, setShowExercise] = useState(null)
  const [viewMode, setViewMode] = useState('prompts') // 'prompts' | 'affirmations' | 'exercises' | 'favorites'

  // Load data on mount
  useEffect(() => {
    setFavorites(loadFavorites())
    refreshPrompt()
    refreshAffirmation()
  }, [])

  // Refresh prompt
  const refreshPrompt = useCallback(() => {
    const prompts = PROMPTS[currentSituation]
    const newPrompt = prompts[Math.floor(Math.random() * prompts.length)]
    setCurrentPrompt(newPrompt)
  }, [currentSituation])

  // Refresh affirmation
  const refreshAffirmation = () => {
    const newAffirmation = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]
    setCurrentAffirmation(newAffirmation)
  }

  // Change situation and refresh prompt
  const changeSituation = (situation) => {
    setCurrentSituation(situation)
    const prompts = PROMPTS[situation]
    setCurrentPrompt(prompts[Math.floor(Math.random() * prompts.length)])
  }

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Toggle favorite
  const toggleFavorite = (text) => {
    const newFavorites = favorites.includes(text)
      ? favorites.filter(f => f !== text)
      : [...favorites, text]
    setFavorites(newFavorites)
    saveFavorites(newFavorites)
  }

  // Situation options
  const situations = [
    { id: 'general', label: 'General', icon: Heart },
    { id: 'struggling', label: 'Struggling', icon: Cloud },
    { id: 'frustrated', label: 'Frustrated', icon: Coffee },
    { id: 'overwhelmed', label: 'Overwhelmed', icon: Sun },
    { id: 'failure', label: 'After Failure', icon: Star },
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
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/20 text-pink-400 text-sm mb-3">
            <Heart className="w-4 h-4" />
            <span>Self-Compassion</span>
          </div>
          <h2 className="font-display text-xl font-semibold">Be Kind to Yourself</h2>
          <p className="text-sm text-white/50 mt-1">Gentle reminders when you need them</p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'prompts', label: 'Prompts', icon: MessageCircle },
            { id: 'affirmations', label: 'Affirmations', icon: Sparkles },
            { id: 'exercises', label: 'Exercises', icon: BookOpen },
            { id: 'favorites', label: 'Saved', icon: Star },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-sm transition-colors ${
                viewMode === tab.id
                  ? 'bg-white/10 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Prompts View */}
        {viewMode === 'prompts' && (
          <>
            {/* Situation Selector */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {situations.map((situation) => (
                <button
                  key={situation.id}
                  onClick={() => changeSituation(situation.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    currentSituation === situation.id
                      ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <situation.icon className="w-4 h-4" />
                  {situation.label}
                </button>
              ))}
            </div>

            {/* Current Prompt */}
            <motion.div
              key={currentPrompt}
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0, scale: 0.95 },
                animate: { opacity: 1, scale: 1 }
              })}
              className="glass-card p-6 mb-4 text-center border border-pink-500/20"
            >
              <p className="text-lg leading-relaxed mb-4">{currentPrompt}</p>

              <div className="flex justify-center gap-2">
                <button
                  onClick={refreshPrompt}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  New
                </button>
                <button
                  onClick={() => copyToClipboard(currentPrompt)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={() => toggleFavorite(currentPrompt)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                    favorites.includes(currentPrompt)
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Star className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </>
        )}

        {/* Affirmations View */}
        {viewMode === 'affirmations' && (
          <>
            <motion.div
              key={currentAffirmation}
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0, scale: 0.95 },
                animate: { opacity: 1, scale: 1 }
              })}
              className="glass-card p-6 mb-4 text-center bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20"
            >
              <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-4" />
              <p className="text-xl font-medium leading-relaxed mb-4">{currentAffirmation}</p>

              <div className="flex justify-center gap-2">
                <button
                  onClick={refreshAffirmation}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  New
                </button>
                <button
                  onClick={() => toggleFavorite(currentAffirmation)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                    favorites.includes(currentAffirmation)
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Star className="w-4 h-4" />
                </button>
              </div>
            </motion.div>

            {/* All Affirmations */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-white/50 mb-2">All Affirmations</h3>
              {AFFIRMATIONS.map((affirmation, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentAffirmation(affirmation)}
                  className={`w-full text-left p-3 rounded-xl transition-colors ${
                    currentAffirmation === affirmation
                      ? 'bg-purple-500/20 border border-purple-500/30'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <p className="text-sm">{affirmation}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Exercises View */}
        {viewMode === 'exercises' && (
          <div className="space-y-3">
            {GROUNDING_EXERCISES.map((exercise, i) => (
              <motion.div
                key={i}
                {...getMotionProps(prefersReducedMotion, {
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 },
                  transition: { delay: i * 0.1 }
                })}
              >
                <button
                  onClick={() => setShowExercise(showExercise === i ? null : i)}
                  className="w-full glass-card p-4 text-left"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{exercise.title}</h3>
                    {showExercise === i ? (
                      <X className="w-4 h-4 text-white/50" />
                    ) : (
                      <BookOpen className="w-4 h-4 text-white/50" />
                    )}
                  </div>

                  <AnimatePresence>
                    {showExercise === i && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="text-sm text-white/70 mt-3 pt-3 border-t border-white/10"
                      >
                        {exercise.description}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Favorites View */}
        {viewMode === 'favorites' && (
          <div className="space-y-3">
            {favorites.length > 0 ? (
              favorites.map((fav, i) => (
                <div
                  key={i}
                  className="glass-card p-4 flex items-start gap-3"
                >
                  <Star className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-1" />
                  <p className="text-sm flex-1">{fav}</p>
                  <button
                    onClick={() => toggleFavorite(fav)}
                    className="p-1 rounded hover:bg-red-500/20 transition-colors"
                  >
                    <X className="w-4 h-4 text-red-400/50" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Star className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50">No favorites saved yet</p>
                <p className="text-sm text-white/30 mt-1">
                  Star prompts and affirmations to save them here
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="mt-6 p-4 bg-white/5 rounded-xl">
          <p className="text-sm text-white/50">
            <strong className="text-white/70">Remember:</strong> Self-compassion isn't about making excuses.
            It's about treating yourself with the same kindness you'd show a good friend.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
