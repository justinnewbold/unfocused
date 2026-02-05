import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Plus,
  X,
  Home,
  Building2,
  Coffee,
  Library,
  Plane,
  Car,
  Wifi,
  WifiOff,
  Moon,
  Sun,
  Headphones,
  Volume2,
  VolumeX,
  Settings,
  Trash2,
  Check,
  RefreshCw,
  Zap,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage keys
const LOCATIONS_KEY = 'nero_locations'
const CURRENT_LOCATION_KEY = 'nero_current_location'

// Pre-defined location types
const LOCATION_TYPES = [
  { id: 'home', name: 'Home', icon: Home, color: 'blue' },
  { id: 'office', name: 'Office', icon: Building2, color: 'purple' },
  { id: 'cafe', name: 'Café', icon: Coffee, color: 'orange' },
  { id: 'library', name: 'Library', icon: Library, color: 'green' },
  { id: 'transit', name: 'Transit', icon: Car, color: 'yellow' },
  { id: 'travel', name: 'Travel', icon: Plane, color: 'cyan' },
]

// Default context settings for each location
const DEFAULT_CONTEXTS = {
  home: {
    soundEnabled: true,
    soundType: 'rain',
    distractionBlockingEnabled: false,
    focusDuration: 25,
    breakDuration: 5,
    notifications: 'normal',
  },
  office: {
    soundEnabled: false,
    soundType: 'white_noise',
    distractionBlockingEnabled: true,
    focusDuration: 50,
    breakDuration: 10,
    notifications: 'minimal',
  },
  cafe: {
    soundEnabled: true,
    soundType: 'cafe',
    distractionBlockingEnabled: true,
    focusDuration: 25,
    breakDuration: 5,
    notifications: 'minimal',
  },
  library: {
    soundEnabled: false,
    soundType: 'none',
    distractionBlockingEnabled: true,
    focusDuration: 50,
    breakDuration: 10,
    notifications: 'silent',
  },
  transit: {
    soundEnabled: true,
    soundType: 'white_noise',
    distractionBlockingEnabled: false,
    focusDuration: 15,
    breakDuration: 5,
    notifications: 'normal',
  },
  travel: {
    soundEnabled: true,
    soundType: 'brown_noise',
    distractionBlockingEnabled: false,
    focusDuration: 15,
    breakDuration: 5,
    notifications: 'normal',
  },
}

// Sound options
const SOUND_OPTIONS = [
  { id: 'none', name: 'None', icon: VolumeX },
  { id: 'white_noise', name: 'White Noise', icon: Volume2 },
  { id: 'brown_noise', name: 'Brown Noise', icon: Volume2 },
  { id: 'rain', name: 'Rain', icon: Volume2 },
  { id: 'cafe', name: 'Café Ambience', icon: Coffee },
]

// Load locations
const loadLocations = () => {
  try {
    const stored = localStorage.getItem(LOCATIONS_KEY)
    if (stored) return JSON.parse(stored)

    // Initialize with default locations
    const defaults = LOCATION_TYPES.map(type => ({
      id: type.id,
      name: type.name,
      type: type.id,
      context: DEFAULT_CONTEXTS[type.id],
      isDefault: true,
    }))
    saveLocations(defaults)
    return defaults
  } catch {
    return []
  }
}

// Save locations
const saveLocations = (locations) => {
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations))
}

// Load current location
const loadCurrentLocation = () => {
  try {
    const stored = localStorage.getItem(CURRENT_LOCATION_KEY)
    return stored || 'home'
  } catch {
    return 'home'
  }
}

// Save current location
const saveCurrentLocation = (locationId) => {
  localStorage.setItem(CURRENT_LOCATION_KEY, locationId)
}

