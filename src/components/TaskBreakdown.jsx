import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Scissors,
  Plus,
  Check,
  ChevronRight,
  Sparkles,
  Clock,
  Zap,
  Play,
  RotateCcw,
  Lightbulb,
  FileText,
  Mail,
  Code,
  Home,
  ShoppingCart,
  Phone,
  Pencil,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Task templates for common task types
const TASK_TEMPLATES = {
  email: {
    name: 'Write Email',
    icon: Mail,
    steps: [
      'Open email client',
      'Click compose/new email',
      'Type recipient address',
      'Write subject line (5 words max)',
      'Write first sentence only',
      'Add 2-3 key points',
      'Write closing line',
      'Review for typos',
      'Click send',
    ],
  },
  document: {
    name: 'Write Document',
    icon: FileText,
    steps: [
      'Open blank document',
      'Write the title',
      'List 3 main sections as headers',
      'Write first paragraph of section 1',
      'Add bullet points for section 1',
      'Move to section 2, repeat',
      'Move to section 3, repeat',
      'Add intro paragraph',
      'Review and polish',
    ],
  },
  coding: {
    name: 'Coding Task',
    icon: Code,
    steps: [
      'Read the requirements once',
      'Write pseudo-code or comments',
      'Set up the file/function structure',
      'Implement the simplest part first',
      'Test that small piece',
      'Add the next piece',
      'Test again',
      'Refactor if needed',
      'Final test and commit',
    ],
  },
  cleaning: {
    name: 'Cleaning Task',
    icon: Home,
    steps: [
      'Set a 10-minute timer',
      'Pick up obvious trash first',
      'Put away 5 items that have homes',
      'Clear one surface completely',
      'Wipe that surface down',
      'Move to next surface',
      'Quick vacuum/sweep visible floor',
      'Take out any collected trash',
      'Done! Celebrate the progress',
    ],
  },
  shopping: {
    name: 'Shopping/Errands',
    icon: ShoppingCart,
    steps: [
      'Write list on phone/paper',
      'Check what you already have',
      'Group items by store/location',
      'Get keys, wallet, bags',
      'Drive/walk to first location',
      'Get items from list only',
      'Check off as you go',
      'Pay and leave',
      'Put items away at home',
    ],
  },
  phone_call: {
    name: 'Phone Call',
    icon: Phone,
    steps: [
      'Write down what you need to say',
      'Note any questions to ask',
      'Find the phone number',
      'Find a quiet spot',
      'Take a breath',
      'Dial the number',
      'State your name and purpose',
      'Ask your questions',
      'Confirm next steps before hanging up',
    ],
  },
}

// Keyword matching for auto-suggestions
const KEYWORD_MATCHES = {
  email: ['email', 'mail', 'send', 'reply', 'respond', 'message'],
  document: ['write', 'document', 'report', 'essay', 'article', 'draft'],
  coding: ['code', 'program', 'function', 'bug', 'feature', 'implement', 'fix'],
  cleaning: ['clean', 'tidy', 'organize', 'declutter', 'room', 'kitchen', 'bathroom'],
  shopping: ['buy', 'shop', 'store', 'errand', 'grocery', 'pick up'],
  phone_call: ['call', 'phone', 'contact', 'schedule', 'appointment'],
}

// Detect template from task text
const detectTemplate = (taskText) => {
  const lower = taskText.toLowerCase()
  for (const [templateKey, keywords] of Object.entries(KEYWORD_MATCHES)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return templateKey
    }
  }
  return null
}

// Generate custom micro-steps
const generateMicroSteps = (taskText) => {
  return [
    `Open/prepare what you need for: "${taskText}"`,
    'Identify the very first physical action',
    'Do that one action (nothing else)',
    'Identify the next tiny step',
    'Complete it',
    'Check: are you 25% done?',
    'Continue with next small action',
    'Check: are you 50% done?',
    'Keep going, you\'re doing great',
    'Final review and wrap-up',
  ]
}

