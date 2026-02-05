import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  History,
  Clock,
  ArrowRight,
  RotateCcw,
  Lightbulb,
  Target,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Trash2,
  Pin,
  PinOff,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const MEMORY_KEY = 'nero_working_memory'
const CONTEXT_KEY = 'nero_current_context'

// Action types we track
const ACTION_TYPES = {
  TASK_START: 'task_start',
  TASK_COMPLETE: 'task_complete',
  TIMER_START: 'timer_start',
  TIMER_STOP: 'timer_stop',
  VIEW_CHANGE: 'view_change',
  NOTE_ADDED: 'note_added',
  CAPTURE: 'capture',
  DISTRACTION: 'distraction',
}

// Load memory
const loadMemory = () => {
  try {
    const stored = localStorage.getItem(MEMORY_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save memory
const saveMemory = (memory) => {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memory.slice(-50)))
}

// Load context
const loadContext = () => {
  try {
    const stored = localStorage.getItem(CONTEXT_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

// Save context
const saveContext = (context) => {
  localStorage.setItem(CONTEXT_KEY, JSON.stringify(context))
}

export default function WorkingMemoryAid({ currentTask, currentView, onRestoreContext }) {
  const prefersReducedMotion = useReducedMotion()
  const [actions, setActions] = useState([])
  const [savedContext, setSavedContext] = useState(null)
  const [pinnedItems, setPinnedItems] = useState([])
  const [showPinned, setShowPinned] = useState(true)
  const [whatWasIDoing, setWhatWasIDoing] = useState(null)

  // Load data on mount
  useEffect(() => {
    setActions(loadMemory())
    setSavedContext(loadContext())
  }, [])

  // Track current task changes
  useEffect(() => {
    if (currentTask) {
      recordAction(ACTION_TYPES.TASK_START, {
        taskId: currentTask.id,
        taskTitle: currentTask.title,
      })
    }
  }, [currentTask?.id])

  // Track view changes
  useEffect(() => {
    if (currentView) {
      recordAction(ACTION_TYPES.VIEW_CHANGE, { view: currentView })
    }
  }, [currentView])

  // Record an action
  const recordAction = (type, data) => {
    const action = {
      id: Date.now().toString(),
      type,
      data,
      timestamp: new Date().toISOString(),
    }

    setActions(prev => {
      const updated = [action, ...prev].slice(0, 50)
      saveMemory(updated)
      return updated
    })
  }

  // Get recent actions (last 5)
  const recentActions = actions.slice(0, 5)

  // "What was I doing?" - analyze recent context
  const analyzeContext = () => {
    const recent = actions.slice(0, 10)

    // Find the most recent task
    const lastTask = recent.find(a => a.type === ACTION_TYPES.TASK_START)

    // Find if there was a timer running
    const lastTimerStart = recent.find(a => a.type === ACTION_TYPES.TIMER_START)
    const lastTimerStop = recent.find(a => a.type === ACTION_TYPES.TIMER_STOP)
    const timerWasRunning = lastTimerStart &&
      (!lastTimerStop || new Date(lastTimerStart.timestamp) > new Date(lastTimerStop.timestamp))

    // Find the last view
    const lastView = recent.find(a => a.type === ACTION_TYPES.VIEW_CHANGE)

    // Build context summary
    const context = {
      task: lastTask?.data?.taskTitle || null,
      timerRunning: timerWasRunning,
      lastView: lastView?.data?.view || null,
      lastActivity: recent[0]?.timestamp || null,
      timeSinceLastActivity: recent[0]
        ? Math.round((Date.now() - new Date(recent[0].timestamp).getTime()) / 1000 / 60)
        : null,
    }

    setWhatWasIDoing(context)

    // Auto-dismiss after 10 seconds
    setTimeout(() => setWhatWasIDoing(null), 10000)
  }

  // Save current context
  const saveCurrentContext = () => {
    const context = {
      task: currentTask,
      view: currentView,
      actions: actions.slice(0, 5),
      savedAt: new Date().toISOString(),
      note: '',
    }

    setSavedContext(context)
    saveContext(context)
  }

  // Restore saved context
  const restoreContext = () => {
    if (savedContext) {
      onRestoreContext?.(savedContext)
    }
  }

  // Clear saved context
  const clearSavedContext = () => {
    setSavedContext(null)
    saveContext(null)
  }

  // Pin an action for reference
  const togglePin = (actionId) => {
    setPinnedItems(prev =>
      prev.includes(actionId)
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    )
  }

  // Format action for display
  const formatAction = (action) => {
    switch (action.type) {
      case ACTION_TYPES.TASK_START:
        return { icon: Target, text: `Started: ${action.data.taskTitle}`, color: 'green' }
      case ACTION_TYPES.TASK_COMPLETE:
        return { icon: CheckCircle, text: `Completed: ${action.data.taskTitle}`, color: 'green' }
      case ACTION_TYPES.TIMER_START:
        return { icon: Play, text: 'Started focus timer', color: 'blue' }
      case ACTION_TYPES.TIMER_STOP:
        return { icon: Pause, text: 'Stopped focus timer', color: 'yellow' }
      case ACTION_TYPES.VIEW_CHANGE:
        return { icon: ArrowRight, text: `Switched to: ${action.data.view}`, color: 'purple' }
      case ACTION_TYPES.CAPTURE:
        return { icon: Lightbulb, text: 'Quick capture', color: 'yellow' }
      case ACTION_TYPES.DISTRACTION:
        return { icon: AlertCircle, text: 'Logged distraction', color: 'red' }
      default:
        return { icon: History, text: 'Action', color: 'gray' }
    }
  }

  // Format time ago
  const timeAgo = (timestamp) => {
    const diff = (Date.now() - new Date(timestamp).getTime()) / 1000

    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
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
            <h2 className="font-display text-xl font-semibold">Working Memory</h2>
            <p className="text-sm text-white/50">Track what you were doing</p>
          </div>
        </div>

        {/* "What was I doing?" Button */}
        <motion.button
          onClick={analyzeContext}
          whileTap={{ scale: 0.98 }}
          className="w-full mb-6 p-6 glass-card border border-nero-500/30 bg-gradient-to-r from-nero-500/10 to-purple-500/10"
        >
          <div className="flex items-center justify-center gap-3">
            <Brain className="w-8 h-8 text-nero-400" />
            <span className="text-xl font-medium">What was I doing?</span>
          </div>
          <p className="text-sm text-white/50 mt-2">
            Click when you lose track - I'll remind you
          </p>
        </motion.button>

        {/* Context Result */}
        <AnimatePresence>
          {whatWasIDoing && (
            <motion.div
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0, y: -20, scale: 0.95 },
                animate: { opacity: 1, y: 0, scale: 1 },
                exit: { opacity: 0, y: -20, scale: 0.95 }
              })}
              className="mb-6 p-4 glass-card border border-green-500/30 bg-green-500/10"
            >
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-green-400" />
                <h3 className="font-medium text-green-400">Here's what I found:</h3>
              </div>

              <div className="space-y-2 text-sm">
                {whatWasIDoing.task && (
                  <p>
                    <span className="text-white/50">Last task:</span>{' '}
                    <span className="font-medium">{whatWasIDoing.task}</span>
                  </p>
                )}

                {whatWasIDoing.timerRunning && (
                  <p className="text-yellow-400">
                    ⏱️ You had a focus timer running!
                  </p>
                )}

                {whatWasIDoing.lastView && (
                  <p>
                    <span className="text-white/50">Last screen:</span>{' '}
                    <span className="capitalize">{whatWasIDoing.lastView}</span>
                  </p>
                )}

                {whatWasIDoing.timeSinceLastActivity !== null && (
                  <p className="text-white/50">
                    {whatWasIDoing.timeSinceLastActivity < 1
                      ? 'Activity just now'
                      : `${whatWasIDoing.timeSinceLastActivity}m since last activity`}
                  </p>
                )}
              </div>

              <button
                onClick={() => setWhatWasIDoing(null)}
                className="mt-3 text-xs text-white/40 hover:text-white/60"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saved Context */}
        {savedContext && (
          <div className="mb-6 p-4 glass-card border border-blue-500/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-blue-400" />
                <h3 className="font-medium text-blue-400">Saved Context</h3>
              </div>
              <span className="text-xs text-white/40">
                {timeAgo(savedContext.savedAt)}
              </span>
            </div>

            {savedContext.task && (
              <p className="text-sm mb-2">
                Task: <span className="font-medium">{savedContext.task.title}</span>
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={restoreContext}
                className="flex-1 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4 inline mr-1" />
                Restore
              </button>
              <button
                onClick={clearSavedContext}
                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 text-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Save Context Button */}
        {currentTask && !savedContext && (
          <button
            onClick={saveCurrentContext}
            className="w-full mb-4 px-4 py-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
          >
            <Pin className="w-4 h-4 inline mr-2" />
            Save current context
          </button>
        )}

        {/* Recent Actions */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-white/70 mb-3">Recent Activity</h3>

          <div className="space-y-2">
            {recentActions.map((action) => {
              const { icon: Icon, text, color } = formatAction(action)
              const isPinned = pinnedItems.includes(action.id)

              return (
                <motion.div
                  key={action.id}
                  {...getMotionProps(prefersReducedMotion, {
                    initial: { opacity: 0, x: -10 },
                    animate: { opacity: 1, x: 0 }
                  })}
                  className={`flex items-center gap-3 p-3 rounded-xl bg-white/5 ${
                    isPinned ? 'border border-yellow-500/30' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 text-${color}-400`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{text}</p>
                    <p className="text-xs text-white/40">{timeAgo(action.timestamp)}</p>
                  </div>
                  <button
                    onClick={() => togglePin(action.id)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {isPinned ? (
                      <PinOff className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <Pin className="w-4 h-4 text-white/30" />
                    )}
                  </button>
                </motion.div>
              )
            })}

            {recentActions.length === 0 && (
              <div className="text-center py-8">
                <History className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-sm text-white/50">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Pinned Items */}
        {pinnedItems.length > 0 && (
          <div>
            <button
              onClick={() => setShowPinned(!showPinned)}
              className="flex items-center gap-2 text-sm text-white/70 mb-2"
            >
              <Pin className="w-4 h-4 text-yellow-400" />
              Pinned ({pinnedItems.length})
            </button>

            {showPinned && (
              <div className="space-y-2">
                {actions
                  .filter(a => pinnedItems.includes(a.id))
                  .map((action) => {
                    const { icon: Icon, text, color } = formatAction(action)

                    return (
                      <div
                        key={action.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20"
                      >
                        <div className={`w-8 h-8 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 text-${color}-400`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{text}</p>
                          <p className="text-xs text-white/40">{timeAgo(action.timestamp)}</p>
                        </div>
                        <button
                          onClick={() => togglePin(action.id)}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <PinOff className="w-4 h-4 text-yellow-400" />
                        </button>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="mt-6 p-4 bg-white/5 rounded-xl">
          <p className="text-sm text-white/50">
            <strong className="text-white/70">ADHD Tip:</strong> Use the "What was I doing?" button
            when you get distracted or return from a break. It helps rebuild context faster.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
