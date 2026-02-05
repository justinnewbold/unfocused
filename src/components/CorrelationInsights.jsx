import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  Moon,
  Coffee,
  Sun,
  Zap,
  Activity,
  BarChart3,
  ArrowRight,
  Lightbulb,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  Calendar,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const INSIGHTS_KEY = 'nero_correlation_insights'
const ACTIVITY_LOG_KEY = 'nero_activity_log'

// Simulated historical data (in production, this would come from actual tracked data)
const generateSampleData = () => {
  const days = 30
  const data = []

  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)

    // Generate correlated data
    const sleepHours = 5 + Math.random() * 4 // 5-9 hours
    const sleepQuality = sleepHours > 7 ? 0.7 + Math.random() * 0.3 : 0.3 + Math.random() * 0.4
    const focusScore = sleepQuality * 0.6 + Math.random() * 0.4
    const tasksCompleted = Math.floor(focusScore * 10 + Math.random() * 3)
    const mood = sleepQuality * 0.5 + focusScore * 0.3 + Math.random() * 0.2
    const caffeine = Math.floor(Math.random() * 4) // 0-3 cups
    const exercise = Math.random() > 0.6 // did exercise?

    data.push({
      date: date.toISOString().split('T')[0],
      sleepHours,
      sleepQuality,
      focusScore,
      tasksCompleted,
      mood,
      caffeine,
      exercise,
      dayOfWeek: date.getDay(),
      timeOfDay: {
        morning: focusScore + Math.random() * 0.2,
        afternoon: focusScore - 0.1 + Math.random() * 0.2,
        evening: focusScore - 0.2 + Math.random() * 0.2,
      }
    })
  }

  return data.reverse()
}

// Calculate correlation coefficient
const calculateCorrelation = (x, y) => {
  const n = x.length
  if (n === 0) return 0

  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0)
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0)
  const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0)

  const num = n * sumXY - sumX * sumY
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  return den === 0 ? 0 : num / den
}

