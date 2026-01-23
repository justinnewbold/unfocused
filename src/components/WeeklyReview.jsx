import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  CheckCircle,
  Target,
  TrendingUp,
  TrendingDown,
  Award,
  Clock,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Edit3,
  Save,
  Flame,
  Brain,
  Heart,
  Lightbulb,
  Star,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage keys
const REVIEWS_KEY = 'nero_weekly_reviews'
const INTENTIONS_KEY = 'nero_weekly_intentions'

// Get stored reviews
const getReviews = () => {
  try {
    const stored = localStorage.getItem(REVIEWS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (e) {
    return []
  }
}

// Save review
const saveReview = (review) => {
  try {
    const reviews = getReviews()
    const existingIndex = reviews.findIndex(r => r.weekId === review.weekId)
    if (existingIndex >= 0) {
      reviews[existingIndex] = review
    } else {
      reviews.push(review)
    }
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews.slice(-52))) // Keep 1 year
  } catch (e) {
    console.error('Failed to save review:', e)
  }
}

// Get intentions
const getIntentions = () => {
  try {
    const stored = localStorage.getItem(INTENTIONS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (e) {
    return []
  }
}

// Save intentions
const saveIntentions = (intentions) => {
  try {
    localStorage.setItem(INTENTIONS_KEY, JSON.stringify(intentions))
  } catch (e) {
    console.error('Failed to save intentions:', e)
  }
}

// Get week ID (ISO week)
const getWeekId = (date = new Date()) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)
  const week1 = new Date(d.getFullYear(), 0, 4)
  const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
  return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`
}

// Get week date range
const getWeekRange = (weekId) => {
  const [year, week] = weekId.split('-W').map(Number)
  const jan4 = new Date(year, 0, 4)
  const start = new Date(jan4)
  start.setDate(jan4.getDate() - jan4.getDay() + 1 + (week - 1) * 7)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start, end }
}

// Format date range
const formatDateRange = (weekId) => {
  const { start, end } = getWeekRange(weekId)
  const options = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en', options)} - ${end.toLocaleDateString('en', options)}`
}

// Fetch stats from localStorage (matches InsightsDashboard structure)
const getWeekStats = () => {
  try {
    const stored = localStorage.getItem('nero_insights_stats')
    if (!stored) return null
    const stats = JSON.parse(stored)

    // Get this week's data
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())

    // Aggregate week data
    let tasksCompleted = 0
    let focusSessions = 0
    let breadcrumbsResolved = 0

    // Check each day of the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      const dateKey = date.toISOString().split('T')[0]

      if (stats[dateKey]) {
        tasksCompleted += stats[dateKey].tasksCompleted || 0
        focusSessions += stats[dateKey].focusSessions || 0
        breadcrumbsResolved += stats[dateKey].breadcrumbsResolved || 0
      }
    }

    return { tasksCompleted, focusSessions, breadcrumbsResolved }
  } catch (e) {
    return null
  }
}

// Get distraction patterns from localStorage
const getDistractionPatterns = () => {
  try {
    const stored = localStorage.getItem('nero_distraction_log')
    if (!stored) return null
    const log = JSON.parse(stored)

    // Get this week's distractions
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const weekDistractions = log.filter(d => new Date(d.timestamp) >= weekStart)

    // Count by type
    const typeCounts = {}
    weekDistractions.forEach(d => {
      typeCounts[d.type] = (typeCounts[d.type] || 0) + 1
    })

    // Find top distraction
    const sorted = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])
    return sorted[0] ? { type: sorted[0][0], count: sorted[0][1] } : null
  } catch (e) {
    return null
  }
}

// Get time estimation accuracy
const getTimeAccuracy = () => {
  try {
    const stored = localStorage.getItem('nero_time_estimates')
    if (!stored) return null
    const estimates = JSON.parse(stored)

    // Get this week's estimates
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const weekEstimates = estimates.filter(e => new Date(e.completedAt) >= weekStart)
    if (weekEstimates.length === 0) return null

    const avgAccuracy = Math.round(
      weekEstimates.reduce((sum, e) => sum + e.accuracy, 0) / weekEstimates.length
    )

    return { accuracy: avgAccuracy, count: weekEstimates.length }
  } catch (e) {
    return null
  }
}

