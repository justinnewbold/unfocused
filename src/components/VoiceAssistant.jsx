import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MessageCircle,
  Sparkles,
  Settings,
  Play,
  Pause,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const VOICE_KEY = 'nero_voice_settings'

// Voice commands
const VOICE_COMMANDS = [
  { trigger: ['what should i work on', 'what task', 'suggest a task'], action: 'suggest_task', response: 'Let me check your tasks and energy level...' },
  { trigger: ['start timer', 'start focus', 'begin focus'], action: 'start_timer', response: 'Starting your focus timer now.' },
  { trigger: ['stop timer', 'end focus', 'pause timer'], action: 'stop_timer', response: 'Timer stopped. Great work!' },
  { trigger: ['how am i doing', 'my progress', 'my stats'], action: 'show_stats', response: 'Let me pull up your progress...' },
  { trigger: ['take a break', 'need a break', 'break time'], action: 'start_break', response: 'Taking a break is important. Starting break timer.' },
  { trigger: ['add task', 'new task', 'capture'], action: 'quick_capture', response: 'What would you like to capture?' },
  { trigger: ['breathing', 'calm down', 'stressed'], action: 'breathing', response: 'Let\'s do a quick breathing exercise together.' },
  { trigger: ['energy check', 'check energy', 'how\'s my energy'], action: 'energy_check', response: 'How are you feeling right now?' },
  { trigger: ['help', 'what can you do', 'commands'], action: 'help', response: 'Here are some things you can ask me...' },
]

// Load settings
const loadSettings = () => {
  try {
    const stored = localStorage.getItem(VOICE_KEY)
    return stored ? JSON.parse(stored) : {
      enabled: true,
      wakeWord: 'hey nero',
      voiceResponse: true,
      voiceSpeed: 1,
      voicePitch: 1,
      alwaysListening: false,
      confirmActions: true,
    }
  } catch {
    return {}
  }
}

// Save settings
const saveSettings = (settings) => {
  localStorage.setItem(VOICE_KEY, JSON.stringify(settings))
}

