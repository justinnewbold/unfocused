import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, ArrowRight, X, Clock } from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

export default function BreadcrumbTrail({ breadcrumbs, onResolve, onJumpTo }) {
  const prefersReducedMotion = useReducedMotion()

  const formatTimeAgo = (date) => {
    const dateObj = date instanceof Date ? date : new Date(date)
    const minutes = Math.floor((Date.now() - dateObj.getTime()) / 1000 / 60)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const itemVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20, height: 0 }
  }

  if (breadcrumbs.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-white/30" />
          </div>
          <h3 className="font-display text-lg font-medium text-white/70 mb-2">No breadcrumbs yet</h3>
          <p className="text-sm text-white/40 max-w-xs">
            When you get interrupted or switch tasks, drop a breadcrumb to find your way back.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-display text-lg font-semibold mb-1">Your Trail</h2>
        <p className="text-sm text-white/50">Where you've been - tap to jump back</p>
      </div>

      {/* Breadcrumb list */}
      <div className="relative space-y-3">
        {/* Connecting line */}
        <div className="absolute left-5 top-10 bottom-10 w-0.5 bg-gradient-to-b from-nero-400/30 via-nero-400/20 to-transparent" />

        <AnimatePresence>
          {breadcrumbs.map((breadcrumb, index) => (
            <motion.div
              key={breadcrumb.id}
              layout
              {...getMotionProps(prefersReducedMotion, itemVariants)}
              transition={{ delay: index * 0.05 }}
              className="relative"
            >
              {/* Timeline dot */}
              <div className={`absolute left-3 top-5 w-4 h-4 rounded-full border-2 ${
                index === 0
                  ? 'bg-nero-500 border-nero-400'
                  : 'bg-surface border-white/20'
              }`} />

              {/* Card */}
              <div className="ml-10 glass-card p-4 hover:bg-white/10 transition-colors group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* What you were doing */}
                    <h3 className="font-medium text-white mb-1 truncate">
                      {breadcrumb.activity}
                    </h3>

                    {/* Why you stopped - simplified */}
                    {breadcrumb.context && (
                      <p className="text-sm text-white/50 mb-3">
                        {breadcrumb.context}
                      </p>
                    )}

                    {/* Time */}
                    <div className="flex items-center gap-1 text-xs text-white/30">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(breadcrumb.createdAt)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onJumpTo(breadcrumb)}
                      className="p-2 rounded-lg bg-nero-500/20 hover:bg-nero-500/30 text-nero-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Jump back to this task"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onResolve(breadcrumb.id)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Dismiss this breadcrumb"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
