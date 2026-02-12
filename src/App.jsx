import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
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
  Keyboard,
  ListTodo,
  CalendarCheck,
  AlertTriangle,
  Clock,
  Trophy,
  Layers,
  Sparkles,
  Heart,
  Calendar,
  Scissors,
  Shield,
  Download,
  MoreHorizontal,
} from 'lucide-react'

// Import hooks
import { useReducedMotion, getMotionProps } from './hooks/useReducedMotion'
import { useKeyboardShortcuts, useShortcutsHelp } from './hooks/useKeyboardShortcuts'

// Import error boundary for view-level error catching
import { ViewErrorBoundary } from './components/ErrorBoundary'

// Eagerly loaded components (always visible / needed immediately)
import EnergyCheckIn from './components/EnergyCheckIn'
import ConversationView from './components/ConversationView'
import KeyboardShortcuts from './components/KeyboardShortcuts'
import QuickCapture from './components/QuickCapture'
import Celebration, { useCelebration } from './components/Celebration'
import RewardSystem, { useRewardSystem, LevelUpModal, XpToast } from './components/RewardSystem'
import { updateStat, initTodayStats } from './components/InsightsDashboard'
import { recordTaskStart } from './components/SmartSuggestions'
import DataExport from './components/DataExport'
import MoreMenu from './components/MoreMenu'

// Lazy-loaded view components (loaded on demand per view)
const BreadcrumbTrail = lazy(() => import('./components/BreadcrumbTrail'))
const OneThingMode = lazy(() => import('./components/OneThingMode'))
const FocusTimer = lazy(() => import('./components/FocusTimer'))
const InsightsDashboard = lazy(() => import('./components/InsightsDashboard'))
const TaskQueue = lazy(() => import('./components/TaskQueue'))
const DailyRoutines = lazy(() => import('./components/DailyRoutines'))
const DistractionLog = lazy(() => import('./components/DistractionLog'))
const TimeEstimation = lazy(() => import('./components/TimeEstimation'))
const ContextBundles = lazy(() => import('./components/ContextBundles'))
const SmartSuggestions = lazy(() => import('./components/SmartSuggestions'))
const EmotionalRegulation = lazy(() => import('./components/EmotionalRegulation'))
const WeeklyReview = lazy(() => import('./components/WeeklyReview'))
const TaskBreakdown = lazy(() => import('./components/TaskBreakdown'))
const HyperfocusGuard = lazy(() => import('./components/HyperfocusGuard'))
const ExternalBrain = lazy(() => import('./components/ExternalBrain'))

// Lazy-loaded extended feature components (accessible from More menu)
const MedicationReminder = lazy(() => import('./components/MedicationReminder'))
const SleepTracker = lazy(() => import('./components/SleepTracker'))
const MovementBreaks = lazy(() => import('./components/MovementBreaks'))
const MoodTracker = lazy(() => import('./components/MoodTracker'))
const DopamineMenu = lazy(() => import('./components/DopamineMenu'))
const WinsJournal = lazy(() => import('./components/WinsJournal'))
const RejectionJournal = lazy(() => import('./components/RejectionJournal'))
const SelfCompassion = lazy(() => import('./components/SelfCompassion'))
const ObjectFinder = lazy(() => import('./components/ObjectFinder'))
const WaitingMode = lazy(() => import('./components/WaitingMode'))
const DecisionHelper = lazy(() => import('./components/DecisionHelper'))
const WorkingMemoryAid = lazy(() => import('./components/WorkingMemoryAid'))
const DeadlineCountdown = lazy(() => import('./components/DeadlineCountdown'))
const ProjectView = lazy(() => import('./components/ProjectView'))
const TaskPrioritizer = lazy(() => import('./components/TaskPrioritizer'))
const TemplateLibrary = lazy(() => import('./components/TemplateLibrary'))
const AppointmentBuffer = lazy(() => import('./components/AppointmentBuffer'))
const FocusRooms = lazy(() => import('./components/FocusRooms'))
const DistractionBlocking = lazy(() => import('./components/DistractionBlocking'))
const LocationContext = lazy(() => import('./components/LocationContext'))
const CustomSounds = lazy(() => import('./components/CustomSounds'))
const MusicIntegration = lazy(() => import('./components/MusicIntegration'))
const AccountabilityPartner = lazy(() => import('./components/AccountabilityPartner'))
const CommunityFeed = lazy(() => import('./components/CommunityFeed'))
const FamilyMode = lazy(() => import('./components/FamilyMode'))
const TherapistPortal = lazy(() => import('./components/TherapistPortal'))
const CorrelationInsights = lazy(() => import('./components/CorrelationInsights'))
const ProgressVisualization = lazy(() => import('./components/ProgressVisualization'))
const ExportReports = lazy(() => import('./components/ExportReports'))
const PredictiveSuggestions = lazy(() => import('./components/PredictiveSuggestions'))
const VoiceAssistant = lazy(() => import('./components/VoiceAssistant'))
const VoiceNotes = lazy(() => import('./components/VoiceNotes'))
const CalendarIntegration = lazy(() => import('./components/CalendarIntegration'))
const NoteAppSync = lazy(() => import('./components/NoteAppSync'))
const AchievementBadges = lazy(() => import('./components/AchievementBadges'))
const AvatarPetSystem = lazy(() => import('./components/AvatarPetSystem'))
const ChallengesMode = lazy(() => import('./components/ChallengesMode'))
const AccessibilitySettings = lazy(() => import('./components/AccessibilitySettings'))
const DarkModeSettings = lazy(() => import('./components/DarkModeSettings'))
const NeroPersonality = lazy(() => import('./components/NeroPersonality'))
const ShortcutActions = lazy(() => import('./components/ShortcutActions'))
const WearableSync = lazy(() => import('./components/WearableSync'))
const WidgetSupport = lazy(() => import('./components/WidgetSupport'))

