import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  Star,
  Sparkles,
  Trophy,
  Flame,
  Zap,
  Gift,
  Lock,
  Check,
  Info,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const PET_KEY = 'nero_pet_system'

// Pet types with evolution stages
const PETS = [
  {
    id: 'fox',
    name: 'Focus Fox',
    emoji: '🦊',
    color: 'orange',
    evolutions: [
      { level: 1, name: 'Kit', emoji: '🦊', description: 'A curious little fox' },
      { level: 5, name: 'Scout', emoji: '🦊', description: 'Learning to focus' },
      { level: 10, name: 'Swift', emoji: '🦊', description: 'Quick and determined' },
      { level: 20, name: 'Sage', emoji: '🦊', description: 'Wise and focused' },
    ],
  },
  {
    id: 'owl',
    name: 'Wisdom Owl',
    emoji: '🦉',
    color: 'purple',
    evolutions: [
      { level: 1, name: 'Owlet', emoji: '🦉', description: 'Wide-eyed and eager' },
      { level: 5, name: 'Night Watcher', emoji: '🦉', description: 'Attentive and alert' },
      { level: 10, name: 'Scholar', emoji: '🦉', description: 'Knowledge seeker' },
      { level: 20, name: 'Grand Sage', emoji: '🦉', description: 'Master of wisdom' },
    ],
  },
  {
    id: 'cat',
    name: 'Calm Cat',
    emoji: '🐱',
    color: 'blue',
    evolutions: [
      { level: 1, name: 'Kitten', emoji: '🐱', description: 'Playful and curious' },
      { level: 5, name: 'Napper', emoji: '🐱', description: 'Master of rest' },
      { level: 10, name: 'Zen', emoji: '🐱', description: 'Perfectly balanced' },
      { level: 20, name: 'Cosmic', emoji: '🐱', description: 'Transcendent calm' },
    ],
  },
  {
    id: 'dragon',
    name: 'Determined Dragon',
    emoji: '🐉',
    color: 'red',
    evolutions: [
      { level: 1, name: 'Hatchling', emoji: '🐉', description: 'Small but mighty' },
      { level: 5, name: 'Flame', emoji: '🐉', description: 'Growing stronger' },
      { level: 10, name: 'Storm', emoji: '🐉', description: 'Unstoppable force' },
      { level: 20, name: 'Ancient', emoji: '🐉', description: 'Legendary power' },
    ],
  },
  {
    id: 'bee',
    name: 'Busy Bee',
    emoji: '🐝',
    color: 'yellow',
    evolutions: [
      { level: 1, name: 'Buzzer', emoji: '🐝', description: 'Always moving' },
      { level: 5, name: 'Worker', emoji: '🐝', description: 'Productive spirit' },
      { level: 10, name: 'Queen', emoji: '🐝', description: 'Leading the hive' },
      { level: 20, name: 'Golden', emoji: '🐝', description: 'Pure efficiency' },
    ],
  },
]

// Accessories (unlocked at various levels)
const ACCESSORIES = [
  { id: 'crown', emoji: '👑', name: 'Crown', unlockLevel: 15 },
  { id: 'glasses', emoji: '🤓', name: 'Smart Glasses', unlockLevel: 8 },
  { id: 'headphones', emoji: '🎧', name: 'Headphones', unlockLevel: 5 },
  { id: 'cape', emoji: '🦸', name: 'Hero Cape', unlockLevel: 12 },
  { id: 'hat', emoji: '🎩', name: 'Top Hat', unlockLevel: 10 },
  { id: 'star', emoji: '⭐', name: 'Star Badge', unlockLevel: 3 },
]

// Load pet data
const loadPetData = () => {
  try {
    const stored = localStorage.getItem(PET_KEY)
    return stored ? JSON.parse(stored) : {
      selectedPet: 'fox',
      level: 1,
      xp: 0,
      happiness: 100,
      accessories: [],
      equippedAccessory: null,
      lastFed: new Date().toISOString(),
      streakDays: 0,
    }
  } catch {
    return { selectedPet: 'fox', level: 1, xp: 0, happiness: 100, accessories: [] }
  }
}

// Save pet data
const savePetData = (data) => {
  localStorage.setItem(PET_KEY, JSON.stringify(data))
}

// XP required for each level
const xpForLevel = (level) => level * 100

