import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Plus,
  X,
  Search,
  Copy,
  Star,
  StarOff,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  FolderOpen,
  Code,
  Mail,
  FileSpreadsheet,
  Presentation,
  ShoppingCart,
  Home,
  Heart,
  Briefcase,
  GraduationCap,
  Dumbbell,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const TEMPLATES_KEY = 'nero_task_templates'
const FAVORITES_KEY = 'nero_favorite_templates'

// Pre-built templates
const BUILT_IN_TEMPLATES = [
  {
    id: 'email-response',
    name: 'Respond to Email',
    category: 'work',
    icon: 'Mail',
    steps: [
      'Open the email and read it fully',
      'Identify the main request or question',
      'Draft key points to address',
      'Write the response',
      'Review for tone and clarity',
      'Hit send',
    ],
    estimatedTime: 10,
    isBuiltIn: true,
  },
  {
    id: 'meeting-prep',
    name: 'Prepare for Meeting',
    category: 'work',
    icon: 'Briefcase',
    steps: [
      'Review meeting agenda',
      'Gather relevant documents/data',
      'Note your key points to discuss',
      'Prepare questions to ask',
      'Test tech setup if virtual',
      'Take a calming breath',
    ],
    estimatedTime: 15,
    isBuiltIn: true,
  },
  {
    id: 'code-review',
    name: 'Code Review',
    category: 'coding',
    icon: 'Code',
    steps: [
      'Pull the branch locally',
      'Read the PR description',
      'Review file changes overview',
      'Check logic and edge cases',
      'Test functionality if possible',
      'Leave constructive comments',
      'Approve or request changes',
    ],
    estimatedTime: 20,
    isBuiltIn: true,
  },
  {
    id: 'write-document',
    name: 'Write Document',
    category: 'work',
    icon: 'FileText',
    steps: [
      'Define the purpose and audience',
      'Create outline with main sections',
      'Write rough first draft (no editing!)',
      'Take a short break',
      'Edit and refine content',
      'Format and add visuals',
      'Final proofread',
    ],
    estimatedTime: 45,
    isBuiltIn: true,
  },
  {
    id: 'presentation',
    name: 'Create Presentation',
    category: 'work',
    icon: 'Presentation',
    steps: [
      'Define key message and goal',
      'Outline main points (max 5-7)',
      'Create title slide',
      'Build content slides',
      'Add visuals and graphics',
      'Create summary/conclusion slide',
      'Practice run-through',
    ],
    estimatedTime: 60,
    isBuiltIn: true,
  },
  {
    id: 'grocery-shopping',
    name: 'Grocery Shopping',
    category: 'home',
    icon: 'ShoppingCart',
    steps: [
      'Check pantry and fridge',
      'Plan meals for the week',
      'Write shopping list by section',
      'Check for coupons/deals',
      'Go to store',
      'Stick to the list!',
      'Put groceries away at home',
    ],
    estimatedTime: 90,
    isBuiltIn: true,
  },
  {
    id: 'clean-room',
    name: 'Clean Room',
    category: 'home',
    icon: 'Home',
    steps: [
      'Put on energizing music',
      'Trash: Throw away obvious garbage',
      'Dishes: Collect and take to kitchen',
      'Laundry: Sort into basket',
      'Surfaces: Clear and wipe down',
      'Floor: Quick vacuum/sweep',
      'Final look: Quick tidy',
    ],
    estimatedTime: 30,
    isBuiltIn: true,
  },
  {
    id: 'workout',
    name: 'Exercise Routine',
    category: 'health',
    icon: 'Dumbbell',
    steps: [
      'Change into workout clothes',
      'Fill water bottle',
      '5-min warm-up',
      'Main workout',
      '5-min cool-down',
      'Stretch',
      'Log the workout',
    ],
    estimatedTime: 45,
    isBuiltIn: true,
  },
  {
    id: 'study-session',
    name: 'Study Session',
    category: 'learning',
    icon: 'GraduationCap',
    steps: [
      'Gather materials',
      'Set specific goal for session',
      'Remove distractions',
      '25-min focused study',
      '5-min break',
      'Review and summarize',
      'Plan next session',
    ],
    estimatedTime: 35,
    isBuiltIn: true,
  },
  {
    id: 'self-care',
    name: 'Self-Care Routine',
    category: 'health',
    icon: 'Heart',
    steps: [
      'Put away devices',
      'Prepare a warm drink',
      'Do something just for you',
      'Practice gratitude (3 things)',
      'Light stretching or movement',
      'Prepare for restful evening',
    ],
    estimatedTime: 30,
    isBuiltIn: true,
  },
]

