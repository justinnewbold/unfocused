import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Brain,
  Bookmark,
  Wind,
  Footprints,
  CheckCircle2,
  X,
  Sparkles,
  ChevronRight,
  Pause,
  Play,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Transition steps for guided task switching
const TRANSITION_STEPS = [
  {
    id: 'capture',
    title: 'Capture Your Thoughts',
    description: 'Quick-save anything on your mind before switching',
    icon: Brain,
    duration: 30,
    prompt: 'What were you thinking about? Any loose threads?',
  },
  {
    id: 'bookmark',
    title: 'Save Your Place',
    description: "Drop a breadcrumb so you can find your way back",
    icon: Bookmark,
    duration: 15,
    prompt: 'Where exactly did you leave off?',
  },
  {
    id: 'reset',
    title: 'Mental Reset',
    description: 'Take a breath and clear the mental slate',
    icon: Wind,
    duration: 30,
    prompt: 'Close your eyes. Take 3 deep breaths.',
  },
  {
    id: 'firstStep',
    title: 'First Tiny Step',
    description: 'Identify the smallest action to start your next task',
    icon: Footprints,
    duration: 20,
    prompt: "What's the very first thing you'll do?",
  },
]

export default function TransitionHelper({
  isOpen,
  onClose,
  fromTask,
  toTask,
  onCapture,
  onDropBreadcrumb,
  onComplete,
}) {
  const prefersReducedMotion = useReducedMotion()
  const [currentStep, setCurrentStep] = useState(0)
  const [stepInputs, setStepInputs] = useState({})
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [skippedSteps, setSkippedSteps] = useState([])

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
      setStepInputs({})
      setIsTimerRunning(false)
      setSkippedSteps([])
    }
  }, [isOpen])

  // Timer for reset step
  useEffect(() => {
    if (!isTimerRunning || timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setIsTimerRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimerRunning, timeRemaining])

  const currentStepData = TRANSITION_STEPS[currentStep]
  const StepIcon = currentStepData?.icon

  const handleInputChange = (value) => {
    setStepInputs(prev => ({
      ...prev,
      [currentStepData.id]: value,
    }))
  }

  const handleNext = () => {
    // Handle step-specific actions
    if (currentStepData.id === 'capture' && stepInputs.capture) {
      onCapture?.({
        text: stepInputs.capture,
        type: 'thought',
        timestamp: Date.now(),
      })
    }

    if (currentStepData.id === 'bookmark' && stepInputs.bookmark) {
      onDropBreadcrumb?.({
        activity: fromTask?.title || 'Previous task',
        context: stepInputs.bookmark,
      })
    }

    if (currentStep < TRANSITION_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)

      // Start timer for reset step
      if (TRANSITION_STEPS[currentStep + 1].id === 'reset') {
        setTimeRemaining(30)
      }
    } else {
      // Complete transition
      onComplete?.({
        inputs: stepInputs,
        skippedSteps,
        fromTask,
        toTask,
      })
      onClose()
    }
  }

  const handleSkip = () => {
    setSkippedSteps(prev => [...prev, currentStepData.id])
    handleNext()
  }

  const startBreathingTimer = () => {
    setTimeRemaining(30)
    setIsTimerRunning(true)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          {...getMotionProps(prefersReducedMotion, {
            initial: { opacity: 0, scale: 0.95, y: 20 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.95, y: 20 },
          })}
          className="bg-surface rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-white/10"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-gradient-to-r from-calm-500/20 to-focus-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-calm-500/20 flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-calm-400" />
                </div>
                <div>
                  <h2 className="font-display font-semibold text-lg">Task Transition</h2>
                  <p className="text-sm text-white/60">Smooth context switch</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Task indicator */}
            {(fromTask || toTask) && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                {fromTask && (
                  <span className="px-2 py-1 bg-white/10 rounded-lg text-white/70 truncate max-w-[140px]">
                    {fromTask.title}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-white/40 flex-shrink-0" />
                {toTask && (
                  <span className="px-2 py-1 bg-nero-500/20 rounded-lg text-nero-300 truncate max-w-[140px]">
                    {toTask.title}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 py-3 bg-surface-dark/50">
            {TRANSITION_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`w-2 h-2 rounded-full transition-all ${
                  index < currentStep
                    ? skippedSteps.includes(step.id)
                      ? 'bg-white/20'
                      : 'bg-green-400'
                    : index === currentStep
                      ? 'bg-nero-400 w-6'
                      : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Current step content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-nero-500/20 flex items-center justify-center flex-shrink-0">
                    <StepIcon className="w-6 h-6 text-nero-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-semibold text-lg">{currentStepData.title}</h3>
                    <p className="text-sm text-white/60 mt-1">{currentStepData.description}</p>
                  </div>
                </div>

                {/* Step-specific content */}
                {currentStepData.id === 'capture' && (
                  <div className="space-y-2">
                    <label className="text-sm text-white/70">{currentStepData.prompt}</label>
                    <textarea
                      value={stepInputs.capture || ''}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder="Type your thoughts here..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-nero-500/50 resize-none"
                      rows={3}
                      autoFocus
                    />
                  </div>
                )}

                {currentStepData.id === 'bookmark' && (
                  <div className="space-y-2">
                    <label className="text-sm text-white/70">{currentStepData.prompt}</label>
                    <input
                      type="text"
                      value={stepInputs.bookmark || ''}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder="e.g., Halfway through writing the intro..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-nero-500/50"
                      autoFocus
                    />
                  </div>
                )}

                {currentStepData.id === 'reset' && (
                  <div className="space-y-4">
                    <p className="text-white/70 text-center">{currentStepData.prompt}</p>

                    {/* Breathing animation */}
                    <div className="flex flex-col items-center py-4">
                      {isTimerRunning ? (
                        <>
                          <motion.div
                            animate={{
                              scale: [1, 1.3, 1.3, 1],
                            }}
                            transition={{
                              duration: 8,
                              repeat: Infinity,
                              times: [0, 0.375, 0.625, 1],
                            }}
                            className="w-24 h-24 rounded-full bg-gradient-to-br from-calm-400/30 to-focus-400/30 flex items-center justify-center"
                          >
                            <span className="text-2xl font-display font-semibold">{timeRemaining}s</span>
                          </motion.div>
                          <motion.p
                            animate={{
                              opacity: [0.5, 1, 1, 0.5],
                            }}
                            transition={{
                              duration: 8,
                              repeat: Infinity,
                              times: [0, 0.375, 0.625, 1],
                            }}
                            className="mt-4 text-white/60"
                          >
                            {timeRemaining > 22 ? 'Breathe in...' : timeRemaining > 15 ? 'Hold...' : timeRemaining > 7 ? 'Breathe out...' : 'Hold...'}
                          </motion.p>
                        </>
                      ) : timeRemaining === 0 && skippedSteps.length === 0 ? (
                        <div className="text-center">
                          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-2" />
                          <p className="text-white/70">Mind cleared. Ready to focus!</p>
                        </div>
                      ) : (
                        <button
                          onClick={startBreathingTimer}
                          className="flex items-center gap-2 px-6 py-3 bg-calm-500/20 hover:bg-calm-500/30 rounded-xl text-calm-300 transition-colors"
                        >
                          <Play className="w-5 h-5" />
                          <span>Start Breathing Exercise</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {currentStepData.id === 'firstStep' && (
                  <div className="space-y-2">
                    <label className="text-sm text-white/70">{currentStepData.prompt}</label>
                    <input
                      type="text"
                      value={stepInputs.firstStep || ''}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder="e.g., Open the document..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-nero-500/50"
                      autoFocus
                    />
                    {toTask && (
                      <p className="text-sm text-white/40 mt-2">
                        Next task: {toTask.title}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer actions */}
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-white/50 hover:text-white/70 transition-colors text-sm"
            >
              Skip this step
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-nero-500 hover:bg-nero-600 rounded-xl text-white font-medium transition-colors"
            >
              {currentStep === TRANSITION_STEPS.length - 1 ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Start Fresh</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