// Lazy-loaded overlay components
const AmbientSounds = lazy(() => import('./components/AmbientSounds'))
const BodyDoubling = lazy(() => import('./components/BodyDoubling'))
const FocusShield = lazy(() => import('./components/FocusShield'))
const TransitionHelper = lazy(() => import('./components/TransitionHelper'))

// Loading fallback for lazy components
function ViewLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-nero-500/30 border-t-nero-500 animate-spin" />
        <p className="text-white/40 text-sm">Loading...</p>
      </div>
    </div>
  )
}

// View modes - core views + all extended features
const VIEW_MODES = {
  // Core views (in bottom nav)
  CONVERSATION: 'conversation',
  ONE_THING: 'one_thing',
  BREADCRUMBS: 'breadcrumbs',
  FOCUS_TIMER: 'focus_timer',
  INSIGHTS: 'insights',
  TASK_QUEUE: 'task_queue',
  ROUTINES: 'routines',
  DISTRACTIONS: 'distractions',
  TIME_TRAINING: 'time_training',
  REWARDS: 'rewards',
  BUNDLES: 'bundles',
  SUGGESTIONS: 'suggestions',
  EMOTIONS: 'emotions',
  WEEKLY_REVIEW: 'weekly_review',
  BREAKDOWN: 'breakdown',
  HYPERFOCUS: 'hyperfocus',
  EXTERNAL_BRAIN: 'external_brain',
  // Extended features (accessible from More menu)
  MEDICATION: 'medication',
  SLEEP: 'sleep',
  MOVEMENT: 'movement',
  MOOD_TRACKER: 'mood_tracker',
  DOPAMINE: 'dopamine',
  WINS: 'wins',
  REJECTION: 'rejection',
  SELF_COMPASSION: 'self_compassion',
  OBJECT_FINDER: 'object_finder',
  WAITING: 'waiting',
  DECISION: 'decision',
  WORKING_MEMORY: 'working_memory',
  DEADLINE: 'deadline',
  PROJECT: 'project',
  PRIORITIZER: 'prioritizer',
  TEMPLATES: 'templates',
  APPOINTMENT: 'appointment',
  FOCUS_ROOMS: 'focus_rooms',
  DISTRACTION_BLOCK: 'distraction_block',
  LOCATION: 'location',
  CUSTOM_SOUNDS: 'custom_sounds',
  MUSIC: 'music',
  ACCOUNTABILITY: 'accountability',
  COMMUNITY: 'community',
  FAMILY: 'family',
  THERAPIST: 'therapist',
  CORRELATIONS: 'correlations',
  PROGRESS: 'progress',
  EXPORT_REPORTS: 'export_reports',
  PREDICTIONS: 'predictions',
  VOICE_ASSISTANT: 'voice_assistant',
  VOICE_NOTES: 'voice_notes',
  CALENDAR_SYNC: 'calendar_sync',
  NOTE_SYNC: 'note_sync',
  BADGES: 'badges',
  PET: 'pet',
  CHALLENGES: 'challenges',
  ACCESSIBILITY: 'accessibility',
  DARK_MODE: 'dark_mode',
  NERO_PERSONALITY: 'nero_personality',
  SHORTCUT_ACTIONS: 'shortcut_actions',
  WEARABLE: 'wearable',
  WIDGETS: 'widgets',
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

  // Focus shield state
  const [isShieldActive, setIsShieldActive] = useState(false)

  // Transition helper state
  const [showTransition, setShowTransition] = useState(false)
  const [transitionFromTask, setTransitionFromTask] = useState(null)
  const [transitionToTask, setTransitionToTask] = useState(null)

  // Context bundles state
  const [activeBundle, setActiveBundle] = useState(null)

  // Reward system
  const rewards = useRewardSystem()

  // Session tracking for hyperfocus guard
  const [sessionStartTime, setSessionStartTime] = useState(null)

  // Track session start when timer starts
  useEffect(() => {
    if (isTimerRunning && !sessionStartTime) {
      setSessionStartTime(Date.now())
    } else if (!isTimerRunning) {
      setSessionStartTime(null)
    }
  }, [isTimerRunning, sessionStartTime])

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

    // Record in reward system
    rewards.recordTaskComplete()

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

    // Record in reward system
    rewards.recordFocusSession()

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

  // Select task from queue (with optional transition)
  const handleSelectTask = (task, skipTransition = false) => {
    if (!skipTransition && currentTask && !currentTask.isCompleted) {
      // Show transition helper when switching from an incomplete task
      handleStartTransition(task)
    } else {
      setCurrentTask(task)
      setViewMode(VIEW_MODES.ONE_THING)
    }
  }

  // Routine completion handler
  const handleRoutineComplete = (routineId) => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Great job completing your ${routineId} routine! Consistency is key, and you're building great habits.`,
      thinking: null,
    }])
    celebrate('task', tasksCompleted + 1)
  }

  // Distraction log handler
  const handleLogDistraction = (entry) => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Logged distraction: ${entry.type}. Tracking these helps identify patterns. Stay aware!`,
      thinking: null,
    }])
  }

  // Time estimation complete handler
  const handleTimeEstimationComplete = (entry) => {
    const accuracy = entry.accuracy
    let message
    if (accuracy >= 80) {
      message = `Great estimate! You were ${accuracy}% accurate. Your time sense is improving!`
    } else if (accuracy >= 50) {
      message = `Not bad! ${accuracy}% accuracy. Task took ${entry.actualMinutes}m vs your ${entry.estimatedMinutes}m estimate.`
    } else {
      message = `This one was tricky - ${accuracy}% accuracy. Tasks like this typically take longer than we think!`
    }
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: message,
      thinking: null,
    }])
  }

  // Transition helper handlers
  const handleStartTransition = (toTask) => {
    setTransitionFromTask(currentTask)
    setTransitionToTask(toTask)
    setShowTransition(true)
  }

  const handleTransitionComplete = (result) => {
    if (result.inputs.firstStep) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Great transition! Your first step: "${result.inputs.firstStep}". You've got this!`,
        thinking: null,
      }])
    }
    setShowTransition(false)
    setTransitionFromTask(null)
    setTransitionToTask(null)
  }

  const handleTransitionCapture = (capture) => {
    setCaptures(prev => [capture, ...prev])
  }

  const handleTransitionBreadcrumb = (data) => {
    const newBreadcrumb = {
      id: Date.now().toString(),
      activity: data.activity,
      context: data.context,
      createdAt: new Date(),
    }
    setBreadcrumbs(prev => [newBreadcrumb, ...prev])
    updateStat('breadcrumbsDropped', 1, 'increment')
  }

  // Context bundle activation
  const handleActivateBundle = (bundle) => {
    setActiveBundle(bundle)

    // Apply bundle settings
    const toneMessages = {
      supportive: "I'm here to support you! Let's make progress together.",
      direct: "Bundle activated. Let's focus.",
      minimal: "Ready.",
    }

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `${bundle.name} activated! ${toneMessages[bundle.settings.neroTone] || 'Ready to focus.'}`,
      thinking: null,
    }])
  }

  // Smart suggestions task selection
  const handleSmartTaskSelect = (task) => {
    recordTaskStart(task, energyLevel)
    setCurrentTask(task)
    setViewMode(VIEW_MODES.ONE_THING)
  }

  // Mood logging handler
  const handleMoodLog = (mood, context) => {
    const moodMessages = {
      great: "That's wonderful! Let's keep the momentum going.",
      good: "Glad you're feeling good! What would you like to focus on?",
      okay: "That's alright. Small steps are still progress.",
      low: "I hear you. Let's take it easy and find a gentle task.",
      frustrated: "Frustration is valid. Would a breathing exercise help?",
      anxious: "Anxiety can be tough. Maybe try the grounding exercise?",
      overwhelmed: "When overwhelmed, just focus on one tiny thing. I'm here.",
    }

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: moodMessages[mood.id] || "Thanks for checking in. I'm here to help.",
      thinking: null,
    }])
  }

  // Weekly review completion handler
  const handleWeeklyReviewComplete = (review) => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Great reflection! You've set ${review.intentions.filter(i => i.trim()).length} intentions for next week. Remember: progress over perfection!`,
      thinking: null,
    }])
    setViewMode(VIEW_MODES.CONVERSATION)
  }

  // Task breakdown - create micro task
  const handleCreateMicroTask = (task) => {
    setCurrentTask(task)
    setViewMode(VIEW_MODES.ONE_THING)
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Starting micro-step: "${task.title}". Just this one tiny action - you've got this!`,
      thinking: null,
    }])
  }

  // Hyperfocus guard break request
  const handleHyperfocusBreak = () => {
    setIsTimerRunning(false)
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: "Good call taking a break! Your brain needs rest to stay sharp. Stretch, hydrate, and come back refreshed.",
      thinking: null,
    }])
  }

  const resolveBreadcrumb = (id) => {
    setBreadcrumbs(prev => prev.filter(b => b.id !== id))
    updateStat('breadcrumbsResolved', 1, 'increment')

    // Record in reward system
    rewards.recordBreadcrumbResolved()
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

  // State for data export modal
  const [showDataExport, setShowDataExport] = useState(false)

  // State for More menu
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  // Keyboard shortcuts configuration
  const shortcuts = useMemo(() => [
    // Navigation shortcuts (1-9)
    { key: '1', action: () => setViewMode(VIEW_MODES.CONVERSATION) },
    { key: '2', action: () => setViewMode(VIEW_MODES.ONE_THING) },
    { key: '3', action: () => setViewMode(VIEW_MODES.BREADCRUMBS) },
    { key: '4', action: () => setViewMode(VIEW_MODES.FOCUS_TIMER) },
    { key: '5', action: () => setViewMode(VIEW_MODES.INSIGHTS) },
    { key: '6', action: () => setViewMode(VIEW_MODES.TASK_QUEUE) },
    { key: '7', action: () => setViewMode(VIEW_MODES.ROUTINES) },
    { key: '8', action: () => setViewMode(VIEW_MODES.TIME_TRAINING) },
    { key: '9', action: () => setViewMode(VIEW_MODES.DISTRACTIONS) },
    { key: '0', action: () => setViewMode(VIEW_MODES.REWARDS) },
    // Action shortcuts
    { key: 'i', action: handleInterrupt },
    { key: 'e', action: () => setShowEnergyCheckIn(true) },
    { key: 'q', action: () => setShowQuickCapture(true) },
    { key: 's', action: () => setViewMode(VIEW_MODES.SUGGESTIONS) },
    { key: 'f', action: () => setViewMode(VIEW_MODES.EMOTIONS) },
    { key: 'w', action: () => setViewMode(VIEW_MODES.WEEKLY_REVIEW) },
    { key: 'b', action: () => setViewMode(VIEW_MODES.BREAKDOWN) },
    { key: 'h', action: () => setViewMode(VIEW_MODES.HYPERFOCUS) },
    { key: 'n', action: () => setViewMode(VIEW_MODES.EXTERNAL_BRAIN) },
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

              {/* Data export button */}
              <button
                onClick={() => setShowDataExport(true)}
                className="p-2 rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center hidden sm:flex"
                title="Export your data"
              >
                <Download className="w-4 h-4" />
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
                <ViewErrorBoundary viewName="Chat">
                  <ConversationView
                    messages={messages}
                    setMessages={setMessages}
                    thinkingStreamLevel={thinkingStreamLevel}
                    energyLevel={energyLevel}
                  />
                </ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.ONE_THING && (
              <motion.div
                key="one-thing"
                {...getMotionProps(prefersReducedMotion, pageVariants.oneThing)}
                className="h-full"
              >
                <ViewErrorBoundary viewName="Focus">
                  <Suspense fallback={<ViewLoadingFallback />}>
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
                  </Suspense>
                </ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.BREADCRUMBS && (
              <motion.div
                key="breadcrumbs"
                {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)}
                className="h-full"
              >
                <ViewErrorBoundary viewName="Breadcrumbs">
                  <Suspense fallback={<ViewLoadingFallback />}>
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
                  </Suspense>
                </ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.FOCUS_TIMER && (
              <motion.div
                key="focus-timer"
                {...getMotionProps(prefersReducedMotion, pageVariants.oneThing)}
                className="h-full"
              >
                <ViewErrorBoundary viewName="Timer">
                  <Suspense fallback={<ViewLoadingFallback />}>
                    <FocusTimer
                      energyLevel={energyLevel}
                      onSessionComplete={handleFocusSessionComplete}
                      onTimerStateChange={setIsTimerRunning}
                    />
                  </Suspense>
                </ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.INSIGHTS && (
              <motion.div
                key="insights"
                {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)}
                className="h-full"
              >
                <ViewErrorBoundary viewName="Insights">
                  <Suspense fallback={<ViewLoadingFallback />}>
                    <InsightsDashboard
                      tasksCompleted={tasksCompleted}
                      focusSessions={focusSessions}
                      breadcrumbsCount={breadcrumbs.length}
                      energyLevel={energyLevel}
                    />
                  </Suspense>
                </ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.TASK_QUEUE && (
              <motion.div
                key="task-queue"
                {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)}
                className="h-full"
              >
                <ViewErrorBoundary viewName="Tasks">
                  <Suspense fallback={<ViewLoadingFallback />}>
                    <TaskQueue
                      currentEnergy={energyLevel}
                      onSelectTask={handleSelectTask}
                      captures={captures}
                    />
                  </Suspense>
                </ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.ROUTINES && (
              <motion.div
                key="routines"
                {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)}
                className="h-full"
              >
                <ViewErrorBoundary viewName="Routines">
                  <Suspense fallback={<ViewLoadingFallback />}>
                    <DailyRoutines onComplete={handleRoutineComplete} />
                  </Suspense>
                </ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.DISTRACTIONS && (
              <motion.div
                key="distractions"
                {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)}
                className="h-full"
              >
                <ViewErrorBoundary viewName="Distractions">
                  <Suspense fallback={<ViewLoadingFallback />}>
                    <DistractionLog onLogDistraction={handleLogDistraction} />
                  </Suspense>
                </ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.TIME_TRAINING && (
              <motion.div
                key="time-training"
                {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)}
                className="h-full"
              >
                <ViewErrorBoundary viewName="Time Training">
                  <Suspense fallback={<ViewLoadingFallback />}>
                    <TimeEstimation
                      currentTask={currentTask}
                      onCompleteTask={handleTimeEstimationComplete}
                    />
                  </Suspense>
                </ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.REWARDS && (
              <motion.div
                key="rewards"
                {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)}
                className="h-full"
              >
                <ViewErrorBoundary viewName="Rewards">
                  <RewardSystem />
                </ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.BUNDLES && (
              <motion.div
                key="bundles"
                {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)}
                className="h-full"
              >
                <ViewErrorBoundary viewName="Bundles">
                  <Suspense fallback={<ViewLoadingFallback />}>
                    <ContextBundles
                      onActivate={handleActivateBundle}
                      activeBundle={activeBundle}
                    />
                  </Suspense>
                </ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.SUGGESTIONS && (
              <motion.div
                key="suggestions"
                {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)}
                className="h-full"
              >
                <ViewErrorBoundary viewName="Suggestions">
                  <Suspense fallback={<ViewLoadingFallback />}>
                    <SmartSuggestions
                      energyLevel={energyLevel}
                      onSelectTask={handleSmartTaskSelect}
                    />
                  </Suspense>
                </ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.EMOTIONS && (
              <motion.div
                key="emotions"
                {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)}
                className="h-full"
              >
                <ViewErrorBoundary viewName="Feelings">
                  <Suspense fallback={<ViewLoadingFallback />}>
                    <EmotionalRegulation onMoodLog={handleMoodLog} />
                  </Suspense>
                </ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.WEEKLY_REVIEW && (
              <motion.div
                key="weekly-review"
                {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)}
                className="h-full"
              >
                <ViewErrorBoundary viewName="Weekly Review">
                  <Suspense fallback={<ViewLoadingFallback />}>
                    <WeeklyReview onComplete={handleWeeklyReviewComplete} />
                  </Suspense>
                </ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.BREAKDOWN && (
              <motion.div
                key="breakdown"
                {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)}
                className="h-full"
              >
                <ViewErrorBoundary viewName="Task Breakdown">
                  <Suspense fallback={<ViewLoadingFallback />}>
                    <TaskBreakdown
                      currentTask={currentTask}
                      onCreateMicroTask={handleCreateMicroTask}
                    />
                  </Suspense>
                </ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.HYPERFOCUS && (
              <motion.div
                key="hyperfocus"
                {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)}
                className="h-full"
              >
                <ViewErrorBoundary viewName="Hyperfocus Guard">
                  <Suspense fallback={<ViewLoadingFallback />}>
                    <HyperfocusGuard
                      isTimerRunning={isTimerRunning}
                      sessionStartTime={sessionStartTime}
                      onRequestBreak={handleHyperfocusBreak}
                    />
                  </Suspense>
                </ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.EXTERNAL_BRAIN && (
              <motion.div
                key="external-brain"
                {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)}
                className="h-full"
              >
                <ViewErrorBoundary viewName="External Brain">
                  <Suspense fallback={<ViewLoadingFallback />}>
                    <ExternalBrain />
                  </Suspense>
                </ViewErrorBoundary>
              </motion.div>
            )}

            {/* === Extended Features (from More menu) === */}

            {viewMode === VIEW_MODES.MEDICATION && (
              <motion.div key="medication" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Medication"><Suspense fallback={<ViewLoadingFallback />}>
                  <MedicationReminder energyLevel={energyLevel} />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.SLEEP && (
              <motion.div key="sleep" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Sleep"><Suspense fallback={<ViewLoadingFallback />}>
                  <SleepTracker energyLevel={energyLevel} />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.MOVEMENT && (
              <motion.div key="movement" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Movement"><Suspense fallback={<ViewLoadingFallback />}>
                  <MovementBreaks isTimerRunning={isTimerRunning} />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.MOOD_TRACKER && (
              <motion.div key="mood-tracker" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Mood"><Suspense fallback={<ViewLoadingFallback />}>
                  <MoodTracker />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.DOPAMINE && (
              <motion.div key="dopamine" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Dopamine"><Suspense fallback={<ViewLoadingFallback />}>
                  <DopamineMenu />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.WINS && (
              <motion.div key="wins" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Wins"><Suspense fallback={<ViewLoadingFallback />}>
                  <WinsJournal />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.REJECTION && (
              <motion.div key="rejection" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="RSD Journal"><Suspense fallback={<ViewLoadingFallback />}>
                  <RejectionJournal />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.SELF_COMPASSION && (
              <motion.div key="self-compassion" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Self-Compassion"><Suspense fallback={<ViewLoadingFallback />}>
                  <SelfCompassion />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.OBJECT_FINDER && (
              <motion.div key="object-finder" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Object Finder"><Suspense fallback={<ViewLoadingFallback />}>
                  <ObjectFinder />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.WAITING && (
              <motion.div key="waiting" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Waiting"><Suspense fallback={<ViewLoadingFallback />}>
                  <WaitingMode />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.DECISION && (
              <motion.div key="decision" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Decision Helper"><Suspense fallback={<ViewLoadingFallback />}>
                  <DecisionHelper energyLevel={energyLevel} />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.WORKING_MEMORY && (
              <motion.div key="working-memory" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Working Memory"><Suspense fallback={<ViewLoadingFallback />}>
                  <WorkingMemoryAid currentTask={currentTask} currentView={viewMode} />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.DEADLINE && (
              <motion.div key="deadline" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Deadlines"><Suspense fallback={<ViewLoadingFallback />}>
                  <DeadlineCountdown />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.PROJECT && (
              <motion.div key="project" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Projects"><Suspense fallback={<ViewLoadingFallback />}>
                  <ProjectView />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.PRIORITIZER && (
              <motion.div key="prioritizer" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Prioritizer"><Suspense fallback={<ViewLoadingFallback />}>
                  <TaskPrioritizer energyLevel={energyLevel} />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.TEMPLATES && (
              <motion.div key="templates" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Templates"><Suspense fallback={<ViewLoadingFallback />}>
                  <TemplateLibrary />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.APPOINTMENT && (
              <motion.div key="appointment" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Buffers"><Suspense fallback={<ViewLoadingFallback />}>
                  <AppointmentBuffer />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.FOCUS_ROOMS && (
              <motion.div key="focus-rooms" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Focus Rooms"><Suspense fallback={<ViewLoadingFallback />}>
                  <FocusRooms />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.DISTRACTION_BLOCK && (
              <motion.div key="distraction-block" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Block"><Suspense fallback={<ViewLoadingFallback />}>
                  <DistractionBlocking />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.LOCATION && (
              <motion.div key="location" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Location"><Suspense fallback={<ViewLoadingFallback />}>
                  <LocationContext />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.CUSTOM_SOUNDS && (
              <motion.div key="custom-sounds" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Sounds"><Suspense fallback={<ViewLoadingFallback />}>
                  <CustomSounds />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.MUSIC && (
              <motion.div key="music" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Music"><Suspense fallback={<ViewLoadingFallback />}>
                  <MusicIntegration />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.ACCOUNTABILITY && (
              <motion.div key="accountability" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Accountability"><Suspense fallback={<ViewLoadingFallback />}>
                  <AccountabilityPartner />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.COMMUNITY && (
              <motion.div key="community" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Community"><Suspense fallback={<ViewLoadingFallback />}>
                  <CommunityFeed />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.FAMILY && (
              <motion.div key="family" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Family"><Suspense fallback={<ViewLoadingFallback />}>
                  <FamilyMode />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.THERAPIST && (
              <motion.div key="therapist" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Therapist"><Suspense fallback={<ViewLoadingFallback />}>
                  <TherapistPortal />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.CORRELATIONS && (
              <motion.div key="correlations" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Patterns"><Suspense fallback={<ViewLoadingFallback />}>
                  <CorrelationInsights />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.PROGRESS && (
              <motion.div key="progress" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Progress"><Suspense fallback={<ViewLoadingFallback />}>
                  <ProgressVisualization />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.EXPORT_REPORTS && (
              <motion.div key="export-reports" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Reports"><Suspense fallback={<ViewLoadingFallback />}>
                  <ExportReports />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.PREDICTIONS && (
              <motion.div key="predictions" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Predictions"><Suspense fallback={<ViewLoadingFallback />}>
                  <PredictiveSuggestions />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.VOICE_ASSISTANT && (
              <motion.div key="voice-assistant" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Voice"><Suspense fallback={<ViewLoadingFallback />}>
                  <VoiceAssistant />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.VOICE_NOTES && (
              <motion.div key="voice-notes" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Voice Notes"><Suspense fallback={<ViewLoadingFallback />}>
                  <VoiceNotes />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.CALENDAR_SYNC && (
              <motion.div key="calendar-sync" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Calendar"><Suspense fallback={<ViewLoadingFallback />}>
                  <CalendarIntegration />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.NOTE_SYNC && (
              <motion.div key="note-sync" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Note Sync"><Suspense fallback={<ViewLoadingFallback />}>
                  <NoteAppSync />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.BADGES && (
              <motion.div key="badges" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Badges"><Suspense fallback={<ViewLoadingFallback />}>
                  <AchievementBadges />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.PET && (
              <motion.div key="pet" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Pet"><Suspense fallback={<ViewLoadingFallback />}>
                  <AvatarPetSystem />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.CHALLENGES && (
              <motion.div key="challenges" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Challenges"><Suspense fallback={<ViewLoadingFallback />}>
                  <ChallengesMode />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.ACCESSIBILITY && (
              <motion.div key="accessibility" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Accessibility"><Suspense fallback={<ViewLoadingFallback />}>
                  <AccessibilitySettings />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.DARK_MODE && (
              <motion.div key="dark-mode" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Theme"><Suspense fallback={<ViewLoadingFallback />}>
                  <DarkModeSettings />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.NERO_PERSONALITY && (
              <motion.div key="nero-personality" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Personality"><Suspense fallback={<ViewLoadingFallback />}>
                  <NeroPersonality />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.SHORTCUT_ACTIONS && (
              <motion.div key="shortcut-actions" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Shortcuts"><Suspense fallback={<ViewLoadingFallback />}>
                  <ShortcutActions />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.WEARABLE && (
              <motion.div key="wearable" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Wearable"><Suspense fallback={<ViewLoadingFallback />}>
                  <WearableSync />
                </Suspense></ViewErrorBoundary>
              </motion.div>
            )}

            {viewMode === VIEW_MODES.WIDGETS && (
              <motion.div key="widgets" {...getMotionProps(prefersReducedMotion, pageVariants.breadcrumbs)} className="h-full">
                <ViewErrorBoundary viewName="Widgets"><Suspense fallback={<ViewLoadingFallback />}>
                  <WidgetSupport />
                </Suspense></ViewErrorBoundary>
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

        {/* Data Export Modal */}
        <DataExport
          isOpen={showDataExport}
          onClose={() => setShowDataExport(false)}
        />

        {/* More Menu - all features grid */}
        <MoreMenu
          isOpen={showMoreMenu}
          onClose={() => setShowMoreMenu(false)}
          onNavigate={(featureId) => setViewMode(featureId)}
          currentView={viewMode}
        />

        {/* Lazy-loaded overlay components */}
        <Suspense fallback={null}>
          {/* Ambient Sounds Mini Player */}
          <AmbientSounds isTimerRunning={isTimerRunning} />

          {/* Body Doubling / Accountability Mode */}
          <BodyDoubling
            isTimerRunning={isTimerRunning}
            onRequestBreak={() => {
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Taking a break is important! Step away, stretch, hydrate. I'll be here when you're back.",
                thinking: null,
              }])
            }}
          />

          {/* Focus Shield */}
          <FocusShield
            isTimerRunning={isTimerRunning}
            onShieldChange={setIsShieldActive}
          />

          {/* Transition Helper Modal */}
          <TransitionHelper
            isOpen={showTransition}
            onClose={() => setShowTransition(false)}
            fromTask={transitionFromTask}
            toTask={transitionToTask}
            onCapture={handleTransitionCapture}
            onDropBreadcrumb={handleTransitionBreadcrumb}
            onComplete={handleTransitionComplete}
          />
        </Suspense>

        {/* Reward System Overlays */}
        <AnimatePresence>
          {rewards.showLevelUp && (
            <LevelUpModal
              level={rewards.newLevel}
              onDismiss={rewards.dismissLevelUp}
            />
          )}
        </AnimatePresence>

        <XpToast
          rewards={rewards.pendingRewards}
          onClear={rewards.clearPendingRewards}
        />

        {/* Celebration Overlay */}
        <Celebration
          celebration={celebration}
          onDismiss={dismissCelebration}
        />

        {/* Bottom Navigation - Mobile-first design with scroll */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-surface-dark/90 border-t border-white/10 safe-area-bottom">
          <div className="max-w-2xl mx-auto overflow-x-auto scrollbar-hide">
            <div className="flex items-center px-2 py-2 min-w-max">
              {[
                { id: VIEW_MODES.CONVERSATION, icon: MessageCircle, label: 'Chat' },
                { id: VIEW_MODES.ONE_THING, icon: Target, label: 'Focus' },
                { id: VIEW_MODES.SUGGESTIONS, icon: Sparkles, label: 'Suggest' },
                { id: VIEW_MODES.BREAKDOWN, icon: Scissors, label: 'Breakdown' },
                { id: VIEW_MODES.TASK_QUEUE, icon: ListTodo, label: 'Tasks' },
                { id: VIEW_MODES.FOCUS_TIMER, icon: Timer, label: 'Timer' },
                { id: VIEW_MODES.HYPERFOCUS, icon: Shield, label: 'Guard' },
                { id: VIEW_MODES.BUNDLES, icon: Layers, label: 'Modes' },
                { id: VIEW_MODES.ROUTINES, icon: CalendarCheck, label: 'Routines' },
                { id: VIEW_MODES.BREADCRUMBS, icon: MapPin, label: 'Trail', badge: breadcrumbs.length },
                { id: VIEW_MODES.EXTERNAL_BRAIN, icon: Brain, label: 'Brain' },
                { id: VIEW_MODES.EMOTIONS, icon: Heart, label: 'Feelings' },
                { id: VIEW_MODES.WEEKLY_REVIEW, icon: Calendar, label: 'Review' },
                { id: VIEW_MODES.REWARDS, icon: Trophy, label: 'Rewards' },
                { id: VIEW_MODES.INSIGHTS, icon: BarChart3, label: 'Stats' },
                { id: '__more__', icon: MoreHorizontal, label: 'More' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => tab.id === '__more__' ? setShowMoreMenu(true) : setViewMode(tab.id)}
                  className={`relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-h-[52px] min-w-[60px] ${
                    tab.id === '__more__'
                      ? 'text-white/50 hover:text-white/80 hover:bg-white/5'
                      : viewMode === tab.id
                        ? 'bg-nero-500/20 text-nero-400'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <div className="relative">
                    <tab.icon className="w-5 h-5" />
                    {tab.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-nero-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {tab.badge > 9 ? '9+' : tab.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium whitespace-nowrap">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </div>
  )
}