// Category definitions
const CATEGORIES = [
  { id: 'all', name: 'All', icon: FolderOpen },
  { id: 'work', name: 'Work', icon: Briefcase },
  { id: 'coding', name: 'Coding', icon: Code },
  { id: 'home', name: 'Home', icon: Home },
  { id: 'health', name: 'Health', icon: Heart },
  { id: 'learning', name: 'Learning', icon: GraduationCap },
  { id: 'custom', name: 'Custom', icon: Star },
]

// Icon map
const ICON_MAP = {
  Mail,
  Briefcase,
  Code,
  FileText,
  Presentation,
  ShoppingCart,
  Home,
  Heart,
  Dumbbell,
  GraduationCap,
  FileSpreadsheet,
  Star,
}

// Load custom templates
const loadTemplates = () => {
  try {
    const stored = localStorage.getItem(TEMPLATES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save custom templates
const saveTemplates = (templates) => {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates))
}

// Load favorites
const loadFavorites = () => {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save favorites
const saveFavorites = (favorites) => {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
}

export default function TemplateLibrary({ onUseTemplate }) {
  const prefersReducedMotion = useReducedMotion()
  const [customTemplates, setCustomTemplates] = useState([])
  const [favorites, setFavorites] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedTemplate, setExpandedTemplate] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)

  // Load data on mount
  useEffect(() => {
    setCustomTemplates(loadTemplates())
    setFavorites(loadFavorites())
  }, [])

  // All templates combined
  const allTemplates = useMemo(() => {
    return [...BUILT_IN_TEMPLATES, ...customTemplates]
  }, [customTemplates])

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    return allTemplates.filter(template => {
      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'custom' && template.isBuiltIn) return false
        if (selectedCategory !== 'custom' && template.category !== selectedCategory) return false
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          template.name.toLowerCase().includes(query) ||
          template.steps.some(step => step.toLowerCase().includes(query))
        )
      }

      return true
    }).sort((a, b) => {
      // Favorites first
      const aFav = favorites.includes(a.id)
      const bFav = favorites.includes(b.id)
      if (aFav && !bFav) return -1
      if (!aFav && bFav) return 1
      return 0
    })
  }, [allTemplates, selectedCategory, searchQuery, favorites])

  // Toggle favorite
  const toggleFavorite = (templateId) => {
    let updated
    if (favorites.includes(templateId)) {
      updated = favorites.filter(id => id !== templateId)
    } else {
      updated = [...favorites, templateId]
    }
    setFavorites(updated)
    saveFavorites(updated)
  }

  // Use template
  const useTemplate = (template) => {
    onUseTemplate?.({
      name: template.name,
      steps: template.steps,
      estimatedTime: template.estimatedTime,
    })
  }

  // Add/Edit template
  const saveTemplate = (template) => {
    let updated
    if (editingTemplate) {
      updated = customTemplates.map(t =>
        t.id === editingTemplate.id ? { ...template, id: t.id } : t
      )
    } else {
      const newTemplate = {
        ...template,
        id: Date.now().toString(),
        isBuiltIn: false,
        category: 'custom',
      }
      updated = [...customTemplates, newTemplate]
    }

    setCustomTemplates(updated)
    saveTemplates(updated)
    setShowAddModal(false)
    setEditingTemplate(null)
  }

  // Delete template
  const deleteTemplate = (templateId) => {
    const updated = customTemplates.filter(t => t.id !== templateId)
    setCustomTemplates(updated)
    saveTemplates(updated)
  }

  // Get icon component
  const getIcon = (iconName) => {
    return ICON_MAP[iconName] || FileText
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
            <h2 className="font-display text-xl font-semibold">Template Library</h2>
            <p className="text-sm text-white/50">Reusable task breakdowns</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-white/10 text-white'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.name}
              </button>
            )
          })}
        </div>

        {/* Templates List */}
        <div className="space-y-3">
          {filteredTemplates.map((template) => {
            const Icon = getIcon(template.icon)
            const isFavorite = favorites.includes(template.id)
            const isExpanded = expandedTemplate === template.id

            return (
              <motion.div
                key={template.id}
                {...getMotionProps(prefersReducedMotion, {
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 }
                })}
                className="glass-card overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-purple-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{template.name}</h3>
                        {isFavorite && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                      </div>
                      <p className="text-xs text-white/50">
                        {template.steps.length} steps • ~{template.estimatedTime}m
                      </p>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleFavorite(template.id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        {isFavorite ? (
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        ) : (
                          <StarOff className="w-4 h-4 text-white/30" />
                        )}
                      </button>
                      <button
                        onClick={() => setExpandedTemplate(isExpanded ? null : template.id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-white/50" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-white/50" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <p className="text-sm text-white/70 mb-3">Steps:</p>
                          <ol className="space-y-2 text-sm">
                            {template.steps.map((step, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs">
                                  {i + 1}
                                </span>
                                <span className="text-white/70">{step}</span>
                              </li>
                            ))}
                          </ol>

                          {/* Actions */}
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => useTemplate(template)}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white transition-colors"
                            >
                              <Copy className="w-4 h-4" />
                              Use Template
                            </button>

                            {!template.isBuiltIn && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingTemplate(template)
                                    setShowAddModal(true)
                                  }}
                                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4 text-white/50" />
                                </button>
                                <button
                                  onClick={() => deleteTemplate(template.id)}
                                  className="p-2 rounded-xl hover:bg-red-500/20 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 text-red-400/50" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/50">No templates found</p>
              <p className="text-sm text-white/30 mt-1">
                Try a different search or category
              </p>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {showAddModal && (
            <TemplateModal
              prefersReducedMotion={prefersReducedMotion}
              template={editingTemplate}
              onClose={() => {
                setShowAddModal(false)
                setEditingTemplate(null)
              }}
              onSave={saveTemplate}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// Template Modal
function TemplateModal({ prefersReducedMotion, template, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    steps: template?.steps || [''],
    estimatedTime: template?.estimatedTime || 15,
    icon: template?.icon || 'Star',
  })

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, '']
    }))
  }

  const updateStep = (index, value) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((s, i) => i === index ? value : s)
    }))
  }

  const removeStep = (index) => {
    if (formData.steps.length <= 1) return
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }))
  }

  const handleSave = () => {
    if (!formData.name.trim() || formData.steps.filter(s => s.trim()).length === 0) return
    onSave({
      ...formData,
      steps: formData.steps.filter(s => s.trim())
    })
  }

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
          <h3 className="font-display text-lg font-semibold">
            {template ? 'Edit Template' : 'Create Template'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm text-white/70 mb-2">Template Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Morning Routine"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
          />
        </div>

        {/* Steps */}
        <div className="mb-4">
          <label className="block text-sm text-white/70 mb-2">Steps</label>
          <div className="space-y-2">
            {formData.steps.map((step, i) => (
              <div key={i} className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-10 flex items-center justify-center text-sm text-white/50">
                  {i + 1}.
                </span>
                <input
                  type="text"
                  value={step}
                  onChange={(e) => updateStep(i, e.target.value)}
                  placeholder={`Step ${i + 1}`}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                />
                <button
                  onClick={() => removeStep(i)}
                  className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                  disabled={formData.steps.length <= 1}
                >
                  <X className="w-4 h-4 text-red-400/50" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addStep}
            className="mt-2 flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
          >
            <Plus className="w-4 h-4" /> Add step
          </button>
        </div>

        {/* Estimated Time */}
        <div className="mb-6">
          <label className="block text-sm text-white/70 mb-2">
            Estimated Time: {formData.estimatedTime} min
          </label>
          <input
            type="range"
            min="5"
            max="120"
            step="5"
            value={formData.estimatedTime}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) }))}
            className="w-full"
          />
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
            onClick={handleSave}
            disabled={!formData.name.trim() || formData.steps.filter(s => s.trim()).length === 0}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
              formData.name.trim() && formData.steps.filter(s => s.trim()).length > 0
                ? 'bg-purple-500 hover:bg-purple-600 text-white'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            {template ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
