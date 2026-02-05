import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Timer,
  Plus,
  X,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle,
  Trash2,
  Edit2,
  Bell,
  Target,
  Flame,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const DEADLINES_KEY = 'nero_deadlines'

// Load deadlines
const loadDeadlines = () => {
  try {
    const stored = localStorage.getItem(DEADLINES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save deadlines
const saveDeadlines = (deadlines) => {
  localStorage.setItem(DEADLINES_KEY, JSON.stringify(deadlines))
}

// Calculate time remaining
const getTimeRemaining = (deadline) => {
  const now = new Date()
  const target = new Date(deadline)
  const diff = target - now

  if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0 }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return { expired: false, days, hours, minutes, total: diff }
}

// Get urgency level
const getUrgency = (deadline) => {
  const remaining = getTimeRemaining(deadline)
  if (remaining.expired) return 'expired'
  if (remaining.days === 0 && remaining.hours < 2) return 'critical'
  if (remaining.days === 0) return 'today'
  if (remaining.days === 1) return 'tomorrow'
  if (remaining.days <= 3) return 'soon'
  if (remaining.days <= 7) return 'thisWeek'
  return 'normal'
}

// Urgency colors
const URGENCY_COLORS = {
  expired: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
  critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', pulse: true },
  today: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  tomorrow: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  soon: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  thisWeek: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  normal: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
}

export default function DeadlineCountdown({ onDeadlineSelect }) {
  const prefersReducedMotion = useReducedMotion()
  const [deadlines, setDeadlines] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDeadline, setEditingDeadline] = useState(null)
  const [now, setNow] = useState(new Date())

  // Form state
  const [newDeadline, setNewDeadline] = useState({
    title: '',
    description: '',
    date: '',
    time: '23:59',
    priority: 'medium',
  })

  // Load data on mount
  useEffect(() => {
    setDeadlines(loadDeadlines())
  }, [])

  // Update "now" every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  // Sort deadlines by urgency
  const sortedDeadlines = useMemo(() => {
    return [...deadlines]
      .filter(d => !d.completed)
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`)
        const dateB = new Date(`${b.date}T${b.time}`)
        return dateA - dateB
      })
  }, [deadlines, now])

  const completedDeadlines = useMemo(() => {
    return deadlines.filter(d => d.completed)
  }, [deadlines])

  // Save deadline
  const saveDeadline = () => {
    if (!newDeadline.title.trim() || !newDeadline.date) return

    let updatedDeadlines
    if (editingDeadline) {
      updatedDeadlines = deadlines.map(d =>
        d.id === editingDeadline.id ? { ...d, ...newDeadline } : d
      )
    } else {
      const deadline = {
        ...newDeadline,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        completed: false,
      }
      updatedDeadlines = [...deadlines, deadline]
    }

    setDeadlines(updatedDeadlines)
    saveDeadlines(updatedDeadlines)
    resetForm()
  }

  // Complete deadline
  const completeDeadline = (deadlineId) => {
    const updatedDeadlines = deadlines.map(d =>
      d.id === deadlineId
        ? { ...d, completed: true, completedAt: new Date().toISOString() }
        : d
    )
    setDeadlines(updatedDeadlines)
    saveDeadlines(updatedDeadlines)
  }

  // Delete deadline
  const deleteDeadline = (deadlineId) => {
    const updatedDeadlines = deadlines.filter(d => d.id !== deadlineId)
    setDeadlines(updatedDeadlines)
    saveDeadlines(updatedDeadlines)
  }

  // Reset form
  const resetForm = () => {
    setNewDeadline({
      title: '',
      description: '',
      date: '',
      time: '23:59',
      priority: 'medium',
    })
    setEditingDeadline(null)
    setShowAddModal(false)
  }

  // Start editing
  const startEdit = (deadline) => {
    setEditingDeadline(deadline)
    setNewDeadline({
      title: deadline.title,
      description: deadline.description || '',
      date: deadline.date,
      time: deadline.time,
      priority: deadline.priority,
    })
    setShowAddModal(true)
  }

  // Format countdown
  const formatCountdown = (deadline) => {
    const remaining = getTimeRemaining(`${deadline.date}T${deadline.time}`)
    if (remaining.expired) return 'Expired'
    if (remaining.days > 0) return `${remaining.days}d ${remaining.hours}h`
    if (remaining.hours > 0) return `${remaining.hours}h ${remaining.minutes}m`
    return `${remaining.minutes}m`
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
            <h2 className="font-display text-xl font-semibold">Deadlines</h2>
            <p className="text-sm text-white/50">Visual countdown to due dates</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Urgent Alert */}
        {sortedDeadlines.some(d => ['critical', 'today'].includes(getUrgency(`${d.date}T${d.time}`))) && (
          <motion.div
            animate={!prefersReducedMotion ? { scale: [1, 1.01, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className="mb-4 p-4 rounded-2xl bg-red-500/20 border border-red-500/30"
          >
            <div className="flex items-center gap-3">
              <Flame className="w-5 h-5 text-red-400" />
              <div>
                <p className="font-medium text-red-400">Urgent Deadlines!</p>
                <p className="text-sm text-white/60">
                  {sortedDeadlines.filter(d => ['critical', 'today'].includes(getUrgency(`${d.date}T${d.time}`))).length} deadline(s) due today
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Deadlines List */}
        <div className="space-y-3">
          {sortedDeadlines.map((deadline) => {
            const urgency = getUrgency(`${deadline.date}T${deadline.time}`)
            const colors = URGENCY_COLORS[urgency]
            const remaining = getTimeRemaining(`${deadline.date}T${deadline.time}`)

            return (
              <motion.div
                key={deadline.id}
                {...getMotionProps(prefersReducedMotion, {
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 }
                })}
                className={`glass-card p-4 border ${colors.border} ${colors.pulse && !prefersReducedMotion ? 'animate-pulse' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                    <Timer className={`w-6 h-6 ${colors.text}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium">{deadline.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-white/50">
                            {new Date(`${deadline.date}T${deadline.time}`).toLocaleDateString('en', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => completeDeadline(deadline.id)}
                          className="p-1.5 rounded-lg hover:bg-green-500/20 transition-colors"
                          title="Mark complete"
                        >
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        </button>
                        <button
                          onClick={() => startEdit(deadline)}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-white/50" />
                        </button>
                        <button
                          onClick={() => deleteDeadline(deadline.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400/50" />
                        </button>
                      </div>
                    </div>

                    {deadline.description && (
                      <p className="text-sm text-white/50 mt-2">{deadline.description}</p>
                    )}

                    {/* Countdown display */}
                    <div className="mt-3 flex items-center gap-4">
                      <div className={`text-2xl font-bold ${colors.text}`}>
                        {formatCountdown(deadline)}
                      </div>

                      {/* Progress bar for time remaining */}
                      {!remaining.expired && (
                        <div className="flex-1">
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full ${colors.bg.replace('/20', '')}`}
                              initial={{ width: '100%' }}
                              animate={{
                                width: `${Math.max(0, Math.min(100, (remaining.total / (7 * 24 * 60 * 60 * 1000)) * 100))}%`
                              }}
                              transition={{ duration: 1 }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Urgency label */}
                    <div className="mt-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${colors.bg} ${colors.text}`}>
                        {urgency === 'critical' && <AlertTriangle className="w-3 h-3" />}
                        {urgency === 'critical' ? 'Critical!' :
                         urgency === 'today' ? 'Due Today' :
                         urgency === 'tomorrow' ? 'Due Tomorrow' :
                         urgency === 'soon' ? 'Due Soon' :
                         urgency === 'thisWeek' ? 'This Week' :
                         urgency === 'expired' ? 'Expired' : 'On Track'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Completed deadlines */}
        {completedDeadlines.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-white/50 mb-3">Completed</h3>
            <div className="space-y-2">
              {completedDeadlines.slice(0, 3).map((deadline) => (
                <div
                  key={deadline.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm line-through">{deadline.title}</span>
                  </div>
                  <button
                    onClick={() => deleteDeadline(deadline.id)}
                    className="p-1 hover:bg-red-500/20 rounded"
                  >
                    <Trash2 className="w-3 h-3 text-red-400/50" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {sortedDeadlines.length === 0 && completedDeadlines.length === 0 && (
          <div className="text-center py-12">
            <Timer className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">No deadlines yet</p>
            <p className="text-sm text-white/30 mt-1">
              Add deadlines to see visual countdowns
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 transition-colors"
            >
              Add Deadline
            </button>
          </div>
        )}

        {/* Tips */}
        <div className="mt-6 p-4 bg-white/5 rounded-xl">
          <p className="text-sm text-white/50">
            <strong className="text-white/70">ADHD tip:</strong> Time blindness makes deadlines feel abstract.
            Visual countdowns help make time concrete and actionable.
          </p>
        </div>

        {/* Add/Edit Modal */}
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
                className="relative w-full max-w-md glass-card p-5"
                {...getMotionProps(prefersReducedMotion, {
                  initial: { y: 100, opacity: 0 },
                  animate: { y: 0, opacity: 1 },
                  exit: { y: 100, opacity: 0 }
                })}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-semibold">
                    {editingDeadline ? 'Edit Deadline' : 'Add Deadline'}
                  </h3>
                  <button
                    onClick={resetForm}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Title */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">What's due? *</label>
                  <input
                    type="text"
                    value={newDeadline.title}
                    onChange={(e) => setNewDeadline(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Project proposal, Tax return"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                  />
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Date *</label>
                    <input
                      type="date"
                      value={newDeadline.date}
                      onChange={(e) => setNewDeadline(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Time</label>
                    <input
                      type="time"
                      value={newDeadline.time}
                      onChange={(e) => setNewDeadline(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/20"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Notes (optional)</label>
                  <textarea
                    value={newDeadline.description}
                    onChange={(e) => setNewDeadline(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Any details to remember..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 resize-none"
                    rows={2}
                  />
                </div>

                {/* Priority */}
                <div className="mb-6">
                  <label className="block text-sm text-white/70 mb-2">Priority</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'low', label: 'Low', color: 'green' },
                      { id: 'medium', label: 'Medium', color: 'yellow' },
                      { id: 'high', label: 'High', color: 'orange' },
                      { id: 'critical', label: 'Critical', color: 'red' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setNewDeadline(prev => ({ ...prev, priority: p.id }))}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                          newDeadline.priority === p.id
                            ? `bg-${p.color}-500/20 text-${p.color}-400 border border-${p.color}-500/30`
                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
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
                    onClick={saveDeadline}
                    disabled={!newDeadline.title.trim() || !newDeadline.date}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                      newDeadline.title.trim() && newDeadline.date
                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    {editingDeadline ? 'Save Changes' : 'Add Deadline'}
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
