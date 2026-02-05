import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  Plus,
  X,
  Bell,
  BellOff,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Calendar,
  Mail,
  Package,
  Phone,
  FileText,
  HelpCircle,
  Trash2,
  Edit2,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const WAITING_KEY = 'nero_waiting_items'

// Waiting item categories
const WAITING_CATEGORIES = [
  { id: 'email', label: 'Email Response', icon: Mail, color: 'blue' },
  { id: 'package', label: 'Package/Delivery', icon: Package, color: 'orange' },
  { id: 'callback', label: 'Phone Call', icon: Phone, color: 'green' },
  { id: 'document', label: 'Document/Form', icon: FileText, color: 'purple' },
  { id: 'approval', label: 'Approval', icon: CheckCircle, color: 'yellow' },
  { id: 'event', label: 'Event/Appointment', icon: Calendar, color: 'pink' },
  { id: 'other', label: 'Other', icon: HelpCircle, color: 'gray' },
]

// Load waiting items
const loadWaitingItems = () => {
  try {
    const stored = localStorage.getItem(WAITING_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save waiting items
const saveWaitingItems = (items) => {
  localStorage.setItem(WAITING_KEY, JSON.stringify(items))
}

// Calculate days waiting
const getDaysWaiting = (createdAt) => {
  const created = new Date(createdAt)
  const now = new Date()
  const diff = Math.floor((now - created) / (1000 * 60 * 60 * 24))
  return diff
}

// Format relative time
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = date - now
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  if (days < 0) return 'Overdue'
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days <= 7) return `${days} days`
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

export default function WaitingMode({ onItemResolved }) {
  const prefersReducedMotion = useReducedMotion()
  const [items, setItems] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [filter, setFilter] = useState('active') // 'active' | 'resolved' | 'all'

  // Form state
  const [newItem, setNewItem] = useState({
    title: '',
    category: 'email',
    description: '',
    expectedBy: '',
    reminder: true,
    link: '',
  })

  // Load data on mount
  useEffect(() => {
    setItems(loadWaitingItems())
  }, [])

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (filter === 'active') return !item.resolved
      if (filter === 'resolved') return item.resolved
      return true
    }).sort((a, b) => {
      // Sort by expected date, then by created date
      if (a.expectedBy && b.expectedBy) {
        return new Date(a.expectedBy) - new Date(b.expectedBy)
      }
      if (a.expectedBy) return -1
      if (b.expectedBy) return 1
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
  }, [items, filter])

  // Get urgency level
  const getUrgency = (item) => {
    if (!item.expectedBy) return 'normal'
    const days = Math.ceil((new Date(item.expectedBy) - new Date()) / (1000 * 60 * 60 * 24))
    if (days < 0) return 'overdue'
    if (days <= 1) return 'urgent'
    if (days <= 3) return 'soon'
    return 'normal'
  }

  // Add or update item
  const saveItem = () => {
    if (!newItem.title.trim()) return

    let updatedItems
    if (editingItem) {
      updatedItems = items.map(item =>
        item.id === editingItem.id ? { ...newItem, id: item.id, createdAt: item.createdAt } : item
      )
    } else {
      const item = {
        ...newItem,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        resolved: false,
        resolvedAt: null,
      }
      updatedItems = [item, ...items]
    }

    setItems(updatedItems)
    saveWaitingItems(updatedItems)
    resetForm()
  }

  // Resolve item
  const resolveItem = (itemId) => {
    const updatedItems = items.map(item =>
      item.id === itemId
        ? { ...item, resolved: true, resolvedAt: new Date().toISOString() }
        : item
    )
    setItems(updatedItems)
    saveWaitingItems(updatedItems)

    const resolved = items.find(i => i.id === itemId)
    onItemResolved?.(resolved)
  }

  // Unresolve item
  const unresolveItem = (itemId) => {
    const updatedItems = items.map(item =>
      item.id === itemId
        ? { ...item, resolved: false, resolvedAt: null }
        : item
    )
    setItems(updatedItems)
    saveWaitingItems(updatedItems)
  }

  // Delete item
  const deleteItem = (itemId) => {
    const updatedItems = items.filter(item => item.id !== itemId)
    setItems(updatedItems)
    saveWaitingItems(updatedItems)
  }

  // Reset form
  const resetForm = () => {
    setNewItem({
      title: '',
      category: 'email',
      description: '',
      expectedBy: '',
      reminder: true,
      link: '',
    })
    setEditingItem(null)
    setShowAddModal(false)
  }

  // Start editing
  const startEdit = (item) => {
    setEditingItem(item)
    setNewItem(item)
    setShowAddModal(true)
  }

  // Get category info
  const getCategoryInfo = (categoryId) => {
    return WAITING_CATEGORIES.find(c => c.id === categoryId) || WAITING_CATEGORIES[6]
  }

  // Stats
  const stats = useMemo(() => {
    const active = items.filter(i => !i.resolved).length
    const resolved = items.filter(i => i.resolved).length
    const overdue = items.filter(i => !i.resolved && getUrgency(i) === 'overdue').length
    return { active, resolved, overdue }
  }, [items])

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
            <h2 className="font-display text-xl font-semibold">Waiting Mode</h2>
            <p className="text-sm text-white/50">Track what you're waiting for</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Stats */}
        {items.length > 0 && (
          <div className="glass-card p-4 mb-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-400">{stats.active}</p>
                <p className="text-xs text-white/50">Waiting</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{stats.resolved}</p>
                <p className="text-xs text-white/50">Resolved</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${stats.overdue > 0 ? 'text-red-400' : 'text-white/30'}`}>
                  {stats.overdue}
                </p>
                <p className="text-xs text-white/50">Overdue</p>
              </div>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'active', label: 'Active' },
            { id: 'resolved', label: 'Resolved' },
            { id: 'all', label: 'All' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                filter === tab.id
                  ? 'bg-white/10 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Items list */}
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const category = getCategoryInfo(item.category)
            const urgency = getUrgency(item)
            const daysWaiting = getDaysWaiting(item.createdAt)
            const Icon = category.icon

            return (
              <motion.div
                key={item.id}
                {...getMotionProps(prefersReducedMotion, {
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 }
                })}
                className={`glass-card p-4 ${
                  item.resolved
                    ? 'opacity-60'
                    : urgency === 'overdue'
                      ? 'border border-red-500/30'
                      : urgency === 'urgent'
                        ? 'border border-orange-500/30'
                        : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-${category.color}-500/20 flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 text-${category.color}-400`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-medium ${item.resolved ? 'line-through text-white/50' : ''}`}>
                        {item.title}
                      </h3>
                      <div className="flex gap-1 flex-shrink-0">
                        {!item.resolved && (
                          <button
                            onClick={() => resolveItem(item.id)}
                            className="p-1.5 rounded-lg hover:bg-green-500/20 transition-colors"
                            title="Mark as resolved"
                          >
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          </button>
                        )}
                        {item.resolved && (
                          <button
                            onClick={() => unresolveItem(item.id)}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                            title="Mark as waiting"
                          >
                            <RefreshCw className="w-4 h-4 text-white/50" />
                          </button>
                        )}
                        <button
                          onClick={() => startEdit(item)}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-white/50" />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400/50" />
                        </button>
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-sm text-white/50 mt-1">{item.description}</p>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="text-white/40">
                        {daysWaiting === 0 ? 'Added today' : `${daysWaiting}d waiting`}
                      </span>

                      {item.expectedBy && !item.resolved && (
                        <span className={`flex items-center gap-1 ${
                          urgency === 'overdue' ? 'text-red-400' :
                          urgency === 'urgent' ? 'text-orange-400' :
                          'text-white/50'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(item.expectedBy)}
                        </span>
                      )}

                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Link
                        </a>
                      )}

                      {item.reminder && !item.resolved && (
                        <span className="flex items-center gap-1 text-white/40">
                          <Bell className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Empty state */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">
              {filter === 'active' ? 'Nothing to wait for!' :
               filter === 'resolved' ? 'No resolved items yet' :
               'No items yet'}
            </p>
            <p className="text-sm text-white/30 mt-1">
              Track emails, packages, callbacks, and more
            </p>
          </div>
        )}

        {/* ADHD tip */}
        <div className="mt-6 p-4 bg-white/5 rounded-xl">
          <p className="text-sm text-white/50">
            <strong className="text-white/70">ADHD tip:</strong> Stop the mental loop of "did they reply yet?"
            by putting it here. Your brain can let go because Nero is tracking it for you.
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
                    {editingItem ? 'Edit Item' : 'Add Waiting Item'}
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
                  <label className="block text-sm text-white/70 mb-2">What are you waiting for? *</label>
                  <input
                    type="text"
                    value={newItem.title}
                    onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Email from client, Package delivery"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                  />
                </div>

                {/* Category */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Category</label>
                  <div className="grid grid-cols-4 gap-2">
                    {WAITING_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setNewItem(prev => ({ ...prev, category: cat.id }))}
                        className={`p-3 rounded-xl transition-all ${
                          newItem.category === cat.id
                            ? `bg-${cat.color}-500/20 border border-${cat.color}-500/30`
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <cat.icon className={`w-5 h-5 mx-auto mb-1 ${
                          newItem.category === cat.id ? `text-${cat.color}-400` : 'text-white/50'
                        }`} />
                        <span className="text-xs">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Details (optional)</label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Any extra context..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 resize-none"
                    rows={2}
                  />
                </div>

                {/* Expected by */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Expected by (optional)</label>
                  <input
                    type="date"
                    value={newItem.expectedBy}
                    onChange={(e) => setNewItem(prev => ({ ...prev, expectedBy: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/20"
                  />
                </div>

                {/* Link */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Related link (optional)</label>
                  <input
                    type="url"
                    value={newItem.link}
                    onChange={(e) => setNewItem(prev => ({ ...prev, link: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                  />
                </div>

                {/* Reminder toggle */}
                <div className="mb-6">
                  <button
                    onClick={() => setNewItem(prev => ({ ...prev, reminder: !prev.reminder }))}
                    className={`flex items-center gap-3 w-full p-3 rounded-xl transition-colors ${
                      newItem.reminder ? 'bg-cyan-500/20' : 'bg-white/5'
                    }`}
                  >
                    {newItem.reminder ? (
                      <Bell className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <BellOff className="w-5 h-5 text-white/50" />
                    )}
                    <span className={newItem.reminder ? 'text-cyan-400' : 'text-white/50'}>
                      Remind me about this
                    </span>
                  </button>
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
                    onClick={saveItem}
                    disabled={!newItem.title.trim()}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                      newItem.title.trim()
                        ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    {editingItem ? 'Save Changes' : 'Add Item'}
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
