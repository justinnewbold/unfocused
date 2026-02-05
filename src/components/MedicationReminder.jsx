import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pill,
  Plus,
  X,
  Clock,
  Check,
  Bell,
  BellOff,
  Calendar,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  CheckCircle,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage keys
const MEDICATIONS_KEY = 'nero_medications'
const MED_LOG_KEY = 'nero_medication_log'

// Load medications from localStorage
const loadMedications = () => {
  try {
    const stored = localStorage.getItem(MEDICATIONS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save medications
const saveMedications = (meds) => {
  localStorage.setItem(MEDICATIONS_KEY, JSON.stringify(meds))
}

// Load medication log
const loadMedLog = () => {
  try {
    const stored = localStorage.getItem(MED_LOG_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save medication log
const saveMedLog = (log) => {
  localStorage.setItem(MED_LOG_KEY, JSON.stringify(log.slice(-365))) // Keep 1 year
}

// Get today's date key
const getTodayKey = () => new Date().toISOString().split('T')[0]

// Format time for display
const formatTime = (time) => {
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}

// Check if a reminder time has passed
const hasTimePassed = (time) => {
  const now = new Date()
  const [hours, minutes] = time.split(':').map(Number)
  const reminderTime = new Date()
  reminderTime.setHours(hours, minutes, 0, 0)
  return now >= reminderTime
}

// Default medication colors
const MED_COLORS = [
  { id: 'blue', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  { id: 'purple', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  { id: 'green', bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  { id: 'orange', bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  { id: 'pink', bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
  { id: 'cyan', bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
]

export default function MedicationReminder({ onMedicationTaken }) {
  const prefersReducedMotion = useReducedMotion()
  const [medications, setMedications] = useState([])
  const [medLog, setMedLog] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [editingMed, setEditingMed] = useState(null)

  // Form state
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    times: ['08:00'],
    color: 'blue',
    notes: '',
  })

  // Load data on mount
  useEffect(() => {
    setMedications(loadMedications())
    setMedLog(loadMedLog())
  }, [])

  // Get today's log entries
  const todayLog = useMemo(() => {
    const today = getTodayKey()
    return medLog.filter(entry => entry.date === today)
  }, [medLog])

  // Check if medication was taken at a specific time today
  const wasTaken = (medId, time) => {
    return todayLog.some(entry => entry.medId === medId && entry.time === time)
  }

  // Get adherence stats
  const stats = useMemo(() => {
    const last7Days = []
    const last30Days = []
    const now = new Date()

    for (let i = 0; i < 30; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]

      const dayEntries = medLog.filter(e => e.date === dateKey)
      const expectedDoses = medications.reduce((sum, med) => sum + med.times.length, 0)
      const takenDoses = dayEntries.length

      const adherence = expectedDoses > 0 ? (takenDoses / expectedDoses) * 100 : 100

      if (i < 7) last7Days.push(adherence)
      last30Days.push(adherence)
    }

    return {
      weekAvg: last7Days.length > 0 ? Math.round(last7Days.reduce((a, b) => a + b, 0) / last7Days.length) : 0,
      monthAvg: last30Days.length > 0 ? Math.round(last30Days.reduce((a, b) => a + b, 0) / last30Days.length) : 0,
      streak: calculateStreak(),
    }
  }, [medLog, medications])

  // Calculate current streak
  function calculateStreak() {
    let streak = 0
    const now = new Date()

    for (let i = 0; i < 365; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]

      const dayEntries = medLog.filter(e => e.date === dateKey)
      const expectedDoses = medications.reduce((sum, med) => sum + med.times.length, 0)

      if (expectedDoses === 0) continue
      if (dayEntries.length >= expectedDoses) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  // Mark medication as taken
  const takeMedication = (medId, time) => {
    const entry = {
      id: Date.now().toString(),
      medId,
      time,
      date: getTodayKey(),
      takenAt: new Date().toISOString(),
    }

    const newLog = [entry, ...medLog]
    setMedLog(newLog)
    saveMedLog(newLog)

    const med = medications.find(m => m.id === medId)
    onMedicationTaken?.(med)
  }

  // Add or update medication
  const saveMedication = () => {
    if (!newMed.name.trim()) return

    let updatedMeds
    if (editingMed) {
      updatedMeds = medications.map(med =>
        med.id === editingMed.id ? { ...newMed, id: med.id } : med
      )
    } else {
      const med = {
        ...newMed,
        id: Date.now().toString(),
      }
      updatedMeds = [...medications, med]
    }

    setMedications(updatedMeds)
    saveMedications(updatedMeds)
    resetForm()
  }

  // Delete medication
  const deleteMedication = (medId) => {
    const updatedMeds = medications.filter(m => m.id !== medId)
    setMedications(updatedMeds)
    saveMedications(updatedMeds)
  }

  // Reset form
  const resetForm = () => {
    setNewMed({
      name: '',
      dosage: '',
      times: ['08:00'],
      color: 'blue',
      notes: '',
    })
    setEditingMed(null)
    setShowAddModal(false)
  }

  // Add time slot
  const addTimeSlot = () => {
    setNewMed(prev => ({
      ...prev,
      times: [...prev.times, '12:00']
    }))
  }

  // Remove time slot
  const removeTimeSlot = (index) => {
    setNewMed(prev => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== index)
    }))
  }

  // Update time slot
  const updateTimeSlot = (index, value) => {
    setNewMed(prev => ({
      ...prev,
      times: prev.times.map((t, i) => i === index ? value : t)
    }))
  }

  // Start editing
  const startEdit = (med) => {
    setEditingMed(med)
    setNewMed(med)
    setShowAddModal(true)
  }

  // Get pending doses (due but not taken)
  const pendingDoses = useMemo(() => {
    const pending = []
    medications.forEach(med => {
      med.times.forEach(time => {
        if (hasTimePassed(time) && !wasTaken(med.id, time)) {
          pending.push({ med, time })
        }
      })
    })
    return pending
  }, [medications, todayLog])

  const getColorClass = (colorId, type) => {
    const color = MED_COLORS.find(c => c.id === colorId) || MED_COLORS[0]
    return color[type]
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
            <h2 className="font-display text-xl font-semibold">Medication Reminder</h2>
            <p className="text-sm text-white/50">Track your meds, build habits</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Pending Alert */}
        {pendingDoses.length > 0 && (
          <motion.div
            {...getMotionProps(prefersReducedMotion, {
              initial: { opacity: 0, scale: 0.95 },
              animate: { opacity: 1, scale: 1 }
            })}
            className="mb-4 p-4 rounded-2xl bg-orange-500/20 border border-orange-500/30"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              <div className="flex-1">
                <p className="font-medium text-orange-400">
                  {pendingDoses.length} dose{pendingDoses.length > 1 ? 's' : ''} pending
                </p>
                <p className="text-sm text-white/60">
                  {pendingDoses.map(d => d.med.name).join(', ')}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Card */}
        {medications.length > 0 && (
          <div className="glass-card p-4 mb-4">
            <button
              onClick={() => setShowStats(!showStats)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-white/50" />
                <span className="font-medium">Adherence Stats</span>
              </div>
              {showStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {showStats && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="text-center p-3 bg-white/5 rounded-xl">
                      <p className="text-2xl font-bold text-green-400">{stats.weekAvg}%</p>
                      <p className="text-xs text-white/50">7-day avg</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-xl">
                      <p className="text-2xl font-bold text-purple-400">{stats.monthAvg}%</p>
                      <p className="text-xs text-white/50">30-day avg</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-xl">
                      <p className="text-2xl font-bold text-orange-400">{stats.streak}</p>
                      <p className="text-xs text-white/50">day streak</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Medications List */}
        <div className="space-y-3">
          {medications.map((med) => {
            const colorBg = getColorClass(med.color, 'bg')
            const colorText = getColorClass(med.color, 'text')
            const colorBorder = getColorClass(med.color, 'border')

            return (
              <motion.div
                key={med.id}
                {...getMotionProps(prefersReducedMotion, {
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 }
                })}
                className={`glass-card p-4 border ${colorBorder}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${colorBg} flex items-center justify-center`}>
                      <Pill className={`w-5 h-5 ${colorText}`} />
                    </div>
                    <div>
                      <h3 className="font-medium">{med.name}</h3>
                      {med.dosage && (
                        <p className="text-sm text-white/50">{med.dosage}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(med)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-white/50" />
                    </button>
                    <button
                      onClick={() => deleteMedication(med.id)}
                      className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400/50" />
                    </button>
                  </div>
                </div>

                {/* Time slots */}
                <div className="flex flex-wrap gap-2">
                  {med.times.map((time, idx) => {
                    const taken = wasTaken(med.id, time)
                    const isPending = hasTimePassed(time) && !taken

                    return (
                      <button
                        key={idx}
                        onClick={() => !taken && takeMedication(med.id, time)}
                        disabled={taken}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                          taken
                            ? 'bg-green-500/20 text-green-400'
                            : isPending
                              ? `${colorBg} ${colorText} animate-pulse`
                              : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {taken ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">{formatTime(time)}</span>
                      </button>
                    )
                  })}
                </div>

                {med.notes && (
                  <p className="mt-3 text-sm text-white/50 italic">{med.notes}</p>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Empty state */}
        {medications.length === 0 && (
          <div className="text-center py-12">
            <Pill className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">No medications added yet</p>
            <p className="text-sm text-white/30 mt-1">
              Add your meds to get reminders
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-colors"
            >
              Add Medication
            </button>
          </div>
        )}

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
                className="relative w-full max-w-md glass-card p-5 max-h-[90vh] overflow-y-auto"
                {...getMotionProps(prefersReducedMotion, {
                  initial: { y: 100, opacity: 0 },
                  animate: { y: 0, opacity: 1 },
                  exit: { y: 100, opacity: 0 }
                })}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-semibold">
                    {editingMed ? 'Edit Medication' : 'Add Medication'}
                  </h3>
                  <button
                    onClick={resetForm}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Name */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Name *</label>
                  <input
                    type="text"
                    value={newMed.name}
                    onChange={(e) => setNewMed(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Adderall, Vyvanse"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                  />
                </div>

                {/* Dosage */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Dosage</label>
                  <input
                    type="text"
                    value={newMed.dosage}
                    onChange={(e) => setNewMed(prev => ({ ...prev, dosage: e.target.value }))}
                    placeholder="e.g., 20mg, 2 tablets"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                  />
                </div>

                {/* Times */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-white/70">Reminder Times</label>
                    <button
                      onClick={addTimeSlot}
                      className="text-sm text-purple-400 hover:text-purple-300"
                    >
                      + Add time
                    </button>
                  </div>
                  <div className="space-y-2">
                    {newMed.times.map((time, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => updateTimeSlot(idx, e.target.value)}
                          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/20"
                        />
                        {newMed.times.length > 1 && (
                          <button
                            onClick={() => removeTimeSlot(idx)}
                            className="p-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Color</label>
                  <div className="flex gap-2">
                    {MED_COLORS.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setNewMed(prev => ({ ...prev, color: color.id }))}
                        className={`w-10 h-10 rounded-xl ${color.bg} ${
                          newMed.color === color.id ? `ring-2 ring-offset-2 ring-offset-surface ${color.border.replace('border', 'ring')}` : ''
                        } transition-all`}
                      />
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-sm text-white/70 mb-2">Notes</label>
                  <textarea
                    value={newMed.notes}
                    onChange={(e) => setNewMed(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="e.g., Take with food, avoid caffeine"
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
                    onClick={saveMedication}
                    disabled={!newMed.name.trim()}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                      newMed.name.trim()
                        ? 'bg-purple-500 hover:bg-purple-600 text-white'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    {editingMed ? 'Save Changes' : 'Add Medication'}
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
