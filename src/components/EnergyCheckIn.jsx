import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Zap } from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Simplified 3-level energy system for reduced decision fatigue
const ENERGY_LEVELS = [
  {
    level: 1,
    label: 'Low',
    emoji: '🐌',
    description: 'Need easy wins',
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/50',
    message: "I hear you - it's a low energy day. Let's keep things tiny and gentle."
  },
  {
    level: 2,
    label: 'Medium',
    emoji: '🚶',
    description: 'Can handle some things',
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/50',
    message: "Middle ground - I'll suggest a mix of quick wins and one meaningful task."
  },
  {
    level: 3,
    label: 'High',
    emoji: '🚀',
    description: 'Ready to tackle stuff',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/50',
    message: "Nice! You've got fuel today. Let's make it count."
  }
]

export default function EnergyCheckIn({ onSubmit, onSkip }) {
  const [selectedLevel, setSelectedLevel] = useState(null)
  const prefersReducedMotion = useReducedMotion()

  const handleSubmit = () => {
    if (selectedLevel !== null) {
      const energyData = ENERGY_LEVELS[selectedLevel]
      // Convert 1-3 scale to 1-5 for compatibility (1→1, 2→3, 3→5)
      const mappedLevel = selectedLevel === 0 ? 1 : selectedLevel === 1 ? 3 : 5
      onSubmit(mappedLevel, null, energyData.message)
    }
  }

  const backdropVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  }

  const modalVariants = {
    initial: { opacity: 0, scale: 0.9, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, y: 20 }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      {...getMotionProps(prefersReducedMotion, backdropVariants)}
    >
      <motion.div
        className="w-full max-w-sm glass-card p-6 relative"
        {...getMotionProps(prefersReducedMotion, modalVariants)}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Skip button */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Skip energy check-in"
        >
          <X className="w-5 h-5 text-white/50" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-nero-400 to-nero-600 flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-display text-xl font-semibold mb-1">How's your energy?</h2>
          <p className="text-sm text-white/50">Just pick one - no wrong answers</p>
        </div>

        {/* Energy level buttons - simplified to 3 options */}
        <div className="space-y-3 mb-6">
          {ENERGY_LEVELS.map((energy, index) => (
            <button
              key={energy.level}
              onClick={() => setSelectedLevel(index)}
              className={`w-full p-4 rounded-xl border-2 transition-all min-h-[72px] flex items-center gap-4 ${
                selectedLevel === index
                  ? `${energy.bgColor} ${energy.borderColor}`
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <span className="text-3xl" role="img" aria-label={energy.label}>
                {energy.emoji}
              </span>
              <div className="text-left flex-1">
                <div className="font-medium text-lg">{energy.label}</div>
                <div className="text-sm text-white/50">{energy.description}</div>
              </div>
              {selectedLevel === index && (
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${energy.color}`} />
              )}
            </button>
          ))}
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={selectedLevel === null}
          className={`w-full py-4 rounded-xl font-medium text-lg transition-all min-h-[56px] ${
            selectedLevel !== null
              ? 'bg-gradient-to-r from-nero-500 to-nero-600 hover:from-nero-400 hover:to-nero-500 text-white'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}
        >
          {selectedLevel !== null ? "Let's go" : 'Pick one above'}
        </button>
      </motion.div>
    </motion.div>
  )
}