// Review step component
function ReviewStep({ step, children, isActive, isComplete }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      {...getMotionProps(prefersReducedMotion, {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
      })}
      className={`rounded-2xl border transition-all ${
        isActive
          ? 'bg-white/10 border-nero-500/30'
          : isComplete
            ? 'bg-white/5 border-green-500/20'
            : 'bg-white/5 border-white/10 opacity-60'
      }`}
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isComplete ? 'bg-green-500' : isActive ? 'bg-nero-500' : 'bg-white/10'
          }`}>
            {isComplete ? (
              <CheckCircle className="w-4 h-4 text-white" />
            ) : (
              <span className="text-sm font-bold">{step}</span>
            )}
          </div>
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Main Component
export default function WeeklyReview({ onComplete }) {
  const prefersReducedMotion = useReducedMotion()
  const [currentStep, setCurrentStep] = useState(0)
  const [review, setReview] = useState({
    weekId: getWeekId(),
    wins: ['', '', ''],
    helped: '',
    blocked: '',
    intentions: ['', '', ''],
    gratitude: '',
    completedAt: null,
  })

  const weekStats = useMemo(() => getWeekStats(), [])
  const distractionPattern = useMemo(() => getDistractionPatterns(), [])
  const timeAccuracy = useMemo(() => getTimeAccuracy(), [])

  // Load existing review if any
  useEffect(() => {
    const reviews = getReviews()
    const existing = reviews.find(r => r.weekId === getWeekId())
    if (existing) {
      setReview(existing)
    }
  }, [])

  // Load previous intentions
  const previousIntentions = useMemo(() => {
    const intentions = getIntentions()
    return intentions.filter(i => i.weekId !== getWeekId())
  }, [])

  const handleUpdateWin = (index, value) => {
    setReview(prev => {
      const wins = [...prev.wins]
      wins[index] = value
      return { ...prev, wins }
    })
  }

  const handleUpdateIntention = (index, value) => {
    setReview(prev => {
      const intentions = [...prev.intentions]
      intentions[index] = value
      return { ...prev, intentions }
    })
  }

  const handleSave = () => {
    const completedReview = {
      ...review,
      completedAt: new Date().toISOString(),
    }
    saveReview(completedReview)

    // Save intentions for next week
    const newIntentions = review.intentions
      .filter(i => i.trim())
      .map(text => ({
        text,
        weekId: getWeekId(),
        createdAt: new Date().toISOString(),
      }))
    saveIntentions([...getIntentions(), ...newIntentions])

    onComplete?.(completedReview)
  }

  const steps = [
    { title: 'Celebrate Wins', icon: Award },
    { title: 'What Helped', icon: TrendingUp },
    { title: 'What Blocked', icon: AlertTriangle },
    { title: 'Set Intentions', icon: Target },
    { title: 'Gratitude', icon: Heart },
  ]

  const canProceed = () => {
    switch (currentStep) {
      case 0: return review.wins.some(w => w.trim())
      case 1: return review.helped.trim()
      case 2: return review.blocked.trim()
      case 3: return review.intentions.some(i => i.trim())
      case 4: return review.gratitude.trim()
      default: return true
    }
  }

  return (
    <div className="p-4 h-full overflow-auto">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-400 text-sm mb-3">
            <Calendar className="w-4 h-4" />
            <span>Weekly Review</span>
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Week in Review</h1>
          <p className="text-white/60">{formatDateRange(getWeekId())}</p>
        </div>

        {/* Week Stats Summary */}
        {weekStats && (
          <motion.div
            {...getMotionProps(prefersReducedMotion, {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
            })}
            className="bg-gradient-to-r from-nero-500/20 to-purple-500/20 rounded-2xl p-4 border border-nero-500/20"
          >
            <h3 className="text-sm font-medium text-white/70 mb-3">This Week's Highlights</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-nero-400">{weekStats.tasksCompleted}</div>
                <div className="text-xs text-white/50">Tasks Done</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{weekStats.focusSessions}</div>
                <div className="text-xs text-white/50">Focus Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-calm-400">{weekStats.breadcrumbsResolved}</div>
                <div className="text-xs text-white/50">Trails Resolved</div>
              </div>
            </div>

            {/* Insights row */}
            <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
              {distractionPattern && (
                <div className="flex-1 flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span className="text-xs">
                    Top distraction: <span className="text-white">{distractionPattern.type}</span>
                  </span>
                </div>
              )}
              {timeAccuracy && (
                <div className="flex-1 flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                  <Clock className="w-4 h-4 text-calm-400" />
                  <span className="text-xs">
                    Time accuracy: <span className="text-white">{timeAccuracy.accuracy}%</span>
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Progress */}
        <div className="flex gap-2">
          {steps.map((step, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`flex-1 h-2 rounded-full transition-colors ${
                i < currentStep ? 'bg-green-500' :
                i === currentStep ? 'bg-nero-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Current Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="wins"
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0, x: 20 },
                animate: { opacity: 1, x: 0 },
                exit: { opacity: 0, x: -20 },
              })}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold">Celebrate Your Wins</h2>
                  <p className="text-sm text-white/60">What went well this week? (Big or small!)</p>
                </div>
              </div>

              <div className="space-y-3">
                {review.wins.map((win, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-amber-400/50" />
                    <input
                      type="text"
                      value={win}
                      onChange={(e) => handleUpdateWin(i, e.target.value)}
                      placeholder={`Win #${i + 1}...`}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-nero-500/50"
                    />
                  </div>
                ))}
              </div>

              {/* Auto-populate suggestion */}
              {weekStats && weekStats.tasksCompleted > 0 && (
                <div className="p-3 bg-white/5 rounded-xl">
                  <p className="text-sm text-white/60">
                    <Sparkles className="w-4 h-4 inline mr-1 text-nero-400" />
                    Suggestion: You completed {weekStats.tasksCompleted} tasks and {weekStats.focusSessions} focus sessions!
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              key="helped"
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0, x: 20 },
                animate: { opacity: 1, x: 0 },
                exit: { opacity: 0, x: -20 },
              })}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold">What Helped You?</h2>
                  <p className="text-sm text-white/60">Strategies, tools, or conditions that worked</p>
                </div>
              </div>

              <textarea
                value={review.helped}
                onChange={(e) => setReview(prev => ({ ...prev, helped: e.target.value }))}
                placeholder="What helped you stay focused or get things done? (e.g., 'Working in 25-min blocks', 'Morning focus time', 'Body doubling')"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-nero-500/50 resize-none"
                rows={4}
              />

              <div className="flex flex-wrap gap-2">
                {['Body doubling', 'Timers', 'Music', 'Morning routine', 'Breaks'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setReview(prev => ({
                      ...prev,
                      helped: prev.helped ? `${prev.helped}, ${tag}` : tag
                    }))}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="blocked"
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0, x: 20 },
                animate: { opacity: 1, x: 0 },
                exit: { opacity: 0, x: -20 },
              })}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold">What Got in the Way?</h2>
                  <p className="text-sm text-white/60">Challenges or obstacles you faced</p>
                </div>
              </div>

              <textarea
                value={review.blocked}
                onChange={(e) => setReview(prev => ({ ...prev, blocked: e.target.value }))}
                placeholder="What made things harder? (e.g., 'Phone notifications', 'Late nights', 'Unclear priorities')"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-nero-500/50 resize-none"
                rows={4}
              />

              {distractionPattern && (
                <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                  <p className="text-sm">
                    <AlertTriangle className="w-4 h-4 inline mr-1 text-orange-400" />
                    Your data shows <span className="font-medium">{distractionPattern.type}</span> was your top distraction ({distractionPattern.count}x)
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="intentions"
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0, x: 20 },
                animate: { opacity: 1, x: 0 },
                exit: { opacity: 0, x: -20 },
              })}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-nero-500/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-nero-400" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold">Set Intentions</h2>
                  <p className="text-sm text-white/60">1-3 focus areas for next week</p>
                </div>
              </div>

              <div className="space-y-3">
                {review.intentions.map((intention, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Lightbulb className="w-5 h-5 text-nero-400/50" />
                    <input
                      type="text"
                      value={intention}
                      onChange={(e) => handleUpdateIntention(i, e.target.value)}
                      placeholder={`Intention #${i + 1}...`}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-nero-500/50"
                    />
                  </div>
                ))}
              </div>

              <div className="p-3 bg-white/5 rounded-xl">
                <p className="text-sm text-white/60">
                  <Brain className="w-4 h-4 inline mr-1 text-calm-400" />
                  Tip: Keep intentions specific and achievable. "Do 3 focus sessions" beats "be more productive"
                </p>
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="gratitude"
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0, x: 20 },
                animate: { opacity: 1, x: 0 },
                exit: { opacity: 0, x: -20 },
              })}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold">Gratitude Moment</h2>
                  <p className="text-sm text-white/60">What are you grateful for this week?</p>
                </div>
              </div>

              <textarea
                value={review.gratitude}
                onChange={(e) => setReview(prev => ({ ...prev, gratitude: e.target.value }))}
                placeholder="One thing you're grateful for..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-nero-500/50 resize-none"
                rows={3}
              />

              <div className="p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-xl border border-pink-500/20">
                <p className="text-sm text-white/70">
                  Ending with gratitude rewires your brain for positivity. Even small things count!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(s => s - 1)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
          )}

          <button
            onClick={() => {
              if (currentStep < steps.length - 1) {
                setCurrentStep(s => s + 1)
              } else {
                handleSave()
              }
            }}
            disabled={!canProceed()}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors ${
              canProceed()
                ? 'bg-nero-500 hover:bg-nero-600'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            {currentStep < steps.length - 1 ? (
              <>
                Continue
                <ChevronRight className="w-5 h-5" />
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Complete Review
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
