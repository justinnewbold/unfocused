import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  MessageCircle,
  Target,
  MapPin,
  Timer,
  BarChart3,
  AlertCircle,
  Battery,
  Keyboard
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Shortcut definitions for display
const SHORTCUT_GROUPS = [
  {
    title: 'Navigation',
    shortcuts: [
      { key: '1', description: 'Go to Chat', icon: MessageCircle },
      { key: '2', description: 'Go to One Thing', icon: Target },
      { key: '3', description: 'Go to Breadcrumbs', icon: MapPin },
      { key: '4', description: 'Go to Focus Timer', icon: Timer },
      { key: '5', description: 'Go to Insights', icon: BarChart3 },
    ]
  },
  {
    title: 'Actions',
    shortcuts: [
      { key: 'Space', description: 'Start/Stop timer or Complete task', icon: Target },
      { key: 'I', description: 'Drop a breadcrumb (Interrupted!)', icon: AlertCircle },
      { key: 'E', description: 'Open energy check-in', icon: Battery },
      { key: 'R', description: 'Reset timer', icon: Timer },
    ]
  },
  {
    title: 'Help',
    shortcuts: [
      { key: '?', description: 'Toggle this help overlay', icon: Keyboard },
      { key: 'Esc', description: 'Close dialogs/overlays', icon: X },
    ]
  }
]

export default function KeyboardShortcuts({ show, onClose }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          {...getMotionProps(prefersReducedMotion, {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 }
          })}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-lg glass-card p-6 max-h-[80vh] overflow-y-auto"
            {...getMotionProps(prefersReducedMotion, {
              initial: { scale: 0.95, opacity: 0 },
              animate: { scale: 1, opacity: 1 },
              exit: { scale: 0.95, opacity: 0 }
            })}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nero-400 to-nero-600 flex items-center justify-center">
                  <Keyboard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold">Keyboard Shortcuts</h2>
                  <p className="text-sm text-white/50">Quick actions at your fingertips</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Shortcut groups */}
            <div className="space-y-6">
              {SHORTCUT_GROUPS.map((group) => (
                <div key={group.title}>
                  <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">
                    {group.title}
                  </h3>
                  <div className="space-y-2">
                    {group.shortcuts.map((shortcut) => (
                      <div
                        key={shortcut.key}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <shortcut.icon className="w-4 h-4 text-white/50" />
                          <span className="text-white/80">{shortcut.description}</span>
                        </div>
                        <kbd className="px-3 py-1 rounded-lg bg-surface-light border border-white/10 font-mono text-sm text-nero-400">
                          {shortcut.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer tip */}
            <div className="mt-6 pt-4 border-t border-white/10 text-center">
              <p className="text-sm text-white/40">
                Press <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono text-xs">?</kbd> anytime to show/hide this help
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
