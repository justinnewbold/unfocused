import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  Target,
  Brain,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  MapPin,
  Eye,
  EyeOff,
  AlertCircle,
  Timer,
  BarChart3,
  Keyboard
} from 'lucide-react'

// Import hooks
import { useReducedMotion, getMotionProps } from './hooks/useReducedMotion'
import { useKeyboardShortcuts, useShortcutsHelp } from './hooks/useKeyboardShortcuts'

// Import components
import EnergyCheckIn from './components/EnergyCheckIn'
import BreadcrumbTrail from './components/BreadcrumbTrail'
import OneThingMode from './components/OneThingMode'
import ThinkingStream from './components/ThinkingStream'
import ConversationView from './components/ConversationView'
import FocusTimer from './components/FocusTimer'
import InsightsDashboard, { updateStat, initTodayStats } from './components/InsightsDashboard'
import KeyboardShortcuts from './components/KeyboardShortcuts'
import QuickCapture from './components/QuickCapture'
import AmbientSounds from './components/AmbientSounds'
import Celebration, { useCelebration } from './components/Celebration'

// View modes
const VIEW_MODES = {
  CONVERSATION: 'conversation',
  ONE_THING: 'one_thing',
  BREADCRUMBS: 'breadcrumbs',
  FOCUS_TIMER: 'focus_timer',
  INSIGHTS: 'insights',
}