export default function LocationContext({ onContextChange }) {
  const prefersReducedMotion = useReducedMotion()
  const [locations, setLocations] = useState([])
  const [currentLocationId, setCurrentLocationId] = useState('home')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingLocation, setEditingLocation] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  // Load data on mount
  useEffect(() => {
    setLocations(loadLocations())
    setCurrentLocationId(loadCurrentLocation())
  }, [])

  // Current location data
  const currentLocation = useMemo(() => {
    return locations.find(l => l.id === currentLocationId) || locations[0]
  }, [locations, currentLocationId])

  // Change location
  const changeLocation = (locationId) => {
    setCurrentLocationId(locationId)
    saveCurrentLocation(locationId)

    const location = locations.find(l => l.id === locationId)
    if (location) {
      onContextChange?.(location.context)
    }
  }

  // Update location context
  const updateLocationContext = (locationId, contextUpdates) => {
    const updated = locations.map(l =>
      l.id === locationId
        ? { ...l, context: { ...l.context, ...contextUpdates } }
        : l
    )
    setLocations(updated)
    saveLocations(updated)

    // If this is the current location, notify parent
    if (locationId === currentLocationId) {
      const location = updated.find(l => l.id === locationId)
      onContextChange?.(location.context)
    }
  }

  // Add custom location
  const addLocation = (newLocation) => {
    const location = {
      ...newLocation,
      id: Date.now().toString(),
      context: DEFAULT_CONTEXTS[newLocation.type] || DEFAULT_CONTEXTS.home,
      isDefault: false,
    }
    const updated = [...locations, location]
    setLocations(updated)
    saveLocations(updated)
    setShowAddModal(false)
  }

  // Delete location
  const deleteLocation = (locationId) => {
    const location = locations.find(l => l.id === locationId)
    if (location?.isDefault) return // Can't delete default locations

    const updated = locations.filter(l => l.id !== locationId)
    setLocations(updated)
    saveLocations(updated)

    if (currentLocationId === locationId) {
      changeLocation('home')
    }
  }

  // Get icon for location type
  const getLocationIcon = (typeId) => {
    const type = LOCATION_TYPES.find(t => t.id === typeId)
    return type?.icon || MapPin
  }

  // Get color for location type
  const getLocationColor = (typeId) => {
    const type = LOCATION_TYPES.find(t => t.id === typeId)
    return type?.color || 'gray'
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
            <h2 className="font-display text-xl font-semibold">Location Context</h2>
            <p className="text-sm text-white/50">Auto-adjust settings by location</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Current Location Card */}
        {currentLocation && (
          <motion.div
            {...getMotionProps(prefersReducedMotion, {
              initial: { opacity: 0, scale: 0.95 },
              animate: { opacity: 1, scale: 1 }
            })}
            className="mb-6 p-4 glass-card border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-${getLocationColor(currentLocation.type)}-500/20 flex items-center justify-center`}>
                  {React.createElement(getLocationIcon(currentLocation.type), {
                    className: `w-6 h-6 text-${getLocationColor(currentLocation.type)}-400`
                  })}
                </div>
                <div>
                  <p className="font-medium">{currentLocation.name}</p>
                  <p className="text-sm text-white/50">Current location</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingLocation(currentLocation)
                  setShowSettings(true)
                }}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Settings className="w-5 h-5 text-white/50" />
              </button>
            </div>

            {/* Current Context Summary */}
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 text-xs">
                <Zap className="w-3 h-3" />
                {currentLocation.context.focusDuration}m focus
              </span>
              {currentLocation.context.soundEnabled && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 text-xs">
                  <Volume2 className="w-3 h-3" />
                  {SOUND_OPTIONS.find(s => s.id === currentLocation.context.soundType)?.name}
                </span>
              )}
              {currentLocation.context.distractionBlockingEnabled && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs">
                  Blocking on
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Location Selector */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-white/70 mb-3">Switch Location</h3>
          <div className="grid grid-cols-3 gap-2">
            {locations.map((location) => {
              const Icon = getLocationIcon(location.type)
              const color = getLocationColor(location.type)
              const isActive = location.id === currentLocationId

              return (
                <button
                  key={location.id}
                  onClick={() => changeLocation(location.id)}
                  className={`relative p-3 rounded-xl transition-all ${
                    isActive
                      ? `bg-${color}-500/20 border border-${color}-500/30`
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-1 text-${color}-400`} />
                  <p className="text-xs text-center truncate">{location.name}</p>

                  {isActive && (
                    <div className="absolute top-1 right-1">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* All Locations List */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-white/70 mb-2">All Locations</h3>

          {locations.map((location) => {
            const Icon = getLocationIcon(location.type)
            const color = getLocationColor(location.type)

            return (
              <div
                key={location.id}
                className="glass-card p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 text-${color}-400`} />
                    </div>
                    <div>
                      <p className="font-medium">{location.name}</p>
                      <p className="text-xs text-white/50">
                        {location.context.focusDuration}m focus •{' '}
                        {location.context.distractionBlockingEnabled ? 'Blocking' : 'Open'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingLocation(location)
                        setShowSettings(true)
                      }}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-white/50" />
                    </button>
                    {!location.isDefault && (
                      <button
                        onClick={() => deleteLocation(location.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400/50" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Tip */}
        <div className="mt-6 p-4 bg-white/5 rounded-xl">
          <p className="text-sm text-white/50">
            <strong className="text-white/70">Tip:</strong> Change your location when you
            move to automatically adjust your focus settings, sounds, and distraction blocking.
          </p>
        </div>

        {/* Add Location Modal */}
        <AnimatePresence>
          {showAddModal && (
            <AddLocationModal
              prefersReducedMotion={prefersReducedMotion}
              onClose={() => setShowAddModal(false)}
              onSave={addLocation}
              locationTypes={LOCATION_TYPES}
            />
          )}
        </AnimatePresence>

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && editingLocation && (
            <LocationSettingsModal
              prefersReducedMotion={prefersReducedMotion}
              location={editingLocation}
              onClose={() => {
                setShowSettings(false)
                setEditingLocation(null)
              }}
              onSave={(updates) => {
                updateLocationContext(editingLocation.id, updates)
                setShowSettings(false)
                setEditingLocation(null)
              }}
              soundOptions={SOUND_OPTIONS}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// Add Location Modal
function AddLocationModal({ prefersReducedMotion, onClose, onSave, locationTypes }) {
  const [newLocation, setNewLocation] = useState({
    name: '',
    type: 'home',
  })

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      {...getMotionProps(prefersReducedMotion, {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
      })}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative w-full max-w-md glass-card p-5"
        {...getMotionProps(prefersReducedMotion, {
          initial: { y: 100, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: 100, opacity: 0 }
        })}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold">Add Location</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm text-white/70 mb-2">Name</label>
          <input
            type="text"
            value={newLocation.name}
            onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., My Favorite Café"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
          />
        </div>

        {/* Type */}
        <div className="mb-6">
          <label className="block text-sm text-white/70 mb-2">Type</label>
          <div className="grid grid-cols-3 gap-2">
            {locationTypes.map((type) => {
              const Icon = type.icon

              return (
                <button
                  key={type.id}
                  onClick={() => setNewLocation(prev => ({ ...prev, type: type.id }))}
                  className={`p-3 rounded-xl transition-all ${
                    newLocation.type === type.id
                      ? `bg-${type.color}-500/20 border border-${type.color}-500/30`
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 text-${type.color}-400`} />
                  <p className="text-xs text-center">{type.name}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(newLocation)}
            disabled={!newLocation.name.trim()}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
              newLocation.name.trim()
                ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            Add Location
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Location Settings Modal
function LocationSettingsModal({ prefersReducedMotion, location, onClose, onSave, soundOptions }) {
  const [context, setContext] = useState(location.context)

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      {...getMotionProps(prefersReducedMotion, {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
      })}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative w-full max-w-md glass-card p-5 max-h-[90vh] overflow-y-auto"
        {...getMotionProps(prefersReducedMotion, {
          initial: { y: 100, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: 100, opacity: 0 }
        })}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold">{location.name} Settings</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Focus Duration */}
        <div className="mb-4">
          <label className="block text-sm text-white/70 mb-2">
            Focus Duration: {context.focusDuration} min
          </label>
          <input
            type="range"
            min="15"
            max="90"
            step="5"
            value={context.focusDuration}
            onChange={(e) => setContext(prev => ({ ...prev, focusDuration: parseInt(e.target.value) }))}
            className="w-full"
          />
        </div>

        {/* Break Duration */}
        <div className="mb-4">
          <label className="block text-sm text-white/70 mb-2">
            Break Duration: {context.breakDuration} min
          </label>
          <input
            type="range"
            min="5"
            max="20"
            step="5"
            value={context.breakDuration}
            onChange={(e) => setContext(prev => ({ ...prev, breakDuration: parseInt(e.target.value) }))}
            className="w-full"
          />
        </div>

        {/* Sound */}
        <div className="mb-4">
          <label className="block text-sm text-white/70 mb-2">Ambient Sound</label>
          <div className="flex flex-wrap gap-2">
            {soundOptions.map((sound) => (
              <button
                key={sound.id}
                onClick={() => setContext(prev => ({
                  ...prev,
                  soundEnabled: sound.id !== 'none',
                  soundType: sound.id
                }))}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  context.soundType === sound.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {sound.name}
              </button>
            ))}
          </div>
        </div>

        {/* Distraction Blocking */}
        <div className="mb-4">
          <button
            onClick={() => setContext(prev => ({
              ...prev,
              distractionBlockingEnabled: !prev.distractionBlockingEnabled
            }))}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
              context.distractionBlockingEnabled
                ? 'bg-red-500/20 border border-red-500/30'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <span className={context.distractionBlockingEnabled ? 'text-red-400' : 'text-white/70'}>
              Distraction Blocking
            </span>
            <div className={`w-12 h-6 rounded-full relative transition-colors ${
              context.distractionBlockingEnabled ? 'bg-red-500' : 'bg-white/20'
            }`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                context.distractionBlockingEnabled ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </div>
          </button>
        </div>

        {/* Notifications */}
        <div className="mb-6">
          <label className="block text-sm text-white/70 mb-2">Notification Level</label>
          <div className="flex gap-2">
            {[
              { id: 'normal', label: 'Normal' },
              { id: 'minimal', label: 'Minimal' },
              { id: 'silent', label: 'Silent' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setContext(prev => ({ ...prev, notifications: opt.id }))}
                className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                  context.notifications === opt.id
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
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(context)}
            className="flex-1 px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition-colors"
          >
            Save Settings
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
