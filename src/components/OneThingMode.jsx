import React from 'react'
import { motion } from 'framer-motion'
import { Check, SkipForward, Sparkles, ArrowRight } from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

export default function OneThingMode({ task, onComplete, onSkip, energyLevel }) {
  const prefersReducedMotion = useReducedMotion()

  const containerVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  }

  const celebrationVariants = {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.05, 1],
      transition: { duration: 0.5 }
    }
  }

  if (task.isCompleted) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <motion.div
          className="text-center"
          {...(prefersReducedMotion ? {} : celebrationVariants)}
        >
          <motion.div
            className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6"
            {...getMotionProps(prefersReducedMotion, {
              initial: { scale: 0 },
              animate: { scale: 1 },
              transition: { type: 'spring', damping: 15 }
            })}
          >
            <Check className="w-12 h-12 text-white" strokeWidth={3} />
          </motion.div>
          <h2 className="font-display text-2xl font-semibold mb-2">Done!</h2>
          <p className="text-white/60 mb-6">That's momentum. Keep it rolling?</p>
          <button
            onClick={onSkip}
            className="px-6 py-3 rounded-xl bg-nero-500/20 hover:bg-nero-500/30 text-nero-400 font-medium transition-colors min-h-[48px] flex items-center gap-2 mx-auto"
          >
            Next task <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      {/* Spotlight effect */}
      <div className="absolute inset-0 one-thing-spotlight pointer-events-none" />

      <motion.div
        className="relative z-10 w-full max-w-md text-center"
        {...getMotionProps(prefersReducedMotion, containerVariants)}
      >
        {/* "One Thing" label */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nero-500/20 text-nero-400 text-sm font-medium mb-8">
          <Sparkles className="w-4 h-4" />
          Your one thing right now
        </div>

        {/* Task card */}
        <div className="glass-card glow-border p-8 mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-4 leading-tight">
            {task.title}
          </h2>

          {task.description && (
            <p className="text-white/60 mb-6">{task.description}</p>
          )}

          {task.reason && (
            <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-white/50 italic">
                Why this? {task.reason}
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onSkip}
            className="px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium transition-colors min-h-[56px] min-w-[120px] flex items-center justify-center gap-2"
          >
            <SkipForward className="w-5 h-5" />
            Skip
          </button>

          <button
            onClick={onComplete}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-nero-500 to-nero-600 hover:from-nero-400 hover:to-nero-500 text-white font-medium transition-all min-h-[56px] min-w-[140px] flex items-center justify-center gap-2 shadow-lg shadow-nero-500/25"
          >
            <Check className="w-5 h-5" />
            Done!
          </button>
        </div>

        {/* Energy indicator */}
        <div className="mt-8 text-sm text-white/40">
          {energyLevel <= 2 && "Taking it easy today - that's smart."}
          {energyLevel === 3 && "Steady pace. You've got this."}
          {energyLevel >= 4 && "High energy mode activated."}
        </div>
      </motion.div>
    </div>
  )
}