export default function CorrelationInsights() {
  const prefersReducedMotion = useReducedMotion()
  const [data, setData] = useState([])
  const [activeInsight, setActiveInsight] = useState(0)

  // Load/generate data on mount
  useEffect(() => {
    const stored = localStorage.getItem(ACTIVITY_LOG_KEY)
    if (stored) {
      try {
        setData(JSON.parse(stored))
      } catch {
        const sampleData = generateSampleData()
        setData(sampleData)
        localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(sampleData))
      }
    } else {
      const sampleData = generateSampleData()
      setData(sampleData)
      localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(sampleData))
    }
  }, [])

  // Calculate insights
  const insights = useMemo(() => {
    if (data.length < 7) return []

    const sleepHours = data.map(d => d.sleepHours)
    const focusScores = data.map(d => d.focusScore)
    const tasksCompleted = data.map(d => d.tasksCompleted)
    const moods = data.map(d => d.mood)
    const caffeine = data.map(d => d.caffeine)
    const exercise = data.map(d => d.exercise ? 1 : 0)

    const results = []

    // Sleep vs Focus correlation
    const sleepFocusCorr = calculateCorrelation(sleepHours, focusScores)
    results.push({
      id: 'sleep-focus',
      title: 'Sleep & Focus Connection',
      factor1: { name: 'Sleep', icon: Moon, color: 'blue' },
      factor2: { name: 'Focus', icon: Zap, color: 'yellow' },
      correlation: sleepFocusCorr,
      insight: sleepFocusCorr > 0.3
        ? `Your focus is ${Math.round(sleepFocusCorr * 100)}% correlated with sleep. Better sleep = better focus for you!`
        : 'Sleep doesn\'t strongly affect your focus. Lucky you!',
      recommendation: sleepFocusCorr > 0.3
        ? 'Prioritize 7-8 hours of sleep before important focus days'
        : 'Your focus is resilient to sleep variations',
    })

    // Sleep vs Mood
    const sleepMoodCorr = calculateCorrelation(sleepHours, moods)
    results.push({
      id: 'sleep-mood',
      title: 'Sleep & Mood Pattern',
      factor1: { name: 'Sleep', icon: Moon, color: 'blue' },
      factor2: { name: 'Mood', icon: Sun, color: 'orange' },
      correlation: sleepMoodCorr,
      insight: sleepMoodCorr > 0.3
        ? `Your mood improves ${Math.round(sleepMoodCorr * 100)}% when you sleep better`
        : 'Your mood is fairly independent of sleep',
      recommendation: sleepMoodCorr > 0.3
        ? 'Bad mood days? Check if you\'ve been sleeping enough'
        : 'Look for other mood triggers in your data',
    })

    // Exercise vs Focus
    const exerciseFocusCorr = calculateCorrelation(exercise, focusScores)
    results.push({
      id: 'exercise-focus',
      title: 'Exercise & Focus Link',
      factor1: { name: 'Exercise', icon: Activity, color: 'green' },
      factor2: { name: 'Focus', icon: Zap, color: 'yellow' },
      correlation: exerciseFocusCorr,
      insight: exerciseFocusCorr > 0.2
        ? `Days you exercise, your focus is ${Math.round(exerciseFocusCorr * 100)}% better`
        : 'Exercise doesn\'t strongly impact your focus scores',
      recommendation: exerciseFocusCorr > 0.2
        ? 'Consider a quick workout before important focus sessions'
        : 'Your focus is stable regardless of exercise',
    })

    // Caffeine analysis
    const caffeineFocusCorr = calculateCorrelation(caffeine, focusScores)
    results.push({
      id: 'caffeine-focus',
      title: 'Caffeine Effect',
      factor1: { name: 'Caffeine', icon: Coffee, color: 'amber' },
      factor2: { name: 'Focus', icon: Zap, color: 'yellow' },
      correlation: caffeineFocusCorr,
      insight: caffeineFocusCorr > 0.2
        ? `More caffeine correlates with ${Math.round(Math.abs(caffeineFocusCorr) * 100)}% ${caffeineFocusCorr > 0 ? 'better' : 'worse'} focus`
        : 'Caffeine doesn\'t strongly affect your focus patterns',
      recommendation: caffeineFocusCorr < -0.1
        ? 'Consider reducing caffeine - it may be hurting focus'
        : caffeineFocusCorr > 0.2 ? 'Moderate caffeine seems to help you' : 'Caffeine is neutral for your focus',
    })

    // Time of day analysis
    const morningAvg = data.reduce((acc, d) => acc + d.timeOfDay.morning, 0) / data.length
    const afternoonAvg = data.reduce((acc, d) => acc + d.timeOfDay.afternoon, 0) / data.length
    const eveningAvg = data.reduce((acc, d) => acc + d.timeOfDay.evening, 0) / data.length

    const bestTime = morningAvg > afternoonAvg && morningAvg > eveningAvg ? 'morning' :
                     afternoonAvg > eveningAvg ? 'afternoon' : 'evening'

    results.push({
      id: 'time-of-day',
      title: 'Peak Performance Time',
      factor1: { name: 'Time', icon: Clock, color: 'purple' },
      factor2: { name: 'Performance', icon: Target, color: 'green' },
      correlation: 0.5, // Placeholder for visualization
      insight: `Your focus peaks in the ${bestTime} (${Math.round((bestTime === 'morning' ? morningAvg : bestTime === 'afternoon' ? afternoonAvg : eveningAvg) * 100)}% efficiency)`,
      recommendation: `Schedule your hardest tasks for the ${bestTime}`,
      customData: { morningAvg, afternoonAvg, eveningAvg, bestTime },
    })

    // Day of week analysis
    const dayScores = [0, 1, 2, 3, 4, 5, 6].map(day => {
      const dayData = data.filter(d => d.dayOfWeek === day)
      return dayData.reduce((acc, d) => acc + d.focusScore, 0) / (dayData.length || 1)
    })
    const bestDay = dayScores.indexOf(Math.max(...dayScores))
    const worstDay = dayScores.indexOf(Math.min(...dayScores))
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    results.push({
      id: 'day-of-week',
      title: 'Weekly Pattern',
      factor1: { name: 'Day', icon: Calendar, color: 'cyan' },
      factor2: { name: 'Focus', icon: Zap, color: 'yellow' },
      correlation: 0.4,
      insight: `${dayNames[bestDay]}s are your best days. ${dayNames[worstDay]}s tend to be harder.`,
      recommendation: `Plan challenging work for ${dayNames[bestDay]}s, lighter tasks for ${dayNames[worstDay]}s`,
      customData: { dayScores, bestDay, worstDay, dayNames },
    })

    return results
  }, [data])

  // Get correlation indicator
  const getCorrelationIndicator = (corr) => {
    if (corr > 0.3) return { icon: TrendingUp, color: 'text-green-400', label: 'Strong positive' }
    if (corr > 0.1) return { icon: TrendingUp, color: 'text-green-400/60', label: 'Weak positive' }
    if (corr < -0.3) return { icon: TrendingDown, color: 'text-red-400', label: 'Strong negative' }
    if (corr < -0.1) return { icon: TrendingDown, color: 'text-red-400/60', label: 'Weak negative' }
    return { icon: Minus, color: 'text-white/50', label: 'No correlation' }
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
              <Brain className="w-6 h-6 text-purple-400" />
              Pattern Insights
            </h2>
            <p className="text-sm text-white/50">Discover what affects your focus</p>
          </div>
        </div>

        {/* Data Summary */}
        <div className="glass-card p-4 mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-sm font-medium">Analyzing {data.length} days of data</p>
              <p className="text-xs text-white/50">Patterns update as you use Nero</p>
            </div>
          </div>
        </div>

        {/* Insights */}
        {insights.length > 0 ? (
          <div className="space-y-4">
            {insights.map((insight, index) => {
              const indicator = getCorrelationIndicator(insight.correlation)
              const Factor1Icon = insight.factor1.icon
              const Factor2Icon = insight.factor2.icon
              const IndicatorIcon = indicator.icon

              return (
                <motion.div
                  key={insight.id}
                  {...getMotionProps(prefersReducedMotion, {
                    initial: { opacity: 0, y: 10 },
                    animate: { opacity: 1, y: 0 },
                    transition: { delay: index * 0.1 }
                  })}
                  className="glass-card p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{insight.title}</h3>
                    <div className={`flex items-center gap-1 ${indicator.color}`}>
                      <IndicatorIcon className="w-4 h-4" />
                      <span className="text-xs">{indicator.label}</span>
                    </div>
                  </div>

                  {/* Factor visualization */}
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-xl bg-${insight.factor1.color}-500/20 flex items-center justify-center`}>
                        <Factor1Icon className={`w-6 h-6 text-${insight.factor1.color}-400`} />
                      </div>
                      <span className="text-xs text-white/50 mt-1">{insight.factor1.name}</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/30" />
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-xl bg-${insight.factor2.color}-500/20 flex items-center justify-center`}>
                        <Factor2Icon className={`w-6 h-6 text-${insight.factor2.color}-400`} />
                      </div>
                      <span className="text-xs text-white/50 mt-1">{insight.factor2.name}</span>
                    </div>
                  </div>

                  {/* Correlation bar */}
                  <div className="mb-3">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden relative">
                      <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/30" />
                      <motion.div
                        className={`absolute inset-y-0 ${
                          insight.correlation >= 0 ? 'left-1/2' : 'right-1/2'
                        } ${
                          insight.correlation >= 0 ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.abs(insight.correlation) * 50}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-white/40 mt-1">
                      <span>-1</span>
                      <span>0</span>
                      <span>+1</span>
                    </div>
                  </div>

                  {/* Insight text */}
                  <div className="p-3 bg-white/5 rounded-lg mb-3">
                    <p className="text-sm">{insight.insight}</p>
                  </div>

                  {/* Recommendation */}
                  <div className="flex items-start gap-2 text-sm">
                    <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5" />
                    <p className="text-white/70">{insight.recommendation}</p>
                  </div>

                  {/* Custom visualizations for specific insights */}
                  {insight.id === 'time-of-day' && insight.customData && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs text-white/50 mb-2">Focus by Time of Day</p>
                      <div className="flex gap-2">
                        {['morning', 'afternoon', 'evening'].map((time) => (
                          <div key={time} className="flex-1">
                            <div className="h-16 bg-white/5 rounded-lg relative overflow-hidden">
                              <motion.div
                                className={`absolute bottom-0 left-0 right-0 ${
                                  time === insight.customData.bestTime ? 'bg-green-500/30' : 'bg-white/10'
                                }`}
                                initial={{ height: 0 }}
                                animate={{ height: `${insight.customData[`${time}Avg`] * 100}%` }}
                              />
                            </div>
                            <p className="text-xs text-center mt-1 text-white/50 capitalize">{time}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {insight.id === 'day-of-week' && insight.customData && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs text-white/50 mb-2">Focus by Day</p>
                      <div className="flex gap-1">
                        {insight.customData.dayScores.map((score, day) => (
                          <div key={day} className="flex-1">
                            <div className="h-12 bg-white/5 rounded relative overflow-hidden">
                              <motion.div
                                className={`absolute bottom-0 left-0 right-0 ${
                                  day === insight.customData.bestDay ? 'bg-green-500/30' :
                                  day === insight.customData.worstDay ? 'bg-red-500/20' : 'bg-white/10'
                                }`}
                                initial={{ height: 0 }}
                                animate={{ height: `${score * 100}%` }}
                              />
                            </div>
                            <p className="text-xs text-center mt-1 text-white/40">
                              {['S', 'M', 'T', 'W', 'T', 'F', 'S'][day]}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="glass-card p-8 text-center">
            <AlertCircle className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <h3 className="font-medium mb-2">Not Enough Data Yet</h3>
            <p className="text-sm text-white/50">
              Keep using Nero for at least a week to see personalized insights
            </p>
          </div>
        )}

        {/* How It Works */}
        <div className="mt-6 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            How Correlations Work
          </h3>
          <p className="text-xs text-white/60">
            Nero analyzes patterns in your data to find what actually affects your focus and
            productivity. Correlations show how strongly two things are connected. A correlation
            of 1 means perfect connection, -1 means opposite effects, and 0 means no relationship.
          </p>
        </div>

        {/* Privacy Note */}
        <div className="mt-4 p-3 bg-white/5 rounded-xl">
          <p className="text-xs text-white/50 text-center">
            All analysis happens locally on your device. Your data stays private.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