export default function VoiceAssistant({ onCommand, energyLevel, currentTask }) {
  const prefersReducedMotion = useReducedMotion()
  const [settings, setSettings] = useState(loadSettings())
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [error, setError] = useState(null)
  const [recentCommands, setRecentCommands] = useState([])

  const recognitionRef = useRef(null)
  const synthRef = useRef(null)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('')
        setTranscript(transcript)

        if (event.results[0].isFinal) {
          processCommand(transcript)
        }
      }

      recognitionRef.current.onerror = (event) => {
        setError(`Speech recognition error: ${event.error}`)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }

    synthRef.current = window.speechSynthesis

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  // Update settings
  const updateSettings = (key, value) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    saveSettings(updated)
  }

  // Start listening
  const startListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not supported in this browser')
      return
    }

    setError(null)
    setTranscript('')
    setIsListening(true)
    recognitionRef.current.start()
  }

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }

  // Process voice command
  const processCommand = async (text) => {
    setIsProcessing(true)
    const lowerText = text.toLowerCase().trim()

    // Find matching command
    let matchedCommand = null
    for (const cmd of VOICE_COMMANDS) {
      if (cmd.trigger.some(t => lowerText.includes(t))) {
        matchedCommand = cmd
        break
      }
    }

    if (matchedCommand) {
      // Build contextual response
      let responseText = matchedCommand.response

      // Handle specific actions
      switch (matchedCommand.action) {
        case 'suggest_task':
          responseText = getSuggestedTaskResponse()
          break
        case 'show_stats':
          responseText = getStatsResponse()
          break
        case 'help':
          responseText = getHelpResponse()
          break
      }

      setResponse(responseText)

      // Speak response if enabled
      if (settings.voiceResponse) {
        speak(responseText)
      }

      // Execute action
      onCommand?.(matchedCommand.action, { transcript: text })

      // Add to recent commands
      setRecentCommands(prev => [
        { text, action: matchedCommand.action, timestamp: new Date() },
        ...prev.slice(0, 4)
      ])
    } else {
      const fallbackResponse = "I didn't quite catch that. Try saying 'help' to see what I can do."
      setResponse(fallbackResponse)
      if (settings.voiceResponse) {
        speak(fallbackResponse)
      }
    }

    setIsProcessing(false)
  }

  // Text to speech
  const speak = (text) => {
    if (!synthRef.current) return

    // Cancel any ongoing speech
    synthRef.current.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = settings.voiceSpeed
    utterance.pitch = settings.voicePitch

    synthRef.current.speak(utterance)
  }

  // Stop speaking
  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
    }
  }

  // Get suggested task response
  const getSuggestedTaskResponse = () => {
    if (currentTask) {
      return `Based on your current energy level, I suggest working on: ${currentTask.title}`
    }
    const energyText = energyLevel === 1 ? 'low' : energyLevel === 2 ? 'medium' : 'high'
    return `Your energy is ${energyText}. Let me find a suitable task for you.`
  }

  // Get stats response
  const getStatsResponse = () => {
    try {
      const stats = JSON.parse(localStorage.getItem('nero_insights_stats') || '{}')
      const today = new Date().toISOString().split('T')[0]
      const todayStats = stats[today] || {}

      const tasks = todayStats.tasksCompleted || 0
      const focus = todayStats.focusSessions || 0

      return `Today you've completed ${tasks} tasks and ${focus} focus sessions. Keep it up!`
    } catch {
      return "I couldn't fetch your stats right now. Try checking the Insights dashboard."
    }
  }

  // Get help response
  const getHelpResponse = () => {
    return "You can ask me: What should I work on? Start timer. Take a break. How am I doing? Add task. Or just say 'breathing' if you need to calm down."
  }

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
            <h2 className="font-display text-xl font-semibold">Hey Nero</h2>
            <p className="text-sm text-white/50">Voice-controlled assistant</p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Settings className="w-5 h-5 text-white/50" />
          </button>
        </div>

        {/* Main Voice Interface */}
        <div className="glass-card p-6 mb-6">
          <div className="flex flex-col items-center">
            {/* Microphone Button */}
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              className={`relative w-24 h-24 rounded-full transition-all ${
                isListening
                  ? 'bg-red-500 scale-110'
                  : 'bg-nero-500 hover:bg-nero-600'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-10 h-10 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
              ) : isListening ? (
                <MicOff className="w-10 h-10 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              ) : (
                <Mic className="w-10 h-10 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              )}

              {/* Listening Animation */}
              {isListening && (
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-red-400"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
            </button>

            <p className="mt-4 text-sm text-white/50">
              {isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Tap to speak'}
            </p>

            {/* Transcript */}
            {transcript && (
              <motion.div
                {...getMotionProps(prefersReducedMotion, {
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 }
                })}
                className="mt-4 p-3 bg-white/5 rounded-xl w-full"
              >
                <p className="text-sm text-white/70 text-center">"{transcript}"</p>
              </motion.div>
            )}

            {/* Response */}
            {response && !isListening && (
              <motion.div
                {...getMotionProps(prefersReducedMotion, {
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 }
                })}
                className="mt-4 p-4 bg-nero-500/20 rounded-xl w-full border border-nero-500/30"
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-nero-400 mt-0.5" />
                  <p className="text-sm">{response}</p>
                </div>

                {settings.voiceResponse && (
                  <button
                    onClick={stopSpeaking}
                    className="mt-2 flex items-center gap-1 text-xs text-white/50 hover:text-white/70"
                  >
                    <VolumeX className="w-3 h-3" />
                    Stop speaking
                  </button>
                )}
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <motion.div
                {...getMotionProps(prefersReducedMotion, {
                  initial: { opacity: 0 },
                  animate: { opacity: 1 }
                })}
                className="mt-4 p-3 bg-red-500/20 rounded-xl w-full"
              >
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-sm">{error}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Quick Commands */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-white/70 mb-3">Quick Commands</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'What should I work on?', action: 'suggest_task' },
              { label: 'Start focus timer', action: 'start_timer' },
              { label: 'Take a break', action: 'start_break' },
              { label: 'How am I doing?', action: 'show_stats' },
            ].map((cmd) => (
              <button
                key={cmd.action}
                onClick={() => processCommand(cmd.label)}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-left transition-colors"
              >
                {cmd.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Commands */}
        {recentCommands.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-white/70 mb-3">Recent</h3>
            <div className="space-y-2">
              {recentCommands.map((cmd, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                  <MessageCircle className="w-4 h-4 text-white/30" />
                  <span className="text-sm text-white/70 flex-1">"{cmd.text}"</span>
                  <span className="text-xs text-white/30">
                    {cmd.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 }
              })}
            >
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSettings(false)} />

              <motion.div
                className="relative w-full max-w-md glass-card p-5 max-h-[90vh] overflow-y-auto"
                {...getMotionProps(prefersReducedMotion, {
                  initial: { y: 100, opacity: 0 },
                  animate: { y: 0, opacity: 1 },
                  exit: { y: 100, opacity: 0 }
                })}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-semibold">Voice Settings</h3>
                  <button onClick={() => setShowSettings(false)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Voice Response */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Voice Responses</p>
                      <p className="text-xs text-white/50">Nero speaks responses aloud</p>
                    </div>
                    <button
                      onClick={() => updateSettings('voiceResponse', !settings.voiceResponse)}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        settings.voiceResponse ? 'bg-nero-500' : 'bg-white/20'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        settings.voiceResponse ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  {/* Voice Speed */}
                  <div>
                    <p className="text-sm text-white/70 mb-2">Voice Speed: {settings.voiceSpeed}x</p>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={settings.voiceSpeed}
                      onChange={(e) => updateSettings('voiceSpeed', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Voice Pitch */}
                  <div>
                    <p className="text-sm text-white/70 mb-2">Voice Pitch: {settings.voicePitch}</p>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={settings.voicePitch}
                      onChange={(e) => updateSettings('voicePitch', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Confirm Actions */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Confirm Actions</p>
                      <p className="text-xs text-white/50">Ask before executing commands</p>
                    </div>
                    <button
                      onClick={() => updateSettings('confirmActions', !settings.confirmActions)}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        settings.confirmActions ? 'bg-nero-500' : 'bg-white/20'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        settings.confirmActions ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  {/* Test Voice */}
                  <button
                    onClick={() => speak("Hello! I'm Nero, your ADHD companion. How can I help you today?")}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm transition-colors"
                  >
                    <Volume2 className="w-4 h-4 inline mr-2" />
                    Test Voice
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
