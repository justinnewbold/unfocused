import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  Target, 
  Activity, 
  Brain,
  ChevronRight,
  Sparkles,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Zap,
  MapPin,
  ArrowLeft,
  Check,
  RotateCcw,
  Eye,
  EyeOff,
  Send
} from 'lucide-react'

// Import components
import EnergyCheckIn from './components/EnergyCheckIn'
import BreadcrumbTrail from './components/BreadcrumbTrail'
import OneThingMode from './components/OneThingMode'
import ThinkingStream from './components/ThinkingStream'
import ConversationView from './components/ConversationView'

// View modes
const VIEW_MODES = {
  CONVERSATION: 'conversation',
  ONE_THING: 'one_thing',
  BREADCRUMBS: 'breadcrumbs',
}

export default function App() {
  // Core state
  const [viewMode, setViewMode] = useState(VIEW_MODES.CONVERSATION)
  const [energyLevel, setEnergyLevel] = useState(3)
  const [showEnergyCheckIn, setShowEnergyCheckIn] = useState(false)
  const [thinkingStreamLevel, setThinkingStreamLevel] = useState('minimal') // off, minimal, full
  
  // Demo data for breadcrumbs
  const [breadcrumbs, setBreadcrumbs] = useState([
    {
      id: '1',
      activity: 'Cleaning the kitchen drawer',
      context: 'Looking for the screwdriver',
      thought: 'Need to fix the cabinet hinge',
      nextStep: 'Find the Phillips head',
      createdAt: new Date(Date.now() - 1000 * 60 * 5),
      isSpawn: false,
    },
    {
      id: '2',
      activity: 'Searching for drill bits',
      context: 'Realized the screw is stripped',
      thought: 'Might need to re-drill the hole',
      nextStep: 'Get the right size bit',
      createdAt: new Date(Date.now() - 1000 * 60 * 3),
      isSpawn: true,
    },
    {
      id: '3',
      activity: 'Phone call with Mom',
      context: 'She called about Sunday dinner',
      thought: 'Need to check my calendar',
      nextStep: 'Get back to the drawer',
      createdAt: new Date(Date.now() - 1000 * 60 * 1),
      isSpawn: true,
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
      content: "Hey! I noticed you've been bouncing between a few things. Want me to help you get back on track? I've been keeping notes on where you left off. 📝",
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
  
  const handleEnergySubmit = (level, mood, note) => {
    setEnergyLevel(level)
    setShowEnergyCheckIn(false)
    localStorage.setItem('lastEnergyCheckIn', new Date().toDateString())
    
    // Add a contextual message from Nero
    const energyMessages = {
      1: "I hear you - it's a tough one today. Let's keep things super simple. One tiny thing at a time. 💙",
      2: "Running a bit low, got it. I'll suggest easy wins to help build some momentum.",
      3: "Middle of the road energy - I'll mix it up with some quick tasks and one meaningful one.",
      4: "Nice! You've got some good fuel today. Let's make it count.",
      5: "You're on fire! 🔥 Let's channel that energy into something you've been putting off.",
    }
    
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: energyMessages[level],
      thinking: thinkingStreamLevel !== 'off' ? `Analyzing energy level ${level}... Adjusting task suggestions to match current capacity.` : null,
    }])
  }
  
  const handleTaskComplete = () => {
    setCurrentTask(prev => ({ ...prev, isCompleted: true }))
    
    // Celebration message
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Yes! ✨ That's one thing done. The momentum is building. Want to tackle another quick win, or should we check your breadcrumbs?",
        thinking: null,
      }])
    }, 1000)
  }
  
  const resolveBreadcrumb = (id) => {
    setBreadcrumbs(prev => prev.filter(b => b.id !== id))
  }
  
  const toggleThinkingStream = () => {
    const levels = ['off', 'minimal', 'full']
    const currentIndex = levels.indexOf(thinkingStreamLevel)
    const nextIndex = (currentIndex + 1) % levels.length
    setThinkingStreamLevel(levels[nextIndex])
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
        {/* Header */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-surface-dark/80 border-b border-white/5">
          <div className="px-4 py-3 flex items-center justify-between">
            {/* Logo & Name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nero-400 to-nero-600 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-display font-semibold text-lg">Nero</h1>
                <p className="text-xs text-white/50">Your ADHD companion</p>
              </div>
            </div>
            
            {/* Right side controls */}
            <div className="flex items-center gap-2">
              {/* Energy indicator */}
              <button 
                onClick={() => setShowEnergyCheckIn(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                {energyLevel <= 2 ? (
                  <BatteryLow className="w-4 h-4 text-orange-400" />
                ) : energyLevel === 3 ? (
                  <BatteryMedium className="w-4 h-4 text-yellow-400" />
                ) : (
                  <BatteryFull className="w-4 h-4 text-green-400" />
                )}
                <span className="text-xs font-medium">{energyLevel}/5</span>
              </button>
              
              {/* Thinking stream toggle */}
              <button
                onClick={toggleThinkingStream}
                className={`p-2 rounded-full transition-colors ${
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
            </div>
          </div>
          
          {/* View mode tabs */}
          <div className="px-4 pb-2 flex gap-1">
            {[
              { id: VIEW_MODES.CONVERSATION, icon: MessageCircle, label: 'Chat' },
              { id: VIEW_MODES.ONE_THING, icon: Target, label: 'One Thing' },
              { id: VIEW_MODES.BREADCRUMBS, icon: MapPin, label: 'Trail' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  viewMode === tab.id
                    ? 'bg-nero-500/20 text-nero-400'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {viewMode === VIEW_MODES.CONVERSATION && (
              <motion.div
                key="conversation"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-full"
              >
                <OneThingMode 
                  task={currentTask}
                  onComplete={handleTaskComplete}
                  onSkip={() => setCurrentTask(prev => ({ ...prev, title: 'Check your calendar for Sunday' }))}
                  energyLevel={energyLevel}
                />
              </motion.div>
            )}
            
            {viewMode === VIEW_MODES.BREADCRUMBS && (
              <motion.div
                key="breadcrumbs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full"
              >
                <BreadcrumbTrail 
                  breadcrumbs={breadcrumbs}
                  onResolve={resolveBreadcrumb}
                  onJumpTo={(breadcrumb) => {
                    setCurrentTask({
                      id: breadcrumb.id,
                      title: breadcrumb.nextStep || breadcrumb.activity,
                      description: breadcrumb.context,
                      energyRequired: 2,
                      reason: `Getting back to: ${breadcrumb.activity}`,
                      isCompleted: false,
                    })
                    setViewMode(VIEW_MODES.ONE_THING)
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
