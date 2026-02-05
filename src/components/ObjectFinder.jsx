import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Search,
  Plus,
  X,
  Clock,
  Tag,
  Trash2,
  Edit2,
  Key,
  Wallet,
  Glasses,
  Smartphone,
  Headphones,
  Watch,
  Laptop,
  Book,
  Pill,
  CreditCard,
  Package,
  Star,
  History,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const OBJECTS_KEY = 'nero_object_locations'

// Common object icons
const OBJECT_ICONS = [
  { id: 'key', icon: Key, label: 'Keys' },
  { id: 'wallet', icon: Wallet, label: 'Wallet' },
  { id: 'glasses', icon: Glasses, label: 'Glasses' },
  { id: 'phone', icon: Smartphone, label: 'Phone' },
  { id: 'headphones', icon: Headphones, label: 'Headphones' },
  { id: 'watch', icon: Watch, label: 'Watch' },
  { id: 'laptop', icon: Laptop, label: 'Laptop' },
  { id: 'book', icon: Book, label: 'Book' },
  { id: 'meds', icon: Pill, label: 'Medication' },
  { id: 'card', icon: CreditCard, label: 'Card' },
  { id: 'other', icon: Package, label: 'Other' },
]

// Common locations
const COMMON_LOCATIONS = [
  'On the hook by the door',
  'In my bag/backpack',
  'On the kitchen counter',
  'On my desk',
  'Bedside table',
  'Coat pocket',
  'Coffee table',
  'Bathroom counter',
  'Charging station',
  'Car',
]

// Load objects
const loadObjects = () => {
  try {
    const stored = localStorage.getItem(OBJECTS_KEY)
    return stored ? JSON.parse(stored) : getDefaultObjects()
  } catch {
    return getDefaultObjects()
  }
}

// Default objects
const getDefaultObjects = () => [
  { id: '1', name: 'Keys', icon: 'key', location: 'On the hook by the door', lastUpdated: new Date().toISOString(), pinned: true },
  { id: '2', name: 'Wallet', icon: 'wallet', location: 'In my bag', lastUpdated: new Date().toISOString(), pinned: true },
  { id: '3', name: 'Glasses', icon: 'glasses', location: 'On my desk', lastUpdated: new Date().toISOString(), pinned: false },
]

// Save objects
const saveObjects = (objects) => {
  localStorage.setItem(OBJECTS_KEY, JSON.stringify(objects))
}

