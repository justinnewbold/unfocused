import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  Plus,
  ChevronRight,
  Trash2,
  Zap,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Sparkles,
  Filter,
  GripVertical
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Energy level configurations
const ENERGY_LEVELS = [
  { value: 1, label: 'Very Low', icon: BatteryLow, color: 'red' },
  { value: 2, label: 'Low', icon: BatteryLow, color: 'orange' },
  { value: 3, label: 'Medium', icon: BatteryMedium, color: 'yellow' },
  { value: 4, label: 'High', icon: BatteryFull, color: 'lime' },
  { value: 5, label: 'Very High', icon: BatteryFull, color: 'green' },
]

// Demo tasks
const INITIAL_TASKS = [
  { id: '1', title: 'Reply to important email', energyRequired: 2, createdAt: new Date() },
  { id: '2', title: 'Review project proposal', energyRequired: 4, createdAt: new Date() },
  { id: '3', title: 'Schedule dentist appointment', energyRequired: 1, createdAt: new Date() },
  { id: '4', title: 'Research new productivity tools', energyRequired: 3, createdAt: new Date() },
  { id: '5', title: 'Deep work on presentation', energyRequired: 5, createdAt: new Date() },
]

export default function TaskQueue({ currentEnergy = 3, onSelectTask, captures = [] }) {
  const prefersReducedMotion = useReducedMotion()
  const [tasks, setTasks] = useState(INITIAL_TASKS)
  const [filter, setFilter] = useState('all') // 'all' | 'doable' | 'low' | 'high'
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskEnergy, setNewTaskEnergy] = useState(2)

  // Get tasks from captures that are task type
  const capturedTasks = useMemo(() => {
    return captures
      .filter(c => c.type === 'task')
      .map(c => ({
        id: c.id,
        title: c.text,
        energyRequired: 2, // Default energy
        createdAt: c.createdAt,
        fromCapture: true
      }))
  }, [captures])

  // Combine and filter tasks
  const allTasks = useMemo(() => {
    const combined = [...tasks, ...capturedTasks]

    switch (filter) {
      case 'doable':
        return combined.filter(t => t.energyRequired <= currentEnergy)
      case 'low':
        return combined.filter(t => t.energyRequired <= 2)
      case 'high':
        return combined.filter(t => t.energyRequired >= 4)
      default:
        return combined
    }
  }, [tasks, capturedTasks, filter, currentEnergy])

  // Get recommended task (best match for current energy)
  const recommendedTask = useMemo(() => {
    const doable = allTasks.filter(t => t.energyRequired <= currentEnergy)
    if (doable.length === 0) return null

    // Find the task that best matches current energy (use it, don't waste it)
    return doable.reduce((best, task) => {
      const bestDiff = currentEnergy - best.energyRequired
      const taskDiff = currentEnergy - task.energyRequired
      return taskDiff < bestDiff ? task : best
    })
  }, [allTasks, currentEnergy])

  const addTask = () => {
    if (!newTaskTitle.trim()) return

    const newTask = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      energyRequired: newTaskEnergy,
      createdAt: new Date()
    }

    setTasks(prev => [newTask, ...prev])
    setNewTaskTitle('')
    setNewTaskEnergy(2)
    setShowAddTask(false)
  }

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const selectTask = (task) => {
    onSelectTask?.({
      id: task.id,
      title: task.title,
      description: '',
      energyRequired: task.energyRequired,
      reason: task.energyRequired <= currentEnergy
        ? 'This matches your current energy level'
        : 'This might be challenging at your current energy',
      isCompleted: false
    })
  }

  const getEnergyConfig = (level) => ENERGY_LEVELS.find(e => e.value === level) || ENERGY_LEVELS[2]

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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-semibold">Task Queue</h2>
            <p className="text-sm text-white/50">{allTasks.length} tasks waiting</p>
          </div>
          <button
            onClick={() => setShowAddTask(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-nero-500/20 hover:bg-nero-500/30 text-nero-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Recommended Task */}
        {recommendedTask && (
          <motion.div
            className="mb-4 p-4 rounded-xl bg-gradient-to-r from-nero-500/20 to-nero-600/20 border border-nero-500/30"
            {...getMotionProps(prefersReducedMotion, {
              initial: { opacity: 0, scale: 0.95 },
              animate: { opacity: 1, scale: 1 }
            })}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-nero-400" />
              <span className="text-sm font-medium text-nero-400">Recommended for you</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{recommendedTask.title}</p>
                <p className="text-xs text-white/50">
                  Matches your energy level ({currentEnergy}/5)
                </p>
              </div>
              <button
                onClick={() => selectTask(recommendedTask)}
                className="px-4 py-2 rounded-xl bg-nero-500 hover:bg-nero-600 text-white font-medium transition-colors flex items-center gap-2"
              >
                Start
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'doable', label: 'Doable Now', icon: Zap },
            { id: 'low', label: 'Low Energy' },
            { id: 'high', label: 'High Energy' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                filter === f.id
                  ? 'bg-white/10 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {f.icon && <f.icon className="w-3 h-3" />}
              {f.label}
            </button>
          ))}
        </div>

        {/* Task list */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {allTasks.map((task) => {
              const energyConfig = getEnergyConfig(task.energyRequired)
              const isDoable = task.energyRequired <= currentEnergy
              const EnergyIcon = energyConfig.icon

              return (
                <motion.div
                  key={task.id}
                  layout
                  {...getMotionProps(prefersReducedMotion, {
                    initial: { opacity: 0, x: -20 },
                    animate: { opacity: 1, x: 0 },
                    exit: { opacity: 0, x: 20 }
                  })}
                  className={`glass-card p-4 ${
                    isDoable ? 'border-l-2 border-l-calm-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Drag handle placeholder */}
                    <div className="text-white/20 cursor-grab">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Task content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`flex items-center gap-1 text-xs text-${energyConfig.color}-400`}>
                          <EnergyIcon className="w-3 h-3" />
                          {energyConfig.label}
                        </span>
                        {task.fromCapture && (
                          <span className="text-xs text-white/40 px-1.5 py-0.5 rounded bg-white/5">
                            Captured
                          </span>
                        )}
                        {isDoable && (
                          <span className="text-xs text-calm-400">
                            Doable now
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => selectTask(task)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {allTasks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/40">No tasks match this filter</p>
              <button
                onClick={() => setFilter('all')}
                className="mt-2 text-nero-400 hover:underline"
              >
                Show all tasks
              </button>
            </div>
          )}
        </div>

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

                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-nero-500/50 mb-4"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                />

                <div className="mb-4">
                  <label className="text-sm text-white/70 mb-2 block">Energy Required</label>
                  <div className="flex gap-2">
                    {ENERGY_LEVELS.map((level) => (
                      <button
                        key={level.value}
                        onClick={() => setNewTaskEnergy(level.value)}
                        className={`flex-1 p-2 rounded-lg transition-colors ${
                          newTaskEnergy === level.value
                            ? `bg-${level.color}-500/20 border border-${level.color}-500/30 text-${level.color}-400`
                            : 'bg-white/5 text-white/50 hover:bg-white/10'
                        }`}
                      >
                        <level.icon className="w-4 h-4 mx-auto mb-1" />
                        <span className="text-xs">{level.value}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddTask(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addTask}
                    disabled={!newTaskTitle.trim()}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                      newTaskTitle.trim()
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
