import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  MapPin,
  Car,
  Bus,
  Bike,
  Footprints,
  AlertTriangle,
  Bell,
  Plus,
  X,
  ChevronRight,
  Coffee,
  Briefcase,
  Shirt,
  Sparkles,
  Calendar,
  Navigation,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const APPOINTMENTS_KEY = 'nero_appointments'
const PREP_TEMPLATES_KEY = 'nero_prep_templates'

// Transport modes
const TRANSPORT_MODES = [
  { id: 'car', name: 'Driving', icon: Car, avgSpeed: 30 }, // mph
  { id: 'transit', name: 'Public Transit', icon: Bus, avgSpeed: 15 },
  { id: 'bike', name: 'Biking', icon: Bike, avgSpeed: 12 },
  { id: 'walk', name: 'Walking', icon: Footprints, avgSpeed: 3 },
]

// Default prep activities
const DEFAULT_PREP = [
  { id: 'shower', name: 'Shower & get ready', duration: 20, icon: '🚿' },
  { id: 'outfit', name: 'Choose outfit', duration: 10, icon: '👔' },
  { id: 'gather', name: 'Gather items needed', duration: 5, icon: '🎒' },
  { id: 'snack', name: 'Quick snack', duration: 10, icon: '🍎' },
  { id: 'buffer', name: 'Buffer time (just in case)', duration: 10, icon: '⏰' },
]