export default function AvatarPetSystem({ tasksCompleted, focusSessions, streakDays }) {
  const prefersReducedMotion = useReducedMotion()
  const [petData, setPetData] = useState(loadPetData())
  const [showPetSelect, setShowPetSelect] = useState(false)
  const [showAccessories, setShowAccessories] = useState(false)
  const [showAnimation, setShowAnimation] = useState(null)

  // Load data on mount
  useEffect(() => {
    setPetData(loadPetData())
  }, [])

  // Update XP when tasks/sessions complete
  useEffect(() => {
    // This would be called from parent when activities complete
  }, [tasksCompleted, focusSessions])

  // Get current pet
  const currentPet = useMemo(() => {
    return PETS.find(p => p.id === petData.selectedPet) || PETS[0]
  }, [petData.selectedPet])

  // Get current evolution
  const currentEvolution = useMemo(() => {
    const evolutions = currentPet.evolutions.filter(e => e.level <= petData.level)
    return evolutions[evolutions.length - 1] || currentPet.evolutions[0]
  }, [currentPet, petData.level])

  // Next evolution
  const nextEvolution = useMemo(() => {
    return currentPet.evolutions.find(e => e.level > petData.level)
  }, [currentPet, petData.level])

  // XP progress to next level
  const xpProgress = useMemo(() => {
    const required = xpForLevel(petData.level + 1)
    const current = petData.xp
    return Math.min(100, (current / required) * 100)
  }, [petData.level, petData.xp])

  // Unlocked accessories
  const unlockedAccessories = useMemo(() => {
    return ACCESSORIES.filter(a => a.unlockLevel <= petData.level)
  }, [petData.level])

  // Update pet data
  const updatePetData = (updates) => {
    const updated = { ...petData, ...updates }
    setPetData(updated)
    savePetData(updated)
  }

  // Select pet
  const selectPet = (petId) => {
    updatePetData({ selectedPet: petId })
    setShowPetSelect(false)
  }

  // Equip accessory
  const equipAccessory = (accessoryId) => {
    updatePetData({
      equippedAccessory: petData.equippedAccessory === accessoryId ? null : accessoryId
    })
  }

  // Add XP (would be called from parent)
  const addXP = (amount) => {
    let newXP = petData.xp + amount
    let newLevel = petData.level

    // Check for level up
    while (newXP >= xpForLevel(newLevel + 1)) {
      newXP -= xpForLevel(newLevel + 1)
      newLevel++
      setShowAnimation('levelup')
      setTimeout(() => setShowAnimation(null), 2000)
    }

    updatePetData({ xp: newXP, level: newLevel })
  }

  // Feed pet (boost happiness)
  const feedPet = () => {
    const now = new Date()
    const lastFed = new Date(petData.lastFed)
    const hoursSince = (now - lastFed) / 1000 / 60 / 60

    if (hoursSince >= 4) {
      updatePetData({
        happiness: Math.min(100, petData.happiness + 20),
        lastFed: now.toISOString(),
      })
      setShowAnimation('feed')
      setTimeout(() => setShowAnimation(null), 1500)
    }
  }

  // Get equipped accessory
  const equippedAcc = ACCESSORIES.find(a => a.id === petData.equippedAccessory)

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
            <h2 className="font-display text-xl font-semibold">Your Companion</h2>
            <p className="text-sm text-white/50">Grow together on your journey</p>
          </div>
        </div>

        {/* Pet Display */}
        <motion.div
          className={`mb-6 p-6 glass-card border border-${currentPet.color}-500/30 bg-gradient-to-b from-${currentPet.color}-500/10 to-transparent text-center`}
        >
          {/* Pet Avatar */}
          <motion.div
            animate={showAnimation === 'feed' ? { scale: [1, 1.2, 1] } : {}}
            className="relative inline-block"
          >
            <span className="text-8xl">{currentEvolution.emoji}</span>
            {equippedAcc && (
              <span className="absolute -top-2 -right-2 text-3xl">{equippedAcc.emoji}</span>
            )}

            {/* Level Up Animation */}
            <AnimatePresence>
              {showAnimation === 'levelup' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute -top-8 left-1/2 -translate-x-1/2"
                >
                  <span className="text-yellow-400 font-bold text-lg">LEVEL UP!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Pet Info */}
          <div className="mt-4">
            <h3 className="text-xl font-bold">{currentEvolution.name}</h3>
            <p className="text-sm text-white/50">{currentEvolution.description}</p>
          </div>

          {/* Level & XP */}
          <div className="mt-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="font-bold">Level {petData.level}</span>
            </div>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400"
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-xs text-white/40 mt-1">
              {petData.xp} / {xpForLevel(petData.level + 1)} XP
            </p>
          </div>

          {/* Happiness */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <Heart className={`w-5 h-5 ${petData.happiness > 50 ? 'text-red-400' : 'text-red-400/50'}`} />
            <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-400 transition-all"
                style={{ width: `${petData.happiness}%` }}
              />
            </div>
            <span className="text-xs text-white/50">{petData.happiness}%</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4 justify-center">
            <button
              onClick={feedPet}
              className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition-colors"
            >
              <Heart className="w-4 h-4 inline mr-1" />
              Feed
            </button>
            <button
              onClick={() => setShowPetSelect(true)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm transition-colors"
            >
              Change Pet
            </button>
            <button
              onClick={() => setShowAccessories(true)}
              className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-sm transition-colors"
            >
              <Gift className="w-4 h-4 inline mr-1" />
              Dress Up
            </button>
          </div>
        </motion.div>

        {/* Next Evolution */}
        {nextEvolution && (
          <div className="mb-6 p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl opacity-50">
                {nextEvolution.emoji}
              </div>
              <div>
                <p className="text-sm text-white/50">Next evolution at level {nextEvolution.level}</p>
                <p className="font-medium">{nextEvolution.name}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="glass-card p-3 text-center">
            <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
            <p className="text-lg font-bold">{streakDays || petData.streakDays}</p>
            <p className="text-xs text-white/50">Day Streak</p>
          </div>
          <div className="glass-card p-3 text-center">
            <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <p className="text-lg font-bold">{tasksCompleted || 0}</p>
            <p className="text-xs text-white/50">Tasks Done</p>
          </div>
          <div className="glass-card p-3 text-center">
            <Zap className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <p className="text-lg font-bold">{focusSessions || 0}</p>
            <p className="text-xs text-white/50">Focus Sessions</p>
          </div>
        </div>

        {/* Tips */}
        <div className="p-4 bg-white/5 rounded-xl">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-white/50 mt-0.5" />
            <p className="text-sm text-white/50">
              Complete tasks and focus sessions to earn XP and level up your companion!
              Unlock new accessories as you progress.
            </p>
          </div>
        </div>

        {/* Pet Selection Modal */}
        <AnimatePresence>
          {showPetSelect && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 }
              })}
            >
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPetSelect(false)} />

              <motion.div
                className="relative w-full max-w-md glass-card p-5"
                {...getMotionProps(prefersReducedMotion, {
                  initial: { y: 100, opacity: 0 },
                  animate: { y: 0, opacity: 1 },
                  exit: { y: 100, opacity: 0 }
                })}
              >
                <h3 className="font-display text-lg font-semibold mb-4">Choose Your Companion</h3>

                <div className="grid grid-cols-3 gap-3">
                  {PETS.map((pet) => (
                    <button
                      key={pet.id}
                      onClick={() => selectPet(pet.id)}
                      className={`p-4 rounded-xl transition-all ${
                        petData.selectedPet === pet.id
                          ? `bg-${pet.color}-500/20 border-2 border-${pet.color}-500`
                          : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                      }`}
                    >
                      <span className="text-4xl block">{pet.emoji}</span>
                      <p className="text-xs mt-2">{pet.name}</p>
                      {petData.selectedPet === pet.id && (
                        <Check className="w-4 h-4 text-green-400 mx-auto mt-1" />
                      )}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowPetSelect(false)}
                  className="w-full mt-4 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                >
                  Cancel
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Accessories Modal */}
        <AnimatePresence>
          {showAccessories && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 }
              })}
            >
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAccessories(false)} />

              <motion.div
                className="relative w-full max-w-md glass-card p-5"
                {...getMotionProps(prefersReducedMotion, {
                  initial: { y: 100, opacity: 0 },
                  animate: { y: 0, opacity: 1 },
                  exit: { y: 100, opacity: 0 }
                })}
              >
                <h3 className="font-display text-lg font-semibold mb-4">Accessories</h3>

                <div className="grid grid-cols-3 gap-3">
                  {ACCESSORIES.map((acc) => {
                    const isUnlocked = acc.unlockLevel <= petData.level
                    const isEquipped = petData.equippedAccessory === acc.id

                    return (
                      <button
                        key={acc.id}
                        onClick={() => isUnlocked && equipAccessory(acc.id)}
                        disabled={!isUnlocked}
                        className={`p-4 rounded-xl transition-all ${
                          isEquipped
                            ? 'bg-purple-500/20 border-2 border-purple-500'
                            : isUnlocked
                              ? 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                              : 'bg-white/5 opacity-50 border-2 border-transparent'
                        }`}
                      >
                        {isUnlocked ? (
                          <span className="text-3xl block">{acc.emoji}</span>
                        ) : (
                          <Lock className="w-6 h-6 text-white/30 mx-auto" />
                        )}
                        <p className="text-xs mt-2">{acc.name}</p>
                        {!isUnlocked && (
                          <p className="text-xs text-white/40">Lvl {acc.unlockLevel}</p>
                        )}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setShowAccessories(false)}
                  className="w-full mt-4 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                >
                  Done
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
