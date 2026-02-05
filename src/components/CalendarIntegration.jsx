import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Plus,
  X,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Check,
  Bell,
  Repeat,
  Target,
  Trash2,
  Edit2,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const EVENTS_KEY = 'nero_calendar_events'

// Load events
const loadEvents = () => {
  try {
    const stored = localStorage.getItem(EVENTS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save events
const saveEvents = (events) => {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
}

// Get week dates
const getWeekDates = (date) => {
  const start = new Date(date)
  start.setDate(start.getDate() - start.getDay())
  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    dates.push(d)
  }
  return dates
}

// Format time
const formatTime = (time) => {
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}

// Event colors
const EVENT_COLORS = [
  { id: 'blue', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  { id: 'purple', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  { id: 'green', bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  { id: 'orange', bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  { id: 'pink', bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
  { id: 'red', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
]

export default function CalendarIntegration({ onEventStart }) {
  const prefersReducedMotion = useReducedMotion()
  const [events, setEvents] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [viewMode, setViewMode] = useState('week') // 'week' | 'day'

  // Form state
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    color: 'blue',
    location: '',
    reminder: 15,
    isTimeBlock: false,
  })

  // Load events on mount
  useEffect(() => {
    setEvents(loadEvents())
  }, [])

  // Week dates
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate])

  // Events for selected date
  const dayEvents = useMemo(() => {
    const dateKey = selectedDate.toISOString().split('T')[0]
    return events
      .filter(e => e.date === dateKey)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }, [events, selectedDate])

  // Today's upcoming events
  const upcomingToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    return events
      .filter(e => e.date === today && e.startTime > currentTime)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .slice(0, 3)
  }, [events])

  // Navigate week
  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + (direction * 7))
    setCurrentDate(newDate)
  }

  // Save event
  const saveEvent = () => {
    if (!newEvent.title.trim() || !newEvent.date) return

    let updatedEvents
    if (editingEvent) {
      updatedEvents = events.map(e =>
        e.id === editingEvent.id ? { ...newEvent, id: e.id } : e
      )
    } else {
      const event = {
        ...newEvent,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      }
      updatedEvents = [...events, event]
    }

    setEvents(updatedEvents)
    saveEvents(updatedEvents)
    resetForm()
  }

  // Delete event
  const deleteEvent = (eventId) => {
    const updatedEvents = events.filter(e => e.id !== eventId)
    setEvents(updatedEvents)
    saveEvents(updatedEvents)
  }

  // Reset form
  const resetForm = () => {
    setNewEvent({
      title: '',
      date: selectedDate.toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      color: 'blue',
      location: '',
      reminder: 15,
      isTimeBlock: false,
    })
    setEditingEvent(null)
    setShowAddModal(false)
  }

  // Start editing
  const startEdit = (event) => {
    setEditingEvent(event)
    setNewEvent(event)
    setShowAddModal(true)
  }

  // Open add modal for date
  const openAddForDate = (date) => {
    setSelectedDate(date)
    setNewEvent(prev => ({
      ...prev,
      date: date.toISOString().split('T')[0]
    }))
    setShowAddModal(true)
  }

  // Get color class
  const getColor = (colorId, type) => {
    const color = EVENT_COLORS.find(c => c.id === colorId) || EVENT_COLORS[0]
    return color[type]
  }

  // Check if date is today
  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // Check if date is selected
  const isSelected = (date) => {
    return date.toDateString() === selectedDate.toDateString()
  }

  // Get events count for date
  const getEventsCount = (date) => {
    const dateKey = date.toISOString().split('T')[0]
    return events.filter(e => e.date === dateKey).length
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
            <h2 className="font-display text-xl font-semibold">Calendar</h2>
            <p className="text-sm text-white/50">Time blocking & events</p>
          </div>
          <button
            onClick={() => openAddForDate(selectedDate)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Upcoming Today */}
        {upcomingToday.length > 0 && (
          <div className="mb-4 p-4 glass-card border border-green-500/30">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">Coming up today</span>
            </div>
            <div className="space-y-2">
              {upcomingToday.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
                >
                  <span className="text-sm font-medium">{formatTime(event.startTime)}</span>
                  <span className="text-sm text-white/70">{event.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <p className="font-medium">
              {weekDates[0].toLocaleDateString('en', { month: 'short', day: 'numeric' })} -{' '}
              {weekDates[6].toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <button
            onClick={() => navigateWeek(1)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Week View */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs text-white/50 py-1">
              {day}
            </div>
          ))}

          {weekDates.map((date) => {
            const eventsCount = getEventsCount(date)

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`relative p-2 rounded-lg transition-all ${
                  isSelected(date)
                    ? 'bg-nero-500 text-white'
                    : isToday(date)
                      ? 'bg-white/10 text-white'
                      : 'hover:bg-white/5 text-white/70'
                }`}
              >
                <span className="text-sm">{date.getDate()}</span>
                {eventsCount > 0 && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {Array.from({ length: Math.min(eventsCount, 3) }).map((_, i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-nero-400" />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Selected Date Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">
            {selectedDate.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="text-xs text-nero-400 hover:text-nero-300"
          >
            Today
          </button>
        </div>

        {/* Day Events */}
        <div className="space-y-2">
          {dayEvents.map((event) => (
            <motion.div
              key={event.id}
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0, x: -10 },
                animate: { opacity: 1, x: 0 }
              })}
              className={`glass-card p-3 border-l-4 ${getColor(event.color, 'border').replace('border', 'border-l')}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {event.isTimeBlock && (
                      <Target className="w-4 h-4 text-nero-400" />
                    )}
                    <h4 className="font-medium">{event.title}</h4>
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(event)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-white/50" />
                  </button>
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400/50" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {dayEvents.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-sm text-white/50">No events for this day</p>
              <button
                onClick={() => openAddForDate(selectedDate)}
                className="mt-2 text-sm text-nero-400 hover:text-nero-300"
              >
                Add an event
              </button>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-white/5 rounded-xl">
          <p className="text-sm text-white/50">
            <strong className="text-white/70">Time Blocking tip:</strong> Schedule focus blocks as
            "appointments with yourself." Treat them as seriously as meetings with others.
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
                className="relative w-full max-w-md glass-card p-5 max-h-[90vh] overflow-y-auto"
                {...getMotionProps(prefersReducedMotion, {
                  initial: { y: 100, opacity: 0 },
                  animate: { y: 0, opacity: 1 },
                  exit: { y: 100, opacity: 0 }
                })}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-semibold">
                    {editingEvent ? 'Edit Event' : 'Add Event'}
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
                  <label className="block text-sm text-white/70 mb-2">Event Title *</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Focus Time, Meeting"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                  />
                </div>

                {/* Time Block Toggle */}
                <div className="mb-4">
                  <button
                    onClick={() => setNewEvent(prev => ({ ...prev, isTimeBlock: !prev.isTimeBlock }))}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      newEvent.isTimeBlock
                        ? 'bg-nero-500/20 border border-nero-500/30'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <Target className={`w-5 h-5 ${newEvent.isTimeBlock ? 'text-nero-400' : 'text-white/50'}`} />
                    <span className={newEvent.isTimeBlock ? 'text-nero-400' : 'text-white/70'}>
                      This is a time block for focused work
                    </span>
                  </button>
                </div>

                {/* Date */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Date *</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/20"
                  />
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">End Time</label>
                    <input
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/20"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Location (optional)</label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Home office, Zoom"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                  />
                </div>

                {/* Color */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Color</label>
                  <div className="flex gap-2">
                    {EVENT_COLORS.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setNewEvent(prev => ({ ...prev, color: color.id }))}
                        className={`w-10 h-10 rounded-xl ${color.bg} ${
                          newEvent.color === color.id ? 'ring-2 ring-white ring-offset-2 ring-offset-surface' : ''
                        } transition-all`}
                      />
                    ))}
                  </div>
                </div>

                {/* Reminder */}
                <div className="mb-6">
                  <label className="block text-sm text-white/70 mb-2">Reminder</label>
                  <div className="flex gap-2">
                    {[
                      { value: 0, label: 'None' },
                      { value: 5, label: '5 min' },
                      { value: 15, label: '15 min' },
                      { value: 30, label: '30 min' },
                      { value: 60, label: '1 hour' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setNewEvent(prev => ({ ...prev, reminder: opt.value }))}
                        className={`flex-1 px-2 py-2 rounded-lg text-xs transition-colors ${
                          newEvent.reminder === opt.value
                            ? 'bg-white/10 text-white'
                            : 'bg-white/5 text-white/50 hover:bg-white/10'
                        }`}
                      >
                        {opt.label}
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
                    onClick={saveEvent}
                    disabled={!newEvent.title.trim() || !newEvent.date}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                      newEvent.title.trim() && newEvent.date
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    {editingEvent ? 'Save Changes' : 'Add Event'}
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