// Load appointments
const loadAppointments = () => {
  try {
    const stored = localStorage.getItem(APPOINTMENTS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save appointments
const saveAppointments = (appointments) => {
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments))
}

export default function AppointmentBuffer({ onSetReminder }) {
  const prefersReducedMotion = useReducedMotion()
  const [appointments, setAppointments] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)

  // Calculator state
  const [calculator, setCalculator] = useState({
    appointmentTime: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    transportMode: 'car',
    distance: 10, // miles
    prepActivities: ['shower', 'gather', 'buffer'],
    customPrepMinutes: 0,
  })

  // Load data on mount
  useEffect(() => {
    setAppointments(loadAppointments())
  }, [])

  // Calculate leave time
  const leaveTimeCalculation = useMemo(() => {
    if (!calculator.appointmentTime) return null

    const [hours, minutes] = calculator.appointmentTime.split(':').map(Number)
    const appointmentDate = new Date(calculator.appointmentDate)
    appointmentDate.setHours(hours, minutes, 0, 0)

    // Calculate travel time
    const transport = TRANSPORT_MODES.find(t => t.id === calculator.transportMode)
    const travelMinutes = Math.ceil((calculator.distance / transport.avgSpeed) * 60)

    // Calculate prep time
    const prepMinutes = calculator.prepActivities.reduce((total, actId) => {
      const activity = DEFAULT_PREP.find(p => p.id === actId)
      return total + (activity?.duration || 0)
    }, 0) + calculator.customPrepMinutes

    // Total time needed
    const totalMinutes = travelMinutes + prepMinutes

    // Calculate start prep time (need to start getting ready this early)
    const startPrepTime = new Date(appointmentDate.getTime() - totalMinutes * 60 * 1000)

    // Calculate leave time (leave after prep is done, with just travel time remaining)
    const leaveTime = new Date(appointmentDate.getTime() - travelMinutes * 60 * 1000)

    // Time until leave
    const now = new Date()
    const minutesUntilLeave = Math.round((leaveTime - now) / 1000 / 60)

    return {
      appointmentTime: appointmentDate,
      travelMinutes,
      prepMinutes,
      totalMinutes,
      leaveTime,
      startPrepTime,
      minutesUntilLeave,
      isUrgent: minutesUntilLeave < 60 && minutesUntilLeave > 0,
      isPast: minutesUntilLeave < 0,
    }
  }, [calculator])

  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })
  }

  // Toggle prep activity
  const togglePrepActivity = (activityId) => {
    setCalculator(prev => ({
      ...prev,
      prepActivities: prev.prepActivities.includes(activityId)
        ? prev.prepActivities.filter(id => id !== activityId)
        : [...prev.prepActivities, activityId]
    }))
  }

  // Save appointment
  const saveAppointment = () => {
    if (!calculator.appointmentTime || !leaveTimeCalculation) return

    const appointment = {
      id: Date.now().toString(),
      ...calculator,
      leaveTime: leaveTimeCalculation.leaveTime.toISOString(),
      startPrepTime: leaveTimeCalculation.startPrepTime.toISOString(),
      createdAt: new Date().toISOString(),
    }

    const updated = [...appointments, appointment]
    setAppointments(updated)
    saveAppointments(updated)

    // Set reminder
    onSetReminder?.({
      id: appointment.id,
      time: leaveTimeCalculation.startPrepTime,
      title: 'Time to start getting ready!',
    })

    setShowAddModal(false)
    resetCalculator()
  }

  // Delete appointment
  const deleteAppointment = (id) => {
    const updated = appointments.filter(a => a.id !== id)
    setAppointments(updated)
    saveAppointments(updated)
  }

  // Reset calculator
  const resetCalculator = () => {
    setCalculator({
      appointmentTime: '',
      appointmentDate: new Date().toISOString().split('T')[0],
      transportMode: 'car',
      distance: 10,
      prepActivities: ['shower', 'gather', 'buffer'],
      customPrepMinutes: 0,
    })
  }

  // Upcoming appointments (today)
  const upcomingToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return appointments
      .filter(a => a.appointmentDate === today)
      .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime))
  }, [appointments])

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
            <h2 className="font-display text-xl font-semibold">Appointment Buffer</h2>
            <p className="text-sm text-white/50">Never be late again</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Calculate
          </button>
        </div>

        {/* Today's Appointments */}
        {upcomingToday.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-white/70 mb-3">Today's Schedule</h3>
            <div className="space-y-3">
              {upcomingToday.map((apt) => {
                const leaveTime = new Date(apt.leaveTime)
                const now = new Date()
                const minutesUntil = Math.round((leaveTime - now) / 1000 / 60)
                const isUrgent = minutesUntil < 60 && minutesUntil > 0
                const isPast = minutesUntil < 0

                return (
                  <motion.div
                    key={apt.id}
                    {...getMotionProps(prefersReducedMotion, {
                      initial: { opacity: 0, y: 10 },
                      animate: { opacity: 1, y: 0 }
                    })}
                    className={`glass-card p-4 ${
                      isUrgent ? 'border border-orange-500/50 bg-orange-500/10' :
                      isPast ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {apt.appointmentTime.replace(':', ':')} Appointment
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-white/50">
                          <Navigation className="w-3 h-3" />
                          <span>{apt.distance} miles away</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteAppointment(apt.id)}
                        className="p-1 rounded-lg hover:bg-red-500/20"
                      >
                        <X className="w-4 h-4 text-red-400/50" />
                      </button>
                    </div>

                    <div className="mt-3 p-3 bg-white/5 rounded-lg">
                      {isPast ? (
                        <p className="text-sm text-white/50">This appointment has passed</p>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 text-orange-400">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">
                              Leave at {formatTime(leaveTime)}
                            </span>
                          </div>
                          {isUrgent && (
                            <p className="text-sm text-orange-300 mt-1">
                              <AlertTriangle className="w-3 h-3 inline mr-1" />
                              {minutesUntil} minutes until you need to leave!
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick Calculator */}
        <div className="glass-card p-4">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-400" />
            Quick Calculator
          </h3>

          {/* Time Input */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs text-white/50 mb-1">Date</label>
              <input
                type="date"
                value={calculator.appointmentDate}
                onChange={(e) => setCalculator(prev => ({ ...prev, appointmentDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Appointment Time</label>
              <input
                type="time"
                value={calculator.appointmentTime}
                onChange={(e) => setCalculator(prev => ({ ...prev, appointmentTime: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              />
            </div>
          </div>

          {/* Transport Mode */}
          <div className="mb-4">
            <label className="block text-xs text-white/50 mb-2">How are you getting there?</label>
            <div className="grid grid-cols-4 gap-2">
              {TRANSPORT_MODES.map((mode) => {
                const Icon = mode.icon
                return (
                  <button
                    key={mode.id}
                    onClick={() => setCalculator(prev => ({ ...prev, transportMode: mode.id }))}
                    className={`p-3 rounded-lg flex flex-col items-center gap-1 transition-colors ${
                      calculator.transportMode === mode.id
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{mode.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Distance */}
          <div className="mb-4">
            <label className="block text-xs text-white/50 mb-2">Distance: {calculator.distance} miles</label>
            <input
              type="range"
              min="1"
              max="50"
              value={calculator.distance}
              onChange={(e) => setCalculator(prev => ({ ...prev, distance: parseInt(e.target.value) }))}
              className="w-full"
            />
          </div>

          {/* Prep Activities */}
          <div className="mb-4">
            <label className="block text-xs text-white/50 mb-2">What do you need to do before leaving?</label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_PREP.map((activity) => (
                <button
                  key={activity.id}
                  onClick={() => togglePrepActivity(activity.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    calculator.prepActivities.includes(activity.id)
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'bg-white/5 text-white/50 hover:bg-white/10'
                  }`}
                >
                  <span>{activity.icon}</span>
                  <span>{activity.name}</span>
                  <span className="text-xs opacity-70">({activity.duration}m)</span>
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          {leaveTimeCalculation && !leaveTimeCalculation.isPast && (
            <motion.div
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0 }
              })}
              className={`p-4 rounded-xl ${
                leaveTimeCalculation.isUrgent
                  ? 'bg-orange-500/20 border border-orange-500/30'
                  : 'bg-green-500/10 border border-green-500/20'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Travel time:</span>
                  <span className="font-medium">{leaveTimeCalculation.travelMinutes} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Prep time:</span>
                  <span className="font-medium">{leaveTimeCalculation.prepMinutes} min</span>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Start getting ready:</span>
                    <span className="font-medium text-orange-400">
                      {formatTime(leaveTimeCalculation.startPrepTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-white/70">Leave by:</span>
                    <span className="font-bold text-lg">
                      {formatTime(leaveTimeCalculation.leaveTime)}
                    </span>
                  </div>
                </div>

                {leaveTimeCalculation.isUrgent && (
                  <div className="flex items-center gap-2 text-orange-400 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    Only {leaveTimeCalculation.minutesUntilLeave} minutes until you should leave!
                  </div>
                )}
              </div>

              <button
                onClick={saveAppointment}
                className="w-full mt-4 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors"
              >
                <Bell className="w-4 h-4 inline mr-2" />
                Save & Set Reminder
              </button>
            </motion.div>
          )}

          {leaveTimeCalculation?.isPast && (
            <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
              <p className="text-sm text-red-400">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                This appointment time has already passed!
              </p>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-white/5 rounded-xl">
          <p className="text-sm text-white/50">
            <strong className="text-white/70">Time Blindness Tip:</strong> ADHD makes it hard to
            estimate how long things take. This calculator adds buffer time to help you arrive
            on time, not "ADHD on time."
          </p>
        </div>
      </motion.div>
    </div>
  )
}
