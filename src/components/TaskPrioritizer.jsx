import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Target,
  Clock,
  Zap,
  Calendar,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Star,
  Flag,
  CheckCircle,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage keys
const TASKS_KEY = 'nero_prioritized_tasks'
const TASK_HISTORY_KEY = 'nero_task_history'

// Load tasks
const loadTasks = () => {
  try {
    const stored = localStorage.getItem(TASKS_KEY)
    return stored ? JSON.parse(stored) : getDemoTasks()
  } catch {
    return getDemoTasks()
  }
}

// Demo tasks for new users
const getDemoTasks = () => [
  { id: '1', title: 'Reply to urgent email', deadline: 'today', energy: 1, importance: 'high', estimate: 10 },
  { id: '2', title: 'Finish project report', deadline: 'tomorrow', energy: 3, importance: 'high', estimate: 60 },
  { id: '3', title: 'Schedule dentist appointment', deadline: 'this_week', energy: 1, importance: 'medium', estimate: 5 },
  { id: '4', title: 'Review meeting notes', deadline: 'today', energy: 2, importance: 'medium', estimate: 15 },
  { id: '5', title: 'Clean inbox', deadline: 'this_week', energy: 2, importance: 'low', estimate: 20 },
  { id: '6', title: 'Plan weekend activities', deadline: 'this_week', energy: 1, importance: 'low', estimate: 10 },
]

// Save tasks
const saveTasks = (tasks) => {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
}