export default function App() {
  const prefersReducedMotion = useReducedMotion()
  const { showHelp: showShortcutsHelp, setShowHelp: setShowShortcutsHelp } = useShortcutsHelp()

  // Core state
  const [viewMode, setViewMode] = useState(VIEW_MODES.CONVERSATION)
  const [energyLevel, setEnergyLevel] = useState(3)
  const [showEnergyCheckIn, setShowEnergyCheckIn] = useState(false)
  const [thinkingStreamLevel, setThinkingStreamLevel] = useState('off') // Defaulted to off for less cognitive load

  // Stats tracking
  const [tasksCompleted, setTasksCompleted] = useState(0)
  const [focusSessions, setFocusSessions] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  // Celebration system
  const { celebration, celebrate, dismiss: dismissCelebration } = useCelebration()

  // Quick captures storage
  const [captures, setCaptures] = useState([])

  // Initialize stats on mount
  useEffect(() => {
    initTodayStats()
  }, [])

  // Demo data for breadcrumbs - simplified structure (what + why)
  const [breadcrumbs, setBreadcrumbs] = useState([
    {
      id: '1',
      activity: 'Cleaning the kitchen drawer',
      context: 'Looking for the screwdriver',
      createdAt: new Date(Date.now() - 1000 * 60 * 5),
    },
    {
      id: '2',
      activity: 'Searching for drill bits',
      context: 'Realized the screw is stripped',
      createdAt: new Date(Date.now() - 1000 * 60 * 3),
    },
    {
      id: '3',
      activity: 'Phone call with Mom',
      context: 'She called about Sunday dinner',
      createdAt: new Date(Date.now() - 1000 * 60 * 1),
    },
  ])

  // Demo task for One Thing mode
  const [currentTask, setCurrentTask] = useState({
    id: '1',
    title: 'Find the Phillips head screwdriver',
    description: 'Check the garage toolbox first',
    energyRequired: 2,
    reason: 'This is the smallest step to get back on track',
    isCompleted: false,
  })

  // Conversation state
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey! I noticed you've been bouncing between a few things. Want me to help you get back on track? I've been keeping notes on where you left off.",
      thinking: null,
    }
  ])

  // Check if first visit - show energy check-in
  useEffect(() => {
    const lastCheckIn = localStorage.getItem('lastEnergyCheckIn')
    const today = new Date().toDateString()

    if (lastCheckIn !== today) {
      setShowEnergyCheckIn(true)
    }
  }, [])

  const handleEnergySubmit = (level, mood, message) => {
    setEnergyLevel(level)
    setShowEnergyCheckIn(false)
    localStorage.setItem('lastEnergyCheckIn', new Date().toDateString())

    // Track energy level in insights
    updateStat('energyLevels', level, 'push')

    // Add a contextual message from Nero
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: message,
      thinking: thinkingStreamLevel !== 'off' ? `Analyzing energy level... Adjusting task suggestions to match current capacity.` : null,
    }])
  }

  const handleTaskComplete = () => {
    setCurrentTask(prev => ({ ...prev, isCompleted: true }))
    const newCount = tasksCompleted + 1
    setTasksCompleted(newCount)
    updateStat('tasksCompleted', 1, 'increment')

    // Trigger celebration
    celebrate('task', newCount)

    // Celebration message (delayed for after confetti)
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Done! That's momentum building. Want to tackle another quick win, or check your breadcrumbs?",
        thinking: null,
      }])
    }, 2000)
  }

  // Focus session complete handler
  const handleFocusSessionComplete = (totalSessions) => {
    setFocusSessions(totalSessions)
    updateStat('focusSessions', 1, 'increment')

    // Trigger celebration
    celebrate('session', totalSessions)
  }

  // Quick capture handler
  const handleQuickCapture = (capture) => {
    setCaptures(prev => [capture, ...prev])

    // Add feedback message from Nero
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: capture.type === 'task'
        ? `Got it! I've added "${capture.text}" to your tasks. You can tackle it when you're ready.`
        : capture.type === 'idea'
          ? `Interesting idea captured! "${capture.text}" - I'll keep it safe for when you want to explore it.`
          : `Thought captured: "${capture.text}" - Your brain thanks you for the dump!`,
      thinking: null,
    }])
  }

  // Create task from quick capture
  const handleCreateTaskFromCapture = (task) => {
    setCurrentTask(task)
    setViewMode(VIEW_MODES.ONE_THING)
  }

  const resolveBreadcrumb = (id) => {
    setBreadcrumbs(prev => prev.filter(b => b.id !== id))
    updateStat('breadcrumbsResolved', 1, 'increment')
  }

  const toggleThinkingStream = () => {
    const levels = ['off', 'minimal', 'full']
    const currentIndex = levels.indexOf(thinkingStreamLevel)
    const nextIndex = (currentIndex + 1) % levels.length
    setThinkingStreamLevel(levels[nextIndex])
  }

  // Quick interrupt handler - drops a breadcrumb instantly
  const handleInterrupt = useCallback(() => {
    const newBreadcrumb = {
      id: Date.now().toString(),
      activity: currentTask.title || 'Current task',
      context: 'Got interrupted',
      createdAt: new Date(),
    }

    setBreadcrumbs(prev => [newBreadcrumb, ...prev])
    updateStat('breadcrumbsDropped', 1, 'increment')

    // Add feedback message
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: "Breadcrumb dropped! I'll remember where you were. Go handle what you need to - I've got your back.",
      thinking: null,
    }])

    // Switch to breadcrumbs view to show it worked
    setViewMode(VIEW_MODES.BREADCRUMBS)
  }, [currentTask.title, setMessages])

  // Get energy display info
  const getEnergyDisplay = () => {
    if (energyLevel <= 2) {
      return { icon: BatteryLow, color: 'text-orange-400', label: 'Low' }
    } else if (energyLevel <= 3) {
      return { icon: BatteryMedium, color: 'text-yellow-400', label: 'Med' }
    } else {
      return { icon: BatteryFull, color: 'text-green-400', label: 'High' }
    }
  }

  const energyDisplay = getEnergyDisplay()
  const EnergyIcon = energyDisplay.icon

  // State for quick capture modal
  const [showQuickCapture, setShowQuickCapture] = useState(false)

  // Keyboard shortcuts configuration
  const shortcuts = useMemo(() => [
    // Navigation shortcuts (1-5)
    { key: '1', action: () => setViewMode(VIEW_MODES.CONVERSATION) },
    { key: '2', action: () => setViewMode(VIEW_MODES.ONE_THING) },
    { key: '3', action: () => setViewMode(VIEW_MODES.BREADCRUMBS) },
    { key: '4', action: () => setViewMode(VIEW_MODES.FOCUS_TIMER) },
    { key: '5', action: () => setViewMode(VIEW_MODES.INSIGHTS) },
    // Action shortcuts
    { key: 'i', action: handleInterrupt },
    { key: 'e', action: () => setShowEnergyCheckIn(true) },
    { key: 'q', action: () => setShowQuickCapture(true) },
    // Space for context-sensitive action
    {
      key: ' ',
      action: () => {
        if (viewMode === VIEW_MODES.ONE_THING && !currentTask.isCompleted) {
          handleTaskComplete()
        }
      }
    },
  ], [viewMode, currentTask.isCompleted, handleInterrupt])

  // Register keyboard shortcuts
  useKeyboardShortcuts(shortcuts)

  // Animation variants
  const pageVariants = {
    conversation: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 }
    },
    oneThing: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 }
    },
    breadcrumbs: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 }
    }
  }

  return (
    <div className="min-h-screen bg-surface-dark text-white">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-surface-dark via-surface to-surface-dark pointer-events-none" />
      <div className="fixed inset-0 one-thing-spotlight pointer-events-none opacity-50" />

      {/* Energy Check-In Modal */}
      <AnimatePresence>
        {showEnergyCheckIn && (
          <EnergyCheckIn
            onSubmit={handleEnergySubmit}
            onSkip={() => setShowEnergyCheckIn(false)}
          />
        )}
      </AnimatePresence>

      {/* Main container */}
      <div className="relative max-w-2xl mx-auto min-h-screen flex flex-col">
        {/* Header - simplified, less height */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-surface-dark/80 border-b border-white/5">
          <div className="px-4 py-3 flex items-center justify-between">
            {/* Logo & Name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nero-400 to-nero-600 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-display font-semibold text-lg">Nero</h1>
                <p className="text-xs text-white/50 hidden sm:block">Your ADHD companion</p>
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-2">
              {/* Quick interrupt button */}
              <button
                onClick={handleInterrupt}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 transition-colors min-h-[44px]"
                title="Drop a breadcrumb - I got interrupted!"
              >
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-medium hidden sm:inline">Interrupted!</span>
              </button>

              {/* Energy indicator */}
              <button
                onClick={() => setShowEnergyCheckIn(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors min-h-[44px]"
              >
                <EnergyIcon className={`w-4 h-4 ${energyDisplay.color}`} />
                <span className="text-xs font-medium">{energyDisplay.label}</span>
              </button>

              {/* Thinking stream toggle */}
              <button
                onClick={toggleThinkingStream}
                className={`p-2 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  thinkingStreamLevel !== 'off'
                    ? 'bg-nero-500/20 text-nero-400'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
                title={`Thinking stream: ${thinkingStreamLevel}`}
              >
                {thinkingStreamLevel === 'off' ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>

              {/* Keyboard shortcuts hint */}
              <button
                onClick={() => setShowShortcutsHelp(true)}
                className="p-2 rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center hidden sm:flex"
                title="Keyboard shortcuts (?)"
              >
                <Keyboard className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main content area - adjusted padding for bottom nav */}
        <main className="flex-1 overflow-hidden pb-20">
          <AnimatePresence mode="wait">
            {viewMode === VIEW_MODES.CONVERSATION && (
              <motion.div
                key="conversation"
                {...getMotionProps(prefersReducedMotion, pageVariants.conversation)}
                className="h-full"
              >
                <ConversationView
                  messages={messages}
                  setMessages={setMessages}
                  thinkingStreamLevel={thinkingStreamLevel}
                  energyLevel={energyLevel}
                />
              </motion.div>
            )}

            {viewMode === VIEW_MODES.ONE_THING && (
              <motion.div
                key="one-thing"
                {...getMotionProps(prefersReducedMotion, pageVariants.oneThing)}
                className="h-full"
              >
                <OneThingMode
                  task={currentTask}
                  onComplete={handleTaskComplete}
                  onSkip={() => setCurrentTask(prev => ({
                    ...prev,
                    title: 'Check your calendar for Sunday',
                    isCompleted: false
                  }))}
                  energyLevel={energyLevel}
                />
              </motion.div>
            )}

            {viewMode === VIEW_MODES.BREADCRUMBS && (
              <motion.div
                key="breadcrumbs"
                {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)}
                className="h-full"
              >
                <BreadcrumbTrail
                  breadcrumbs={breadcrumbs}
                  onResolve={resolveBreadcrumb}
                  onJumpTo={(breadcrumb) => {
                    setCurrentTask({
                      id: breadcrumb.id,
                      title: breadcrumb.activity,
                      description: breadcrumb.context,
                      energyRequired: 2,
                      reason: `Getting back to where you left off`,
                      isCompleted: false,
                    })
                    setViewMode(VIEW_MODES.ONE_THING)
                  }}
                />
              </motion.div>
            )}

            {viewMode === VIEW_MODES.FOCUS_TIMER && (
              <motion.div
                key="focus-timer"
                {...getMotionProps(prefersReducedMotion, pageVariants.oneThing)}
                className="h-full"
              >
                <FocusTimer
                  energyLevel={energyLevel}
                  onSessionComplete={handleFocusSessionComplete}
                  onTimerStateChange={setIsTimerRunning}
                />
              </motion.div>
            )}

            {viewMode === VIEW_MODES.INSIGHTS && (
              <motion.div
                key="insights"
                {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)}
                className="h-full"
              >
                <InsightsDashboard
                  tasksCompleted={tasksCompleted}
                  focusSessions={focusSessions}
                  breadcrumbsCount={breadcrumbs.length}
                  energyLevel={energyLevel}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Keyboard Shortcuts Help Overlay */}
        <KeyboardShortcuts
          show={showShortcutsHelp}
          onClose={() => setShowShortcutsHelp(false)}
        />

        {/* Quick Capture FAB and Modal */}
        <QuickCapture
          onCapture={handleQuickCapture}
          onCreateTask={handleCreateTaskFromCapture}
        />

        {/* Ambient Sounds Mini Player */}
        <AmbientSounds isTimerRunning={isTimerRunning} />

        {/* Celebration Overlay */}
        <Celebration
          celebration={celebration}
          onDismiss={dismissCelebration}
        />

        {/* Bottom Navigation - Mobile-first design */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-surface-dark/90 border-t border-white/10 safe-area-bottom">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-around items-center px-2 py-2">
              {[
                { id: VIEW_MODES.CONVERSATION, icon: MessageCircle, label: 'Chat', shortcut: '1' },
                { id: VIEW_MODES.ONE_THING, icon: Target, label: 'One Thing', shortcut: '2' },
                { id: VIEW_MODES.BREADCRUMBS, icon: MapPin, label: 'Trail', badge: breadcrumbs.length, shortcut: '3' },
                { id: VIEW_MODES.FOCUS_TIMER, icon: Timer, label: 'Timer', shortcut: '4' },
                { id: VIEW_MODES.INSIGHTS, icon: BarChart3, label: 'Insights', shortcut: '5' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id)}
                  className={`relative flex flex-col items-center gap-0.5 px-2 sm:px-3 py-2 rounded-xl transition-all min-h-[52px] ${
                    viewMode === tab.id
                      ? 'bg-nero-500/20 text-nero-400'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <div className="relative">
                    <tab.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    {tab.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-nero-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {tab.badge > 9 ? '9+' : tab.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </div>
  )
}