export default function TaskBreakdown({ currentTask, onStartTask, onCreateMicroTask }) {
  const prefersReducedMotion = useReducedMotion()
  const [taskInput, setTaskInput] = useState(currentTask?.title || '')
  const [microSteps, setMicroSteps] = useState([])
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [isBreakingDown, setIsBreakingDown] = useState(false)
  const [customStepInput, setCustomStepInput] = useState('')

  // Detect suggested template
  const suggestedTemplate = useMemo(() => {
    if (!taskInput) return null
    return detectTemplate(taskInput)
  }, [taskInput])

  const handleBreakdown = (templateKey = null) => {
    setIsBreakingDown(true)

    // Simulate thinking delay for effect
    setTimeout(() => {
      if (templateKey && TASK_TEMPLATES[templateKey]) {
        setMicroSteps(TASK_TEMPLATES[templateKey].steps.map((text, i) => ({
          id: i,
          text,
          estimatedMinutes: 2,
        })))
      } else {
        setMicroSteps(generateMicroSteps(taskInput).map((text, i) => ({
          id: i,
          text,
          estimatedMinutes: 2,
        })))
      }
      setCompletedSteps(new Set())
      setIsBreakingDown(false)
    }, 500)
  }

  const handleToggleStep = (stepId) => {
    setCompletedSteps(prev => {
      const next = new Set(prev)
      if (next.has(stepId)) {
        next.delete(stepId)
      } else {
        next.add(stepId)
      }
      return next
    })
  }

  const handleAddCustomStep = () => {
    if (!customStepInput.trim()) return

    setMicroSteps(prev => [...prev, {
      id: Date.now(),
      text: customStepInput,
      estimatedMinutes: 2,
    }])
    setCustomStepInput('')
  }

  const handleStartFirstStep = () => {
    if (microSteps.length > 0) {
      const firstIncomplete = microSteps.find(s => !completedSteps.has(s.id))
      if (firstIncomplete && onCreateMicroTask) {
        onCreateMicroTask({
          id: Date.now().toString(),
          title: firstIncomplete.text,
          description: `Micro-step from: ${taskInput}`,
          energyRequired: 1,
          reason: 'This is the smallest next action',
          isCompleted: false,
        })
      }
    }
  }

  const handleReset = () => {
    setMicroSteps([])
    setCompletedSteps(new Set())
    setTaskInput('')
  }

  const progress = microSteps.length > 0
    ? Math.round((completedSteps.size / microSteps.length) * 100)
    : 0

  return (
    <div className="p-4 h-full overflow-auto">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-400 text-sm mb-3">
            <Scissors className="w-4 h-4" />
            <span>Task Breakdown</span>
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Break It Down</h1>
          <p className="text-white/60">Turn overwhelming tasks into tiny, doable steps</p>
        </div>

        {/* Task Input */}
        {microSteps.length === 0 && (
          <motion.div
            {...getMotionProps(prefersReducedMotion, {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
            })}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm text-white/70">What task feels too big?</label>
              <input
                type="text"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="e.g., Write the project report"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-nero-500/50"
              />
            </div>

            {/* Template suggestion */}
            {suggestedTemplate && (
              <motion.div
                {...getMotionProps(prefersReducedMotion, {
                  initial: { opacity: 0, scale: 0.95 },
                  animate: { opacity: 1, scale: 1 },
                })}
                className="p-3 bg-nero-500/10 border border-nero-500/20 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <Lightbulb className="w-5 h-5 text-nero-400" />
                  <div className="flex-1">
                    <p className="text-sm">
                      This looks like a <span className="font-medium text-nero-400">{TASK_TEMPLATES[suggestedTemplate].name}</span> task
                    </p>
                  </div>
                  <button
                    onClick={() => handleBreakdown(suggestedTemplate)}
                    className="px-3 py-1.5 bg-nero-500 hover:bg-nero-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    Use Template
                  </button>
                </div>
              </motion.div>
            )}

            {/* Template buttons */}
            <div className="space-y-2">
              <p className="text-sm text-white/50">Or choose a template:</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(TASK_TEMPLATES).map(([key, template]) => {
                  const Icon = template.icon
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setTaskInput(template.name)
                        handleBreakdown(key)
                      }}
                      className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-left"
                    >
                      <Icon className="w-4 h-4 text-white/50" />
                      <span className="text-sm">{template.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom breakdown button */}
            <button
              onClick={() => handleBreakdown()}
              disabled={!taskInput.trim() || isBreakingDown}
              className="w-full flex items-center justify-center gap-2 py-3 bg-nero-500 hover:bg-nero-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-colors"
            >
              {isBreakingDown ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                  Breaking down...
                </>
              ) : (
                <>
                  <Scissors className="w-5 h-5" />
                  Break It Down
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Micro Steps List */}
        {microSteps.length > 0 && (
          <motion.div
            {...getMotionProps(prefersReducedMotion, {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
            })}
            className="space-y-4"
          >
            {/* Task header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/50">Breaking down:</p>
                <p className="font-medium">{taskInput}</p>
              </div>
              <button
                onClick={handleReset}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="Start over"
              >
                <RotateCcw className="w-5 h-5 text-white/50" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Progress</span>
                <span className="text-nero-400 font-medium">{progress}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-nero-500 to-nero-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-2">
              {microSteps.map((step, index) => {
                const isCompleted = completedSteps.has(step.id)
                const isNext = !isCompleted &&
                  microSteps.slice(0, index).every(s => completedSteps.has(s.id))

                return (
                  <motion.button
                    key={step.id}
                    onClick={() => handleToggleStep(step.id)}
                    {...getMotionProps(prefersReducedMotion, {
                      initial: { opacity: 0, x: -20 },
                      animate: { opacity: 1, x: 0 },
                      transition: { delay: index * 0.05 },
                    })}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      isCompleted
                        ? 'bg-green-500/10 border border-green-500/20'
                        : isNext
                          ? 'bg-nero-500/10 border border-nero-500/30 ring-2 ring-nero-500/20'
                          : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isNext
                          ? 'bg-nero-500 text-white'
                          : 'bg-white/10 text-white/50'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-bold">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={isCompleted ? 'line-through text-white/50' : ''}>
                        {step.text}
                      </p>
                    </div>
                    {isNext && (
                      <span className="px-2 py-0.5 bg-nero-500 rounded text-xs font-medium">
                        Next
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-white/30 text-xs">
                      <Clock className="w-3 h-3" />
                      ~{step.estimatedMinutes}m
                    </div>
                  </motion.button>
                )
              })}
            </div>

            {/* Add custom step */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customStepInput}
                onChange={(e) => setCustomStepInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomStep()}
                placeholder="Add a custom step..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-nero-500/50"
              />
              <button
                onClick={handleAddCustomStep}
                disabled={!customStepInput.trim()}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleStartFirstStep}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-nero-500 hover:bg-nero-600 rounded-xl font-medium transition-colors"
              >
                <Play className="w-5 h-5" />
                Start First Step
              </button>
            </div>

            {/* Encouragement */}
            {progress > 0 && progress < 100 && (
              <div className="p-3 bg-white/5 rounded-xl text-center">
                <p className="text-sm text-white/60">
                  {progress < 30 && "You've started! That's the hardest part. Keep going!"}
                  {progress >= 30 && progress < 60 && "Making progress! You're doing great."}
                  {progress >= 60 && progress < 90 && "More than halfway! The end is in sight."}
                  {progress >= 90 && "Almost there! Just a little more!"}
                </p>
              </div>
            )}

            {progress === 100 && (
              <motion.div
                {...getMotionProps(prefersReducedMotion, {
                  initial: { opacity: 0, scale: 0.9 },
                  animate: { opacity: 1, scale: 1 },
                })}
                className="p-4 bg-gradient-to-r from-green-500/20 to-nero-500/20 rounded-xl text-center border border-green-500/20"
              >
                <Zap className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="font-display font-semibold text-lg">Task Complete!</p>
                <p className="text-sm text-white/60">You broke it down and conquered it!</p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Tip */}
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-sm text-white/60">
            <Lightbulb className="w-4 h-4 inline mr-1 text-amber-400" />
            <span className="text-amber-400 font-medium">ADHD Tip:</span> The hardest part is starting.
            Make step 1 so tiny it feels almost silly. "Open the document" beats "Write the intro."
          </p>
        </div>
      </div>
    </div>
  )
}
