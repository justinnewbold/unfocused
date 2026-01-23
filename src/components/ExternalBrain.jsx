import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Plus,
  Search,
  Pin,
  PinOff,
  Trash2,
  Edit3,
  Save,
  X,
  Tag,
  MapPin,
  Briefcase,
  Home,
  Heart,
  HelpCircle,
  Clock,
  Star,
  Filter,
  FolderOpen,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const STORAGE_KEY = 'nero_external_brain'

// Categories
const CATEGORIES = [
  { id: 'all', label: 'All', icon: FolderOpen, color: 'white' },
  { id: 'work', label: 'Work', icon: Briefcase, color: 'blue' },
  { id: 'home', label: 'Home', icon: Home, color: 'green' },
  { id: 'health', label: 'Health', icon: Heart, color: 'red' },
  { id: 'locations', label: 'Where I Put...', icon: MapPin, color: 'purple' },
  { id: 'reference', label: 'Reference', icon: HelpCircle, color: 'amber' },
]

// Get notes from storage
const getNotes = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (e) {
    return []
  }
}

// Save notes
const saveNotes = (notes) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  } catch (e) {
    console.error('Failed to save notes:', e)
  }
}

// Note Editor Modal
function NoteEditor({ note, onSave, onCancel }) {
  const prefersReducedMotion = useReducedMotion()
  const [form, setForm] = useState(note || {
    id: Date.now().toString(),
    title: '',
    content: '',
    category: 'reference',
    isPinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  const handleSave = () => {
    if (!form.title.trim() && !form.content.trim()) return
    onSave({
      ...form,
      title: form.title.trim() || 'Untitled',
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        {...getMotionProps(prefersReducedMotion, {
          initial: { opacity: 0, scale: 0.95, y: 20 },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.95, y: 20 },
        })}
        className="bg-surface rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg">
            {note ? 'Edit Note' : 'New Note'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm text-white/70">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., WiFi Password, Parking Spot"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-nero-500/50"
              autoFocus
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-sm text-white/70">Content</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write anything you need to remember..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-nero-500/50 resize-none"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm text-white/70">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter(c => c.id !== 'all').map((cat) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.id}
                    onClick={() => setForm(prev => ({ ...prev, category: cat.id }))}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      form.category === cat.id
                        ? 'bg-nero-500 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Pin toggle */}
          <button
            onClick={() => setForm(prev => ({ ...prev, isPinned: !prev.isPinned }))}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              form.isPinned
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {form.isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
            {form.isPinned ? 'Pinned to top' : 'Pin this note'}
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.title.trim() && !form.content.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-nero-500 hover:bg-nero-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Main External Brain Component
export default function ExternalBrain({ onSearchResult }) {
  const prefersReducedMotion = useReducedMotion()
  const [notes, setNotes] = useState(getNotes)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [editingNote, setEditingNote] = useState(null)
  const [showEditor, setShowEditor] = useState(false)

  // Save notes when changed
  useEffect(() => {
    saveNotes(notes)
  }, [notes])

  // Filtered notes
  const filteredNotes = useMemo(() => {
    let filtered = notes

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(n => n.category === selectedCategory)
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query)
      )
    }

    // Sort: pinned first, then by updated date
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.updatedAt) - new Date(a.updatedAt)
    })
  }, [notes, selectedCategory, searchQuery])

  const handleSaveNote = (note) => {
    setNotes(prev => {
      const existing = prev.findIndex(n => n.id === note.id)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = note
        return updated
      }
      return [note, ...prev]
    })
    setShowEditor(false)
    setEditingNote(null)
  }

  const handleDeleteNote = (noteId) => {
    setNotes(prev => prev.filter(n => n.id !== noteId))
  }

  const handleTogglePin = (noteId) => {
    setNotes(prev => prev.map(n =>
      n.id === noteId ? { ...n, isPinned: !n.isPinned } : n
    ))
  }

  const handleEditNote = (note) => {
    setEditingNote(note)
    setShowEditor(true)
  }

  const handleCreateNote = () => {
    setEditingNote(null)
    setShowEditor(true)
  }

  // Get category info
  const getCategoryInfo = (categoryId) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0]
  }

  // Format relative time
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="p-4 h-full overflow-auto">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-400 text-sm mb-3">
            <Brain className="w-4 h-4" />
            <span>External Brain</span>
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Your Second Brain</h1>
          <p className="text-white/60">Store everything you need to remember</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, locations, references..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-nero-500/50"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const count = cat.id === 'all'
              ? notes.length
              : notes.filter(n => n.category === cat.id).length

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-nero-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.label}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    selectedCategory === cat.id ? 'bg-white/20' : 'bg-white/10'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Notes List */}
        <div className="space-y-3">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/50">
                {searchQuery ? 'No notes match your search' : 'No notes yet'}
              </p>
              <button
                onClick={handleCreateNote}
                className="mt-4 px-4 py-2 bg-nero-500 hover:bg-nero-600 rounded-xl text-sm font-medium transition-colors"
              >
                Create your first note
              </button>
            </div>
          ) : (
            filteredNotes.map((note, index) => {
              const category = getCategoryInfo(note.category)
              const Icon = category.icon

              return (
                <motion.div
                  key={note.id}
                  {...getMotionProps(prefersReducedMotion, {
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                    transition: { delay: index * 0.03 },
                  })}
                  className={`group relative bg-white/5 rounded-xl p-4 border transition-all ${
                    note.isPinned
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Pin indicator */}
                  {note.isPinned && (
                    <div className="absolute -top-2 -right-2">
                      <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                        <Pin className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    {/* Category icon */}
                    <div className={`w-10 h-10 rounded-xl bg-${category.color}-500/20 flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 text-${category.color}-400`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{note.title}</h3>
                      {note.content && (
                        <p className="text-sm text-white/60 mt-1 line-clamp-2">
                          {note.content}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-white/40">
                        <Clock className="w-3 h-3" />
                        <span>{formatRelativeTime(note.updatedAt)}</span>
                        <span className="px-1.5 py-0.5 bg-white/10 rounded">
                          {category.label}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleTogglePin(note.id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        title={note.isPinned ? 'Unpin' : 'Pin'}
                      >
                        {note.isPinned ? (
                          <PinOff className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Pin className="w-4 h-4 text-white/50" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEditNote(note)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4 text-white/50" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-400/70" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>

        {/* Add Note Button */}
        <button
          onClick={handleCreateNote}
          className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-white/20 rounded-xl text-white/60 hover:text-white/80 hover:border-white/30 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Note</span>
        </button>

        {/* Quick Add Templates */}
        <div className="space-y-2">
          <p className="text-sm text-white/50">Quick add:</p>
          <div className="flex flex-wrap gap-2">
            {[
              { title: 'Where I put...', category: 'locations' },
              { title: 'Password hint for...', category: 'reference' },
              { title: 'How to...', category: 'reference' },
              { title: 'Remember to...', category: 'work' },
            ].map((template) => (
              <button
                key={template.title}
                onClick={() => {
                  setEditingNote({
                    id: Date.now().toString(),
                    title: template.title,
                    content: '',
                    category: template.category,
                    isPinned: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  })
                  setShowEditor(true)
                }}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/60 hover:text-white/80 transition-colors"
              >
                + {template.title}
              </button>
            ))}
          </div>
        </div>

        {/* Tip */}
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-sm text-white/60">
            <Star className="w-4 h-4 inline mr-1 text-amber-400" />
            <span className="text-amber-400 font-medium">Pro tip:</span> Use "Where I put..." for physical items
            you often lose. Your future self will thank you!
          </p>
        </div>
      </div>

      {/* Note Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <NoteEditor
            note={editingNote}
            onSave={handleSaveNote}
            onCancel={() => {
              setShowEditor(false)
              setEditingNote(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