// Load task history
const loadTaskHistory = () => {
  try {
    const stored = localStorage.getItem(TASK_HISTORY_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Prioritization algorithm
const prioritizeTasks = (tasks, energyLevel, currentHour) => {
  return tasks.map(task => {
    let score = 0
    let reasons = []

    // Deadline urgency (0-40 points)
    if (task.deadline === 'overdue') {
      score += 40
      reasons.push('Overdue!')
    } else if (task.deadline === 'today') {
      score += 35
      reasons.push('Due today')
    } else if (task.deadline === 'tomorrow') {
      score += 25
      reasons.push('Due tomorrow')
    } else if (task.deadline === 'this_week') {
      score += 15
      reasons.push('Due this week')
    }

    // Importance (0-30 points)
    if (task.importance === 'high') {
      score += 30
      reasons.push('High importance')
    } else if (task.importance === 'medium') {
      score += 15
    }

    // Energy match (0-20 points)
    const energyMatch = Math.abs(task.energy - energyLevel)
    if (energyMatch === 0) {
      score += 20
      reasons.push('Perfect energy match')
    } else if (energyMatch === 1) {
      score += 15
      reasons.push('Good energy match')
    } else if (energyMatch > 2 && task.energy > energyLevel) {
      score -= 10
      reasons.push('May be too demanding')
    }

    // Time of day optimization (0-10 points)
    if (currentHour >= 9 && currentHour <= 11 && task.energy === 3) {
      score += 10
      reasons.push('Best time for hard work')
    } else if (currentHour >= 14 && currentHour <= 16 && task.energy === 1) {
      score += 10
      reasons.push('Good for afternoon slump')
    }

    // Quick win bonus (0-10 points)
    if (task.estimate && task.estimate <= 10) {
      score += 10
      reasons.push('Quick win')
    }

    return {
      ...task,
      score,
      reasons,
    }
  }).sort((a, b) => b.score - a.score)
}

// Deadline options
const DEADLINES = [
  { id: 'overdue', label: 'Overdue', color: 'red' },
  { id: 'today', label: 'Today', color: 'orange' },
  { id: 'tomorrow', label: 'Tomorrow', color: 'yellow' },
  { id: 'this_week', label: 'This Week', color: 'blue' },
  { id: 'later', label: 'Later', color: 'gray' },
]

// Importance options
const IMPORTANCE = [
  { id: 'high', label: 'High', color: 'red' },
  { id: 'medium', label: 'Medium', color: 'yellow' },
  { id: 'low', label: 'Low', color: 'green' },
]

export default function TaskPrioritizer({ energyLevel, onSelectTask }) {
  const prefersReducedMotion = useReducedMotion()
  const [tasks, setTasks] = useState([])
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    deadline: 'this_week',
    energy: 2,
    importance: 'medium',
    estimate: 15,
  })

  // Load tasks on mount
  useEffect(() => {
    setTasks(loadTasks())
  }, [])

  // Prioritized tasks
  const prioritizedTasks = useMemo(() => {
    const currentHour = new Date().getHours()
    return prioritizeTasks(tasks, energyLevel, currentHour)
  }, [tasks, energyLevel])

  // Top recommendation
  const topRecommendation = prioritizedTasks[0]

  // Add task
  const addTask = () => {
    if (!newTask.title.trim()) return

    const task = {
      ...newTask,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }

    const updatedTasks = [...tasks, task]
    setTasks(updatedTasks)
    saveTasks(updatedTasks)

    setNewTask({
      title: '',
      deadline: 'this_week',
      energy: 2,
      importance: 'medium',
      estimate: 15,
    })
    setShowAddTask(false)
  }

  // Complete task
  const completeTask = (taskId) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId)
    setTasks(updatedTasks)
    saveTasks(updatedTasks)
  }

  // Start task
  const startTask = (task) => {
    onSelectTask?.({
      id: task.id,
      title: task.title,
      description: task.reasons?.join(' | '),
      energyRequired: task.energy,
      reason: `Priority score: ${task.score}`,
      isCompleted: false,
    })
  }

  // Get energy display
  const getEnergyDisplay = (level) => {
    if (level <= 1) return { icon: BatteryLow, label: 'Low', color: 'text-green-400' }
    if (level === 2) return { icon: BatteryMedium, label: 'Med', color: 'text-yellow-400' }
    return { icon: BatteryFull, label: 'High', color: 'text-orange-400' }
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
            <h2 className="font-display text-xl font-semibold">AI Prioritizer</h2>
            <p className="text-sm text-white/50">Smart task recommendations</p>
          </div>
          <button
            onClick={() => setShowAddTask(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-nero-500/20 hover:bg-nero-500/30 text-nero-400 transition-colors"
          >
            + Add Task
          </button>
        </div>

        {/* Energy Context */}
        <div className="glass-card p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-white/70">Current Energy</span>
            </div>
            <div className="flex items-center gap-2">
              {(() => {
                const energy = getEnergyDisplay(energyLevel)
                const Icon = energy.icon
                return (
                  <>
                    <Icon className={`w-5 h-5 ${energy.color}`} />
                    <span className={`font-medium ${energy.color}`}>{energy.label}</span>
                  </>
                )
              })()}
            </div>
          </div>
          <p className="text-xs text-white/50 mt-2">
            Tasks are sorted based on deadlines, importance, and your energy level
          </p>
        </div>

        {/* Top Recommendation */}
        {topRecommendation && (
          <motion.div
            {...getMotionProps(prefersReducedMotion, {
              initial: { opacity: 0, scale: 0.95 },
              animate: { opacity: 1, scale: 1 }
            })}
            className="mb-4 p-4 glass-card border border-nero-500/30 bg-gradient-to-r from-nero-500/10 to-purple-500/10"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-nero-400" />
              <span className="text-sm font-medium text-nero-400">Top Recommendation</span>
            </div>

            <h3 className="text-lg font-medium mb-2">{topRecommendation.title}</h3>

            <div className="flex flex-wrap gap-2 mb-3">
              {topRecommendation.reasons?.slice(0, 3).map((reason, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full bg-white/10">
                  {reason}
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => startTask(topRecommendation)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-nero-500 hover:bg-nero-600 text-white transition-colors"
              >
                <Target className="w-4 h-4" />
                Start Now
              </button>
              <button
                onClick={() => completeTask(topRecommendation.id)}
                className="px-4 py-2 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Task List */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-white/50 mb-2">All Tasks (by priority)</h3>

          {prioritizedTasks.slice(1).map((task, index) => {
            const energy = getEnergyDisplay(task.energy)
            const EnergyIcon = energy.icon
            const deadline = DEADLINES.find(d => d.id === task.deadline)
            const importance = IMPORTANCE.find(i => i.id === task.importance)

            return (
              <motion.div
                key={task.id}
                {...getMotionProps(prefersReducedMotion, {
                  initial: { opacity: 0, x: -10 },
                  animate: { opacity: 1, x: 0 },
                  transition: { delay: index * 0.05 }
                })}
                className="glass-card p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm font-bold text-white/50">
                    {index + 2}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs text-${deadline?.color}-400`}>
                        {deadline?.label}
                      </span>
                      <span className="text-white/30">-</span>
                      <EnergyIcon className={`w-3 h-3 ${energy.color}`} />
                      {task.estimate && (
                        <>
                          <span className="text-white/30">-</span>
                          <span className="text-xs text-white/50">{task.estimate}m</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => startTask(task)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <Target className="w-4 h-4 text-white/50" />
                    </button>
                    <button
                      onClick={() => completeTask(task.id)}
                      className="p-2 rounded-lg hover:bg-green-500/20 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 text-green-400/50" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Empty state */}
        {tasks.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">No tasks to prioritize</p>
            <p className="text-sm text-white/30 mt-1">
              Add tasks to get AI-powered recommendations
            </p>
          </div>
        )}

        {/* Add Task Modal */}
        <AnimatePresence>
          {showAddTask && (
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
                onClick={() => setShowAddTask(false)}
              />

              <motion.div
                className="relative w-full max-w-md glass-card p-5"
                {...getMotionProps(prefersReducedMotion, {
                  initial: { y: 100, opacity: 0 },
                  animate: { y: 0, opacity: 1 },
                  exit: { y: 100, opacity: 0 }
                })}
              >
                <h3 className="font-display text-lg font-semibold mb-4">Add Task</h3>

                {/* Title */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="What needs to be done?"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                    autoFocus
                  />
                </div>

                {/* Deadline */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">When is it due?</label>
                  <div className="flex gap-2">
                    {DEADLINES.filter(d => d.id !== 'overdue').map((dl) => (
                      <button
                        key={dl.id}
                        onClick={() => setNewTask(prev => ({ ...prev, deadline: dl.id }))}
                        className={`flex-1 px-2 py-2 rounded-lg text-xs transition-colors ${
                          newTask.deadline === dl.id
                            ? `bg-${dl.color}-500/20 text-${dl.color}-400 border border-${dl.color}-500/30`
                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {dl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Energy Required */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Energy Required</label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((level) => {
                      const energy = getEnergyDisplay(level)
                      const Icon = energy.icon
                      return (
                        <button
                          key={level}
                          onClick={() => setNewTask(prev => ({ ...prev, energy: level }))}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                            newTask.energy === level
                              ? 'bg-white/10 border border-white/20'
                              : 'bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${energy.color}`} />
                          <span className="text-sm">{energy.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Importance */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Importance</label>
                  <div className="flex gap-2">
                    {IMPORTANCE.map((imp) => (
                      <button
                        key={imp.id}
                        onClick={() => setNewTask(prev => ({ ...prev, importance: imp.id }))}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                          newTask.importance === imp.id
                            ? `bg-${imp.color}-500/20 text-${imp.color}-400 border border-${imp.color}-500/30`
                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {imp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Estimate */}
                <div className="mb-6">
                  <label className="block text-sm text-white/70 mb-2">Time Estimate (minutes)</label>
                  <input
                    type="number"
                    value={newTask.estimate}
                    onChange={(e) => setNewTask(prev => ({ ...prev, estimate: parseInt(e.target.value) || 15 }))}
                    min="1"
                    max="480"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/20"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddTask(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addTask}
                    disabled={!newTask.title.trim()}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                      newTask.title.trim()
                        ? 'bg-nero-500 hover:bg-nero-600 text-white'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    Add Task
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
