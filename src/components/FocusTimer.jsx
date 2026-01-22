import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  RotateCcw,
  Timer,
  Coffee,
  Zap,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// ADHD-friendly timer presets based on energy level
const getPresets = (energyLevel) => {
  if (energyLevel <= 2) {
    // Low energy: shorter work, longer breaks
    return {
      work: 15,
      shortBreak: 7,
      longBreak: 20,
      sessionsBeforeLongBreak: 2
    }
  } else if (energyLevel <= 3) {
    // Medium energy: balanced
    return {
      work: 25,
      shortBreak: 5,
      longBreak: 15,
      sessionsBeforeLongBreak: 3
    }
  } else {
    // High energy: classic pomodoro
    return {
      work: 35,
      shortBreak: 5,
      longBreak: 20,
      sessionsBeforeLongBreak: 4
    }
  }
}

export default function FocusTimer({ energyLevel, onSessionComplete, onTimerStateChange }) {
  const prefersReducedMotion = useReducedMotion()
  const presets = getPresets(energyLevel)

  // Timer state
  const [mode, setMode] = useState('work') // 'work' | 'shortBreak' | 'longBreak'
  const [timeLeft, setTimeLeft] = useState(presets.work * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [completedSessions, setCompletedSessions] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  // Custom durations
  const [workDuration, setWorkDuration] = useState(presets.work)
  const [breakDuration, setBreakDuration] = useState(presets.shortBreak)

  const intervalRef = useRef(null)
  const audioRef = useRef(null)

  // Initialize audio
  useEffect(() => {
    // Create a simple audio context for completion sound
    audioRef.current = new (window.AudioContext || window.webkitAudioContext)()
  }, [])

  // Play completion sound
  const playSound = useCallback(() => {
    if (!soundEnabled || !audioRef.current) return

    try {
      const ctx = audioRef.current
      if (ctx.state === 'suspended') ctx.resume()

      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      // Gentle chime
      oscillator.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
      oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15) // E5
      oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3) // G5

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.5)
    } catch (e) {
      // Audio not supported, fail silently
    }
  }, [soundEnabled])

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      // Timer completed
      playSound()

      if (mode === 'work') {
        const newSessions = completedSessions + 1
        setCompletedSessions(newSessions)
        onSessionComplete?.(newSessions)

        // Determine break type
        if (newSessions % presets.sessionsBeforeLongBreak === 0) {
          setMode('longBreak')
          setTimeLeft(presets.longBreak * 60)
        } else {
          setMode('shortBreak')
          setTimeLeft(breakDuration * 60)
        }
      } else {
        // Break completed, back to work
        setMode('work')
        setTimeLeft(workDuration * 60)
      }
      setIsRunning(false)
    }

    return () => clearInterval(intervalRef.current)
  }, [isRunning, timeLeft, mode, completedSessions, workDuration, breakDuration, playSound, onSessionComplete, presets])

  // Update durations when energy level changes
  useEffect(() => {
    const newPresets = getPresets(energyLevel)
    setWorkDuration(newPresets.work)
    setBreakDuration(newPresets.shortBreak)
    if (!isRunning && mode === 'work') {
      setTimeLeft(newPresets.work * 60)
    }
  }, [energyLevel])

  // Notify parent of timer state changes
  useEffect(() => {
    onTimerStateChange?.(isRunning)
  }, [isRunning, onTimerStateChange])

  const toggleTimer = () => setIsRunning(prev => !prev)

  const resetTimer = () => {
    setIsRunning(false)
    setMode('work')
    setTimeLeft(workDuration * 60)
    setCompletedSessions(0)
  }

  const adjustDuration = (type, delta) => {
    if (type === 'work') {
      const newDuration = Math.max(5, Math.min(60, workDuration + delta))
      setWorkDuration(newDuration)
      if (!isRunning && mode === 'work') {
        setTimeLeft(newDuration * 60)
      }
    } else {
      const newDuration = Math.max(1, Math.min(30, breakDuration + delta))
      setBreakDuration(newDuration)
      if (!isRunning && mode !== 'work') {
        setTimeLeft(newDuration * 60)
      }
    }
  }

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Progress calculation
  const totalSeconds = mode === 'work'
    ? workDuration * 60
    : mode === 'shortBreak'
      ? breakDuration * 60
      : presets.longBreak * 60
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100

  // Mode colors
  const modeColors = {
    work: 'from-nero-500 to-nero-600',
    shortBreak: 'from-calm-400 to-calm-500',
    longBreak: 'from-focus-400 to-focus-500'
  }

  const modeLabels = {
    work: 'Focus Time',
    shortBreak: 'Short Break',
    longBreak: 'Long Break'
  }

  const modeIcons = {
    work: Zap,
    shortBreak: Coffee,
    longBreak: Sparkles
  }

  const ModeIcon = modeIcons[mode]

  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <motion.div
        className="w-full max-w-sm"
        {...getMotionProps(prefersReducedMotion, {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 }
        })}
      >
        {/* Mode indicator */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${modeColors[mode]} text-white text-sm font-medium mb-6 mx-auto`}>
          <ModeIcon className="w-4 h-4" />
          {modeLabels[mode]}
        </div>

        {/* Timer display */}
        <div className="glass-card glow-border p-8 mb-6 relative overflow-hidden">
          {/* Progress ring background */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100" preserveAspectRatio="none">
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-white/5"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${progress * 3.02} 302`}
              className={mode === 'work' ? 'text-nero-500' : mode === 'shortBreak' ? 'text-calm-500' : 'text-focus-500'}
              {...(prefersReducedMotion ? {} : { transition: { duration: 0.5 } })}
            />
          </svg>

          <div className="relative z-10 text-center">
            <div className="font-mono text-6xl md:text-7xl font-bold mb-2 tracking-tight">
              {formatTime(timeLeft)}
            </div>

            {/* Time blindness helper */}
            <p className="text-white/50 text-sm">
              {timeLeft > 60
                ? `${Math.ceil(timeLeft / 60)} minutes left`
                : `${timeLeft} seconds left`}
            </p>

            {/* Session counter */}
            <div className="flex justify-center gap-1 mt-4">
              {Array.from({ length: presets.sessionsBeforeLongBreak }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i < (completedSessions % presets.sessionsBeforeLongBreak)
                      ? 'bg-nero-500'
                      : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
            <p className="text-white/40 text-xs mt-2">
              {completedSessions} session{completedSessions !== 1 ? 's' : ''} completed
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-3 mb-6">
          <button
            onClick={resetTimer}
            className="p-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 transition-colors min-h-[56px] min-w-[56px]"
            title="Reset timer"
          >
            <RotateCcw className="w-6 h-6" />
          </button>

          <button
            onClick={toggleTimer}
            className={`px-8 py-4 rounded-xl bg-gradient-to-r ${modeColors[mode]} text-white font-medium transition-all min-h-[56px] flex items-center gap-2 shadow-lg`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                {timeLeft === totalSeconds ? 'Start' : 'Resume'}
              </>
            )}
          </button>

          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            className={`p-4 rounded-xl transition-colors min-h-[56px] min-w-[56px] ${
              soundEnabled
                ? 'bg-white/10 text-white'
                : 'bg-white/5 text-white/40'
            }`}
            title={soundEnabled ? 'Sound on' : 'Sound off'}
          >
            {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>
        </div>

        {/* Duration adjusters */}
        <button
          onClick={() => setShowSettings(prev => !prev)}
          className="w-full text-center text-white/50 text-sm hover:text-white/70 transition-colors mb-4"
        >
          {showSettings ? 'Hide settings' : 'Adjust durations'}
        </button>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card p-4 space-y-4">
                {/* Work duration */}
                <div className="flex items-center justify-between">
                  <span className="text-white/70 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-nero-400" />
                    Work
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => adjustDuration('work', -5)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <span className="w-16 text-center font-mono">{workDuration}m</span>
                    <button
                      onClick={() => adjustDuration('work', 5)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Break duration */}
                <div className="flex items-center justify-between">
                  <span className="text-white/70 flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-calm-400" />
                    Break
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => adjustDuration('break', -1)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <span className="w-16 text-center font-mono">{breakDuration}m</span>
                    <button
                      onClick={() => adjustDuration('break', 1)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Energy-based suggestion */}
                <p className="text-white/40 text-xs text-center pt-2 border-t border-white/10">
                  {energyLevel <= 2 && "Low energy detected - shorter sessions recommended"}
                  {energyLevel === 3 && "Balanced energy - standard durations work well"}
                  {energyLevel >= 4 && "High energy - you can handle longer focus blocks"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
