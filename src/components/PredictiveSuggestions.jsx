import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Brain,
  Clock,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Coffee,
  Moon,
  Sun,
  Activity,
  Target,
  ChevronRight,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage keys
const SUGGESTIONS_KEY = 'nero_predictive_suggestions'
const FEEDBACK_KEY = 'nero_suggestion_feedback'

// Suggestion categories
const SUGGESTION_TYPES = {
  OPTIMAL_TIME: 'optimal_time',
  ENERGY_BOOST: 'energy_boost',
  FOCUS_PREP: 'focus_prep',
  BREAK_REMINDER: 'break_reminder',
  TASK_TIMING: 'task_timing',
  WELLNESS: 'wellness',
}

// Generate suggestions based on patterns (simulated AI)
const generateSuggestions = (userData) => {
  const now = new Date()
  const hour = now.getHours()
  const dayOfWeek = now.getDay()
  const suggestions = []

  // Optimal time suggestion
  if (hour >= 8 && hour <= 10) {
    suggestions.push({
      id: `optimal-${Date.now()}-1`,
      type: SUGGESTION_TYPES.OPTIMAL_TIME,
      title: 'Peak Performance Window',
      message: 'Based on your patterns, the next 2 hours are your most productive. Consider tackling your hardest task now.',
      icon: 'Zap',
      priority: 'high',
      color: 'yellow',
      confidence: 0.85,
      action: { label: 'Start Focus Session', type: 'focus' },
    })
  } else if (hour >= 14 && hour <= 15) {
    suggestions.push({
      id: `dip-${Date.now()}-1`,
      type: SUGGESTION_TYPES.ENERGY_BOOST,
      title: 'Afternoon Dip Alert',
      message: 'Your focus typically drops around this time. A quick walk or stretch might help.',
      icon: 'AlertTriangle',
      priority: 'medium',
      color: 'orange',
      confidence: 0.78,
      action: { label: 'Take a Break', type: 'break' },
    })
  }

  // Day-specific suggestions
  if (dayOfWeek === 1) { // Monday
    suggestions.push({
      id: `monday-${Date.now()}`,
      type: SUGGESTION_TYPES.TASK_TIMING,
      title: 'Monday Strategy',
      message: 'Mondays tend to be high-energy for you. Great day for planning and starting new projects.',
      icon: 'Target',
      priority: 'medium',
      color: 'blue',
      confidence: 0.72,
    })
  } else if (dayOfWeek === 5) { // Friday
    suggestions.push({
      id: `friday-${Date.now()}`,
      type: SUGGESTION_TYPES.TASK_TIMING,
      title: 'Friday Wind-Down',
      message: 'Your data shows Friday focus drops by afternoon. Front-load important tasks today.',
      icon: 'Clock',
      priority: 'medium',
      color: 'purple',
      confidence: 0.68,
    })
  }

  // Morning suggestions
  if (hour >= 7 && hour <= 9) {
    suggestions.push({
      id: `morning-${Date.now()}`,
      type: SUGGESTION_TYPES.FOCUS_PREP,
      title: 'Morning Setup',
      message: 'Based on successful days, try: hydrate, quick stretch, then 25-min focus sprint.',
      icon: 'Sun',
      priority: 'high',
      color: 'amber',
      confidence: 0.81,
      action: { label: 'Start Routine', type: 'routine' },
    })
  }

  // Evening suggestions
  if (hour >= 20) {
    suggestions.push({
      id: `evening-${Date.now()}`,
      type: SUGGESTION_TYPES.WELLNESS,
      title: 'Wind Down Time',
      message: 'Your best days follow good sleep. Consider starting your wind-down routine.',
      icon: 'Moon',
      priority: 'medium',
      color: 'indigo',
      confidence: 0.75,
    })
  }

  // Random wellness suggestions
  const wellnessSuggestions = [
    {
      id: `hydrate-${Date.now()}`,
      type: SUGGESTION_TYPES.WELLNESS,
      title: 'Hydration Check',
      message: 'Dehydration affects focus. Have you had water recently?',
      icon: 'Activity',
      priority: 'low',
      color: 'cyan',
      confidence: 0.65,
    },
    {
      id: `movement-${Date.now()}`,
      type: SUGGESTION_TYPES.WELLNESS,
      title: 'Movement Reminder',
      message: 'A 5-minute walk can reset your focus. Your brain will thank you.',
      icon: 'Activity',
      priority: 'low',
      color: 'green',
      confidence: 0.62,
    },
  ]

  // Add one random wellness suggestion
  if (Math.random() > 0.5 && suggestions.length < 4) {
    suggestions.push(wellnessSuggestions[Math.floor(Math.random() * wellnessSuggestions.length)])
  }

  // Predictive task suggestion
  suggestions.push({
    id: `predict-${Date.now()}`,
    type: SUGGESTION_TYPES.TASK_TIMING,
    title: 'Smart Task Match',
    message: 'Your current energy level is optimal for creative or complex tasks.',
    icon: 'Brain',
    priority: 'medium',
    color: 'purple',
    confidence: 0.70,
  })

  return suggestions.slice(0, 4) // Limit to 4 suggestions
}

// Get icon component
const getIcon = (iconName) => {
  const icons = { Sparkles, Brain, Clock, Zap, TrendingUp, AlertTriangle, Coffee, Moon, Sun, Activity, Target, Lightbulb }
  return icons[iconName] || Sparkles
}