export default function ObjectFinder() {
  const prefersReducedMotion = useReducedMotion()
  const [objects, setObjects] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingObject, setEditingObject] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    icon: 'other',
    location: '',
    pinned: false,
  })

  // Load data on mount
  useEffect(() => {
    setObjects(loadObjects())
  }, [])

  // Filtered and sorted objects
  const displayedObjects = useMemo(() => {
    let filtered = objects

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(obj =>
        obj.name.toLowerCase().includes(query) ||
        obj.location.toLowerCase().includes(query)
      )
    }

    // Sort: pinned first, then by last updated
    return filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.lastUpdated) - new Date(a.lastUpdated)
    })
  }, [objects, searchQuery])

  // Recently updated (for quick access)
  const recentlyUpdated = useMemo(() => {
    return [...objects]
      .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
      .slice(0, 3)
  }, [objects])

  // Save object
  const saveObject = () => {
    if (!formData.name.trim() || !formData.location.trim()) return

    let updated
    if (editingObject) {
      updated = objects.map(obj =>
        obj.id === editingObject.id
          ? { ...formData, id: obj.id, lastUpdated: new Date().toISOString() }
          : obj
      )
    } else {
      const newObject = {
        ...formData,
        id: Date.now().toString(),
        lastUpdated: new Date().toISOString(),
      }
      updated = [...objects, newObject]
    }

    setObjects(updated)
    saveObjects(updated)
    resetForm()
  }

  // Delete object
  const deleteObject = (objectId) => {
    const updated = objects.filter(obj => obj.id !== objectId)
    setObjects(updated)
    saveObjects(updated)
  }

  // Toggle pin
  const togglePin = (objectId) => {
    const updated = objects.map(obj =>
      obj.id === objectId
        ? { ...obj, pinned: !obj.pinned, lastUpdated: new Date().toISOString() }
        : obj
    )
    setObjects(updated)
    saveObjects(updated)
  }

  // Update location quickly
  const quickUpdateLocation = (objectId, newLocation) => {
    const updated = objects.map(obj =>
      obj.id === objectId
        ? { ...obj, location: newLocation, lastUpdated: new Date().toISOString() }
        : obj
    )
    setObjects(updated)
    saveObjects(updated)
  }

  // Start editing
  const startEdit = (object) => {
    setEditingObject(object)
    setFormData({
      name: object.name,
      icon: object.icon,
      location: object.location,
      pinned: object.pinned,
    })
    setShowAddModal(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({ name: '', icon: 'other', location: '', pinned: false })
    setEditingObject(null)
    setShowAddModal(false)
  }

  // Get icon component
  const getIcon = (iconId) => {
    return OBJECT_ICONS.find(i => i.id === iconId)?.icon || Package
  }

  // Format time
  const formatTime = (timestamp) => {
    const diff = (Date.now() - new Date(timestamp).getTime()) / 1000 / 60

    if (diff < 1) return 'Just now'
    if (diff < 60) return `${Math.floor(diff)}m ago`
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
    return `${Math.floor(diff / 1440)}d ago`
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
            <h2 className="font-display text-xl font-semibold">Object Finder</h2>
            <p className="text-sm text-white/50">Remember where you put things</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Where did I put my..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
          />
        </div>

        {/* Quick Access (Pinned) */}
        {!searchQuery && objects.filter(o => o.pinned).length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-white/70 mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              Quick Access
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {objects.filter(o => o.pinned).map((obj) => {
                const Icon = getIcon(obj.icon)

                return (
                  <button
                    key={obj.id}
                    onClick={() => startEdit(obj)}
                    className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-amber-400" />
                      <span className="font-medium text-sm">{obj.name}</span>
                    </div>
                    <p className="text-xs text-white/50 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {obj.location}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* All Objects */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-white/70 mb-2">All Items</h3>

          {displayedObjects.map((obj) => {
            const Icon = getIcon(obj.icon)

            return (
              <motion.div
                key={obj.id}
                {...getMotionProps(prefersReducedMotion, {
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 }
                })}
                className="glass-card p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{obj.name}</h3>
                      {obj.pinned && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                    </div>

                    <div className="flex items-center gap-1 mt-1 text-sm text-white/70">
                      <MapPin className="w-3 h-3 text-white/50" />
                      {obj.location}
                    </div>

                    <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Updated {formatTime(obj.lastUpdated)}
                    </p>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => togglePin(obj.id)}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <Star className={`w-4 h-4 ${obj.pinned ? 'text-amber-400 fill-amber-400' : 'text-white/30'}`} />
                    </button>
                    <button
                      onClick={() => startEdit(obj)}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-white/50" />
                    </button>
                    <button
                      onClick={() => deleteObject(obj.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400/50" />
                    </button>
                  </div>
                </div>

                {/* Quick location update */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {COMMON_LOCATIONS.slice(0, 4).map((loc) => (
                    <button
                      key={loc}
                      onClick={() => quickUpdateLocation(obj.id, loc)}
                      className={`px-2 py-1 rounded-lg text-xs transition-colors ${
                        obj.location === loc
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-white/5 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </motion.div>
            )
          })}

          {displayedObjects.length === 0 && (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/50">
                {searchQuery ? 'No items found' : 'No items tracked yet'}
              </p>
              <p className="text-sm text-white/30 mt-1">
                Add items you often misplace
              </p>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-white/5 rounded-xl">
          <p className="text-sm text-white/50">
            <strong className="text-white/70">Tip:</strong> Update locations as soon as you put
            something down. Future you will thank present you!
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
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={resetForm} />

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
                    {editingObject ? 'Update Location' : 'Add Item'}
                  </h3>
                  <button onClick={resetForm} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Icon Selection */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Item Type</label>
                  <div className="grid grid-cols-6 gap-2">
                    {OBJECT_ICONS.map((item) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={item.id}
                          onClick={() => setFormData(prev => ({ ...prev, icon: item.id }))}
                          className={`p-3 rounded-xl transition-all ${
                            formData.icon === item.id
                              ? 'bg-amber-500/20 ring-2 ring-amber-500'
                              : 'bg-white/5 hover:bg-white/10'
                          }`}
                          title={item.label}
                        >
                          <Icon className={`w-5 h-5 mx-auto ${
                            formData.icon === item.id ? 'text-amber-400' : 'text-white/50'
                          }`} />
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Name */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Car keys, Blue notebook"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                  />
                </div>

                {/* Location */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Where did you put it?"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                  />

                  {/* Quick location buttons */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {COMMON_LOCATIONS.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => setFormData(prev => ({ ...prev, location: loc }))}
                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/50 transition-colors"
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pin to Quick Access */}
                <button
                  onClick={() => setFormData(prev => ({ ...prev, pinned: !prev.pinned }))}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl mb-6 transition-colors ${
                    formData.pinned
                      ? 'bg-amber-500/20 border border-amber-500/30'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Star className={`w-5 h-5 ${formData.pinned ? 'text-amber-400 fill-amber-400' : 'text-white/50'}`} />
                  <span className={formData.pinned ? 'text-amber-400' : 'text-white/70'}>
                    Pin to Quick Access
                  </span>
                </button>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={resetForm}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveObject}
                    disabled={!formData.name.trim() || !formData.location.trim()}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                      formData.name.trim() && formData.location.trim()
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    {editingObject ? 'Update' : 'Add Item'}
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
