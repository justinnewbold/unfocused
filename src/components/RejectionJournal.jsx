import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  HeartCrack,
  Plus,
  X,
  MessageCircle,
  RefreshCw,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Shield,
  Eye,
  EyeOff,
  Trash2,
  BookOpen,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const JOURNAL_KEY = 'nero_rejection_journal'

// Reframing prompts
const REFRAMING_PROMPTS = [
  "What evidence do I have that this interpretation is true?",
  "Would I say this to a friend in the same situation?",
  "What's another way to interpret this situation?",
  "Will this matter in a week? A month? A year?",
  "Am I taking responsibility for something that's not mine?",
  "What would I tell someone I love who had this thought?",
  "Is this a fact or a feeling?",
  "What would happen if I let go of this thought?",
]

// Self-compassion responses
const COMPASSION_RESPONSES = [
  "It's okay to feel hurt. Your feelings are valid.",
  "You're doing the best you can with what you have.",
  "This moment of pain doesn't define your worth.",
  "Being sensitive is a strength, not a weakness.",
  "You deserve kindness, especially from yourself.",
  "It's human to want connection and approval.",
  "Your brain is trying to protect you. Thank it, then let go.",
  "You are more than this one interaction.",
]

// Load journal
const loadJournal = () => {
  try {
    const stored = localStorage.getItem(JOURNAL_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save journal
const saveJournal = (entries) => {
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries.slice(-100)))
}

export default function RejectionJournal({ onEntryAdded }) {
  const prefersReducedMotion = useReducedMotion()
  const [entries, setEntries] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [expandedEntry, setExpandedEntry] = useState(null)
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)
  const [viewMode, setViewMode] = useState('entries') // 'entries' | 'tools'

  // Form state
  const [newEntry, setNewEntry] = useState({
    situation: '',
    initialThought: '',
    emotion: '',
    intensity: 5,
    reframe: '',
    compassionNote: '',
  })

  // Load data on mount
  useEffect(() => {
    setEntries(loadJournal())
  }, [])

  // Get random compassion response
  const getRandomCompassion = () => {
    const index = Math.floor(Math.random() * COMPASSION_RESPONSES.length)
    return COMPASSION_RESPONSES[index]
  }

  // Cycle through reframing prompts
  const nextPrompt = () => {
    setCurrentPromptIndex((prev) => (prev + 1) % REFRAMING_PROMPTS.length)
  }

  // Save entry
  const saveEntry = () => {
    if (!newEntry.situation.trim()) return

    const entry = {
      ...newEntry,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      compassionResponse: getRandomCompassion(),
    }

    const updatedEntries = [entry, ...entries]
    setEntries(updatedEntries)
    saveJournal(updatedEntries)
    resetForm()
    onEntryAdded?.(entry)
  }

  // Delete entry
  const deleteEntry = (entryId) => {
    const updatedEntries = entries.filter(e => e.id !== entryId)
    setEntries(updatedEntries)
    saveJournal(updatedEntries)
  }

  // Reset form
  const resetForm = () => {
    setNewEntry({
      situation: '',
      initialThought: '',
      emotion: '',
      intensity: 5,
      reframe: '',
      compassionNote: '',
    })
    setShowAddModal(false)
    setCurrentPromptIndex(0)
  }

  // Stats
  const stats = useMemo(() => {
    const last7Days = entries.filter(e => {
      const days = (new Date() - new Date(e.createdAt)) / (1000 * 60 * 60 * 24)
      return days < 7
    })

    const avgIntensity = entries.length > 0
      ? Math.round(entries.reduce((sum, e) => sum + e.intensity, 0) / entries.length * 10) / 10
      : 0

    const emotions = {}
    entries.forEach(e => {
      if (e.emotion) {
        emotions[e.emotion] = (emotions[e.emotion] || 0) + 1
      }
    })
    const topEmotion = Object.entries(emotions).sort((a, b) => b[1] - a[1])[0]

    return {
      total: entries.length,
      thisWeek: last7Days.length,
      avgIntensity,
      topEmotion: topEmotion ? topEmotion[0] : null,
    }
  }, [entries])

  // Emotion options
  const emotions = [
    { id: 'hurt', label: 'Hurt', color: 'red' },
    { id: 'anxious', label: 'Anxious', color: 'orange' },
    { id: 'ashamed', label: 'Ashamed', color: 'purple' },
    { id: 'angry', label: 'Angry', color: 'red' },
    { id: 'sad', label: 'Sad', color: 'blue' },
    { id: 'embarrassed', label: 'Embarrassed', color: 'pink' },
    { id: 'lonely', label: 'Lonely', color: 'indigo' },
    { id: 'worthless', label: 'Worthless', color: 'gray' },
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
            <h2 className="font-display text-xl font-semibold">Rejection Journal</h2>
            <p className="text-sm text-white/50">Process RSD with compassion</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'entries', label: 'Journal', icon: BookOpen },
            { id: 'tools', label: 'Tools', icon: Shield },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                viewMode === tab.id
                  ? 'bg-white/10 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        {stats.total > 0 && viewMode === 'entries' && (
          <div className="glass-card p-4 mb-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-pink-400">{stats.thisWeek}</p>
                <p className="text-xs text-white/50">This week</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">{stats.avgIntensity}</p>
                <p className="text-xs text-white/50">Avg intensity</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-400 capitalize">{stats.topEmotion || '-'}</p>
                <p className="text-xs text-white/50">Top emotion</p>
              </div>
            </div>
          </div>
        )}

        {/* Tools View */}
        {viewMode === 'tools' && (
          <div className="space-y-4">
            {/* Quick Reframe Tool */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <h3 className="font-medium">Quick Reframe</h3>
              </div>
              <p className="text-sm text-white/70 mb-4">
                Ask yourself this question:
              </p>
              <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20 mb-3">
                <p className="text-yellow-400 font-medium">
                  "{REFRAMING_PROMPTS[currentPromptIndex]}"
                </p>
              </div>
              <button
                onClick={nextPrompt}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Next question
              </button>
            </div>

            {/* Self-Compassion */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-5 h-5 text-pink-400" />
                <h3 className="font-medium">Self-Compassion Moment</h3>
              </div>
              <div className="p-4 bg-pink-500/10 rounded-xl border border-pink-500/20">
                <p className="text-pink-300">
                  "{getRandomCompassion()}"
                </p>
              </div>
            </div>

            {/* Understanding RSD */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-indigo-400" />
                <h3 className="font-medium">Understanding RSD</h3>
              </div>
              <ul className="space-y-2 text-sm text-white/70">
                <li>- RSD (Rejection Sensitive Dysphoria) is common with ADHD</li>
                <li>- It's not your fault - it's a neurological response</li>
                <li>- The intensity is real, but the interpretation may not be</li>
                <li>- Naming it helps reduce its power over you</li>
                <li>- Self-compassion is the antidote to shame</li>
              </ul>
            </div>

            {/* Grounding Exercise */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5 text-cyan-400" />
                <h3 className="font-medium">Quick Grounding</h3>
              </div>
              <p className="text-sm text-white/70 mb-3">
                When emotions are overwhelming, ground yourself:
              </p>
              <ol className="space-y-2 text-sm text-white/70">
                <li>1. Take 3 slow breaths</li>
                <li>2. Name what you're feeling</li>
                <li>3. Remind yourself: "This will pass"</li>
                <li>4. Do something kind for yourself</li>
              </ol>
            </div>
          </div>
        )}

        {/* Entries View */}
        {viewMode === 'entries' && (
          <div className="space-y-3">
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                {...getMotionProps(prefersReducedMotion, {
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 }
                })}
                className="glass-card p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <HeartCrack className="w-4 h-4 text-pink-400" />
                    <span className="text-xs text-white/50">
                      {new Date(entry.createdAt).toLocaleDateString('en', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                    {entry.emotion && (
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs capitalize">
                        {entry.emotion}
                      </span>
                    )}
                    <span className="text-xs text-white/40">
                      {entry.intensity}/10
                    </span>
                  </div>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400/50" />
                  </button>
                </div>

                <p className="text-sm mb-2">{entry.situation}</p>

                <button
                  onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                  className="flex items-center gap-1 text-xs text-white/50 hover:text-white/70"
                >
                  {expandedEntry === entry.id ? (
                    <>
                      <ChevronUp className="w-3 h-3" /> Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" /> More
                    </>
                  )}
                </button>

                <AnimatePresence>
                  {expandedEntry === entry.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                        {entry.initialThought && (
                          <div>
                            <p className="text-xs text-white/50 mb-1">Initial Thought:</p>
                            <p className="text-sm text-red-300">{entry.initialThought}</p>
                          </div>
                        )}
                        {entry.reframe && (
                          <div>
                            <p className="text-xs text-white/50 mb-1">Reframe:</p>
                            <p className="text-sm text-green-300">{entry.reframe}</p>
                          </div>
                        )}
                        {entry.compassionResponse && (
                          <div className="p-3 bg-pink-500/10 rounded-lg">
                            <p className="text-xs text-pink-400 mb-1">Self-Compassion:</p>
                            <p className="text-sm text-pink-300">{entry.compassionResponse}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            {entries.length === 0 && (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50">No entries yet</p>
                <p className="text-sm text-white/30 mt-1">
                  A safe space to process difficult feelings
                </p>
              </div>
            )}
          </div>
        )}

        {/* Add Entry Modal */}
        <AnimatePresence>
          {showAddModal && (
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
                onClick={resetForm}
              />

              <motion.div
                className="relative w-full max-w-md glass-card p-5 max-h-[90vh] overflow-y-auto"
                {...getMotionProps(prefersReducedMotion, {
                  initial: { y: 100, opacity: 0 },
                  animate: { y: 0, opacity: 1 },
                  exit: { y: 100, opacity: 0 }
                })}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-semibold">New Entry</h3>
                  <button
                    onClick={resetForm}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Situation */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">What happened? *</label>
                  <textarea
                    value={newEntry.situation}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, situation: e.target.value }))}
                    placeholder="Describe the situation that triggered these feelings..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 resize-none"
                    rows={3}
                  />
                </div>

                {/* Emotion */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">What are you feeling?</label>
                  <div className="flex flex-wrap gap-2">
                    {emotions.map((emotion) => (
                      <button
                        key={emotion.id}
                        onClick={() => setNewEntry(prev => ({ ...prev, emotion: emotion.id }))}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          newEntry.emotion === emotion.id
                            ? `bg-${emotion.color}-500/20 text-${emotion.color}-400 border border-${emotion.color}-500/30`
                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {emotion.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Intensity */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">
                    Intensity: {newEntry.intensity}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={newEntry.intensity}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, intensity: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                {/* Initial Thought */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Initial thought</label>
                  <textarea
                    value={newEntry.initialThought}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, initialThought: e.target.value }))}
                    placeholder="What went through your mind?"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 resize-none"
                    rows={2}
                  />
                </div>

                {/* Reframe prompt */}
                <div className="mb-4 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                  <p className="text-xs text-yellow-400 mb-2">Reframing prompt:</p>
                  <p className="text-sm text-yellow-300 mb-2">
                    "{REFRAMING_PROMPTS[currentPromptIndex]}"
                  </p>
                  <button
                    onClick={nextPrompt}
                    className="text-xs text-yellow-400 hover:text-yellow-300"
                  >
                    Try another prompt →
                  </button>
                </div>

                {/* Reframe */}
                <div className="mb-6">
                  <label className="block text-sm text-white/70 mb-2">Reframe (optional)</label>
                  <textarea
                    value={newEntry.reframe}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, reframe: e.target.value }))}
                    placeholder="A more balanced perspective..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 resize-none"
                    rows={2}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={resetForm}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEntry}
                    disabled={!newEntry.situation.trim()}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                      newEntry.situation.trim()
                        ? 'bg-pink-500 hover:bg-pink-600 text-white'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    Save Entry
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