export default function PredictiveSuggestions({ onStartFocus, onTakeBreak }) {
  const prefersReducedMotion = useReducedMotion()
  const [suggestions, setSuggestions] = useState([])
  const [feedback, setFeedback] = useState({})
  const [dismissedIds, setDismissedIds] = useState(new Set())
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load data on mount
  useEffect(() => {
    const stored = localStorage.getItem(FEEDBACK_KEY)
    if (stored) {
      try {
        setFeedback(JSON.parse(stored))
      } catch {}
    }
    refreshSuggestions()
  }, [])

  // Refresh suggestions
  const refreshSuggestions = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setSuggestions(generateSuggestions({}))
      setDismissedIds(new Set())
      setIsRefreshing(false)
    }, 500)
  }

  // Dismiss suggestion
  const dismissSuggestion = (id) => {
    setDismissedIds(prev => new Set([...prev, id]))
  }

  // Submit feedback
  const submitFeedback = (suggestionId, isHelpful) => {
    const updated = {
      ...feedback,
      [suggestionId]: { helpful: isHelpful, timestamp: Date.now() }
    }
    setFeedback(updated)
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(updated))

    // Auto-dismiss after feedback
    setTimeout(() => dismissSuggestion(suggestionId), 1000)
  }

  // Handle action
  const handleAction = (suggestion) => {
    if (suggestion.action?.type === 'focus') {
      onStartFocus?.()
    } else if (suggestion.action?.type === 'break') {
      onTakeBreak?.()
    }
    dismissSuggestion(suggestion.id)
  }

  // Filter visible suggestions
  const visibleSuggestions = suggestions.filter(s => !dismissedIds.has(s.id))

  // Priority order
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const sortedSuggestions = [...visibleSuggestions].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  )

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
              <Sparkles className="w-6 h-6 text-purple-400" />
              Smart Suggestions
            </h2>
            <p className="text-sm text-white/50">Personalized recommendations</p>
          </div>
          <button
            onClick={refreshSuggestions}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* AI Notice */}
        <div className="mb-6 p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
          <div className="flex items-start gap-2">
            <Brain className="w-4 h-4 text-purple-400 mt-0.5" />
            <p className="text-xs text-white/60">
              Suggestions are based on your usage patterns and common ADHD-friendly strategies.
              Your feedback helps improve recommendations.
            </p>
          </div>
        </div>

        {/* Suggestions */}
        {sortedSuggestions.length > 0 ? (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {sortedSuggestions.map((suggestion, index) => {
                const Icon = getIcon(suggestion.icon)
                const hasFeedback = feedback[suggestion.id]

                return (
                  <motion.div
                    key={suggestion.id}
                    layout
                    {...getMotionProps(prefersReducedMotion, {
                      initial: { opacity: 0, x: -20 },
                      animate: { opacity: 1, x: 0 },
                      exit: { opacity: 0, x: 20 },
                      transition: { delay: index * 0.1 }
                    })}
                    className={`glass-card p-4 border-l-4 ${
                      suggestion.priority === 'high' ? `border-${suggestion.color}-500` :
                      suggestion.priority === 'medium' ? `border-${suggestion.color}-400/70` :
                      `border-${suggestion.color}-400/40`
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-${suggestion.color}-500/20 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 text-${suggestion.color}-400`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{suggestion.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full bg-${suggestion.color}-500/20 text-${suggestion.color}-400`}>
                              {Math.round(suggestion.confidence * 100)}% confidence
                            </span>
                          </div>
                          <button
                            onClick={() => dismissSuggestion(suggestion.id)}
                            className="text-white/30 hover:text-white/50 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-sm text-white/70 mt-2">{suggestion.message}</p>

                        {/* Action button */}
                        {suggestion.action && (
                          <button
                            onClick={() => handleAction(suggestion)}
                            className={`mt-3 px-4 py-2 rounded-xl bg-${suggestion.color}-500/20 hover:bg-${suggestion.color}-500/30 text-${suggestion.color}-400 text-sm transition-colors flex items-center gap-2`}
                          >
                            {suggestion.action.label}
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}

                        {/* Feedback buttons */}
                        {!hasFeedback && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                            <span className="text-xs text-white/40">Helpful?</span>
                            <button
                              onClick={() => submitFeedback(suggestion.id, true)}
                              className="p-1.5 rounded-lg hover:bg-green-500/20 text-white/40 hover:text-green-400 transition-colors"
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => submitFeedback(suggestion.id, false)}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                            >
                              <ThumbsDown className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {hasFeedback && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-xs text-green-400">Thanks for your feedback!</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="glass-card p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-400/50 mx-auto mb-3" />
            <h3 className="font-medium mb-2">All Caught Up!</h3>
            <p className="text-sm text-white/50 mb-4">
              No new suggestions right now. Check back later or refresh.
            </p>
            <button
              onClick={refreshSuggestions}
              className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-colors"
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Refresh
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={onStartFocus}
            className="p-4 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 transition-colors text-left"
          >
            <Zap className="w-5 h-5 text-yellow-400 mb-2" />
            <p className="font-medium text-sm">Start Focus</p>
            <p className="text-xs text-white/50">Begin a session</p>
          </button>
          <button
            onClick={onTakeBreak}
            className="p-4 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 transition-colors text-left"
          >
            <Coffee className="w-5 h-5 text-green-400 mb-2" />
            <p className="font-medium text-sm">Take Break</p>
            <p className="text-xs text-white/50">Rest your brain</p>
          </button>
        </div>

        {/* How It Works */}
        <div className="mt-6 p-4 bg-white/5 rounded-xl">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            How Predictions Work
          </h3>
          <ul className="text-xs text-white/60 space-y-1">
            <li>• Analyzes your past focus patterns</li>
            <li>• Considers time of day and day of week</li>
            <li>• Learns from your feedback over time</li>
            <li>• Combines with proven ADHD strategies</li>
          </ul>
        </div>
      </motion.div>
    </div>
  )
}
