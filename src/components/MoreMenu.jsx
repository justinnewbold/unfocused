import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Search,
  Pill,
  Moon,
  Dumbbell,
  Sparkles,
  Trophy,
  MapPin,
  Clock,
  Shuffle,
  Brain,
  Smile,
  Heart,
  Shield,
  Users,
  MessageSquare,
  Settings,
  Palette,
  Volume2,
  Keyboard,
  BarChart3,
  TrendingUp,
  FileText,
  Calendar,
  BookOpen as Notebook,
  Mic,
  Music,
  Ban,
  Map,
  Watch,
  Smartphone,
  Gamepad2,
  Star,
  Dog,
  Globe,
  Briefcase,
  ListChecks,
  Layers,
  ClipboardList,
  BookOpen,
  Timer,
  MoreHorizontal,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Feature categories with their items
const FEATURE_CATEGORIES = [
  {
    id: 'health',
    label: 'Health & Wellness',
    features: [
      { id: 'medication', icon: Pill, label: 'Meds', color: 'red' },
      { id: 'sleep', icon: Moon, label: 'Sleep', color: 'indigo' },
      { id: 'movement', icon: Dumbbell, label: 'Movement', color: 'green' },
      { id: 'mood_tracker', icon: Smile, label: 'Mood', color: 'yellow' },
    ],
  },
  {
    id: 'emotional',
    label: 'Self-Care',
    features: [
      { id: 'dopamine', icon: Sparkles, label: 'Dopamine', color: 'pink' },
      { id: 'wins', icon: Trophy, label: 'Wins', color: 'yellow' },
      { id: 'rejection', icon: Heart, label: 'RSD Journal', color: 'rose' },
      { id: 'self_compassion', icon: Heart, label: 'Compassion', color: 'purple' },
    ],
  },
  {
    id: 'organize',
    label: 'Organization',
    features: [
      { id: 'object_finder', icon: MapPin, label: 'Objects', color: 'amber' },
      { id: 'waiting', icon: Clock, label: 'Waiting', color: 'cyan' },
      { id: 'decision', icon: Shuffle, label: 'Decisions', color: 'orange' },
      { id: 'working_memory', icon: Brain, label: 'Memory', color: 'violet' },
      { id: 'deadline', icon: Timer, label: 'Deadlines', color: 'red' },
      { id: 'project', icon: Briefcase, label: 'Projects', color: 'blue' },
      { id: 'prioritizer', icon: ListChecks, label: 'Prioritize', color: 'emerald' },
      { id: 'templates', icon: ClipboardList, label: 'Templates', color: 'slate' },
      { id: 'appointment', icon: Calendar, label: 'Buffers', color: 'teal' },
    ],
  },
  {
    id: 'focus',
    label: 'Focus & Environment',
    features: [
      { id: 'focus_rooms', icon: Layers, label: 'Rooms', color: 'blue' },
      { id: 'distraction_block', icon: Ban, label: 'Block', color: 'red' },
      { id: 'location', icon: Map, label: 'Location', color: 'green' },
      { id: 'custom_sounds', icon: Volume2, label: 'Sounds', color: 'purple' },
      { id: 'music', icon: Music, label: 'Music', color: 'pink' },
    ],
  },
  {
    id: 'social',
    label: 'Social & Support',
    features: [
      { id: 'accountability', icon: Users, label: 'Buddy', color: 'green' },
      { id: 'community', icon: Globe, label: 'Community', color: 'blue' },
      { id: 'family', icon: Users, label: 'Family', color: 'purple' },
      { id: 'therapist', icon: MessageSquare, label: 'Therapist', color: 'teal' },
    ],
  },
  {
    id: 'data',
    label: 'Analytics',
    features: [
      { id: 'correlations', icon: TrendingUp, label: 'Patterns', color: 'cyan' },
      { id: 'progress', icon: BarChart3, label: 'Progress', color: 'green' },
      { id: 'export_reports', icon: FileText, label: 'Reports', color: 'gray' },
      { id: 'predictions', icon: Sparkles, label: 'Predict', color: 'violet' },
    ],
  },
  {
    id: 'tools',
    label: 'Tools & Integrations',
    features: [
      { id: 'voice_assistant', icon: Mic, label: 'Voice', color: 'blue' },
      { id: 'voice_notes', icon: Mic, label: 'Notes', color: 'green' },
      { id: 'calendar_sync', icon: Calendar, label: 'Calendar', color: 'red' },
      { id: 'note_sync', icon: Notebook, label: 'Sync', color: 'orange' },
    ],
  },
  {
    id: 'gamification',
    label: 'Gamification',
    features: [
      { id: 'badges', icon: Star, label: 'Badges', color: 'yellow' },
      { id: 'pet', icon: Dog, label: 'Pet', color: 'amber' },
      { id: 'challenges', icon: Gamepad2, label: 'Challenges', color: 'pink' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    features: [
      { id: 'accessibility', icon: Settings, label: 'Access', color: 'gray' },
      { id: 'dark_mode', icon: Palette, label: 'Theme', color: 'purple' },
      { id: 'nero_personality', icon: Brain, label: 'Nero', color: 'orange' },
      { id: 'shortcut_actions', icon: Keyboard, label: 'Shortcuts', color: 'blue' },
      { id: 'wearable', icon: Watch, label: 'Wearable', color: 'green' },
      { id: 'widgets', icon: Smartphone, label: 'Widgets', color: 'cyan' },
    ],
  },
]

export default function MoreMenu({ isOpen, onClose, onNavigate, currentView }) {
  const prefersReducedMotion = useReducedMotion()
  const [searchQuery, setSearchQuery] = useState('')

  // Flatten all features for search
  const allFeatures = useMemo(() =>
    FEATURE_CATEGORIES.flatMap(cat =>
      cat.features.map(f => ({ ...f, category: cat.label }))
    ),
    []
  )

  // Filtered features
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return FEATURE_CATEGORIES

    const query = searchQuery.toLowerCase()
    return FEATURE_CATEGORIES
      .map(cat => ({
        ...cat,
        features: cat.features.filter(f =>
          f.label.toLowerCase().includes(query) ||
          f.id.toLowerCase().includes(query) ||
          cat.label.toLowerCase().includes(query)
        ),
      }))
      .filter(cat => cat.features.length > 0)
  }, [searchQuery])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50"
        {...getMotionProps(prefersReducedMotion, {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        })}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          className="absolute inset-x-0 bottom-0 max-h-[85vh] bg-surface-dark border-t border-white/10 rounded-t-3xl overflow-hidden"
          {...getMotionProps(prefersReducedMotion, {
            initial: { y: '100%' },
            animate: { y: 0 },
            exit: { y: '100%' },
          })}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="px-4 pb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">All Features</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search features..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                autoFocus
              />
            </div>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto max-h-[65vh] px-4 pb-8">
            {filteredCategories.map((category) => (
              <div key={category.id} className="mb-5">
                <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
                  {category.label}
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {category.features.map((feature) => {
                    const Icon = feature.icon
                    const isActive = currentView === feature.id

                    return (
                      <button
                        key={feature.id}
                        onClick={() => {
                          onNavigate(feature.id)
                          onClose()
                        }}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                          isActive
                            ? 'bg-nero-500/20 text-nero-400'
                            : 'bg-white/5 hover:bg-white/10 text-white/70'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl bg-${feature.color}-500/20 flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 text-${feature.color}-400`} />
                        </div>
                        <span className="text-[11px] font-medium text-center leading-tight">
                          {feature.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {filteredCategories.length === 0 && (
              <div className="text-center py-8">
                <Search className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-sm text-white/50">No features match "{searchQuery}"</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Export the feature IDs for VIEW_MODES mapping
export const MORE_FEATURE_IDS = FEATURE_CATEGORIES.flatMap(cat =>
  cat.features.map(f => f.id)
)
