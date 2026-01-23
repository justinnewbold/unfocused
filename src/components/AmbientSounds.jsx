import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Volume2,
  VolumeX,
  CloudRain,
  Wind,
  Waves,
  Radio,
  X,
  Minus,
  Plus
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Sound types with their generator configurations
const SOUND_TYPES = [
  {
    id: 'brown',
    label: 'Brown Noise',
    description: 'Deep, rumbling focus sound',
    icon: Wind,
    color: 'amber'
  },
  {
    id: 'white',
    label: 'White Noise',
    description: 'Classic static for masking',
    icon: Radio,
    color: 'gray'
  },
  {
    id: 'rain',
    label: 'Rain',
    description: 'Gentle rainfall sounds',
    icon: CloudRain,
    color: 'blue'
  },
  {
    id: 'ocean',
    label: 'Ocean Waves',
    description: 'Rhythmic wave patterns',
    icon: Waves,
    color: 'cyan'
  },
]

// Generate brown noise using Web Audio API
const createBrownNoise = (audioContext) => {
  const bufferSize = 2 * audioContext.sampleRate
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
  const output = buffer.getChannelData(0)

  let lastOut = 0.0
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1
    output[i] = (lastOut + 0.02 * white) / 1.02
    lastOut = output[i]
    output[i] *= 3.5 // Amplify
  }

  const source = audioContext.createBufferSource()
  source.buffer = buffer
  source.loop = true
  return source
}

// Generate white noise
const createWhiteNoise = (audioContext) => {
  const bufferSize = 2 * audioContext.sampleRate
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
  const output = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1
  }

  const source = audioContext.createBufferSource()
  source.buffer = buffer
  source.loop = true
  return source
}

// Generate rain-like sound (filtered noise with droplet effect)
const createRainSound = (audioContext) => {
  const bufferSize = 2 * audioContext.sampleRate
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
  const output = buffer.getChannelData(0)

  // Create rain base with occasional droplets
  for (let i = 0; i < bufferSize; i++) {
    // Base rain sound (filtered noise)
    let sample = Math.random() * 2 - 1

    // Add occasional "droplet" sounds
    if (Math.random() < 0.001) {
      sample += Math.sin(i * 0.1) * Math.exp(-i * 0.0001) * 0.5
    }

    output[i] = sample * 0.3
  }

  const source = audioContext.createBufferSource()
  source.buffer = buffer
  source.loop = true
  return source
}

// Generate ocean wave sound (modulated noise)
const createOceanSound = (audioContext) => {
  const bufferSize = 4 * audioContext.sampleRate
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
  const output = buffer.getChannelData(0)

  // Wave cycle (about 8-10 seconds)
  const waveCycle = audioContext.sampleRate * 8

  for (let i = 0; i < bufferSize; i++) {
    // Create wave envelope
    const wavePhase = (i % waveCycle) / waveCycle
    const envelope = Math.sin(wavePhase * Math.PI) * 0.7 + 0.3

    // Base noise
    const noise = Math.random() * 2 - 1

    output[i] = noise * envelope * 0.4
  }

  const source = audioContext.createBufferSource()
  source.buffer = buffer
  source.loop = true
  return source
}

export default function AmbientSounds({ isTimerRunning }) {
  const prefersReducedMotion = useReducedMotion()
  const [isOpen, setIsOpen] = useState(false)
  const [activeSound, setActiveSound] = useState(null)
  const [volume, setVolume] = useState(0.5)
  const [isPlaying, setIsPlaying] = useState(false)

  const audioContextRef = useRef(null)
  const sourceRef = useRef(null)
  const gainRef = useRef(null)
  const filterRef = useRef(null)

  // Initialize audio context
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    return audioContextRef.current
  }, [])

  // Create sound based on type
  const createSound = useCallback((type, ctx) => {
    switch (type) {
      case 'brown':
        return createBrownNoise(ctx)
      case 'white':
        return createWhiteNoise(ctx)
      case 'rain':
        return createRainSound(ctx)
      case 'ocean':
        return createOceanSound(ctx)
      default:
        return createBrownNoise(ctx)
    }
  }, [])

  // Play sound
  const playSound = useCallback((soundType) => {
    const ctx = initAudio()

    // Resume if suspended
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    // Stop current sound
    if (sourceRef.current) {
      sourceRef.current.stop()
      sourceRef.current.disconnect()
    }

    // Create new nodes
    const source = createSound(soundType, ctx)
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    // Configure filter for smoother sound
    filter.type = 'lowpass'
    filter.frequency.value = soundType === 'white' ? 8000 : soundType === 'rain' ? 4000 : 2000

    // Connect nodes
    source.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    // Set volume
    gain.gain.value = volume

    // Start playing
    source.start()

    // Store references
    sourceRef.current = source
    gainRef.current = gain
    filterRef.current = filter

    setActiveSound(soundType)
    setIsPlaying(true)
  }, [initAudio, createSound, volume])

  // Stop sound
  const stopSound = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.stop()
      sourceRef.current.disconnect()
      sourceRef.current = null
    }
    setIsPlaying(false)
    setActiveSound(null)
  }, [])

  // Toggle sound
  const toggleSound = useCallback((soundType) => {
    if (activeSound === soundType && isPlaying) {
      stopSound()
    } else {
      playSound(soundType)
    }
  }, [activeSound, isPlaying, playSound, stopSound])

  // Update volume
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume
    }
  }, [volume])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        sourceRef.current.stop()
        sourceRef.current.disconnect()
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Auto-start when timer starts (if a sound was selected)
  useEffect(() => {
    if (isTimerRunning && activeSound && !isPlaying) {
      playSound(activeSound)
    }
  }, [isTimerRunning, activeSound, isPlaying, playSound])

  const activeSoundInfo = SOUND_TYPES.find(s => s.id === activeSound)

  return (
    <>
      {/* Mini player (when sound is active) */}
      <AnimatePresence>
        {isPlaying && !isOpen && (
          <motion.button
            onClick={() => setIsOpen(true)}
            className="fixed left-4 bottom-24 z-30 flex items-center gap-2 px-3 py-2 rounded-full bg-surface-light/90 backdrop-blur-sm border border-white/10 shadow-lg"
            {...getMotionProps(prefersReducedMotion, {
              initial: { opacity: 0, x: -20 },
              animate: { opacity: 1, x: 0 },
              exit: { opacity: 0, x: -20 }
            })}
          >
            <div className={`w-2 h-2 rounded-full bg-${activeSoundInfo?.color || 'nero'}-400 animate-pulse`} />
            <span className="text-xs text-white/70">{activeSoundInfo?.label}</span>
            <Volume2 className="w-3 h-3 text-white/50" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sound panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            {...getMotionProps(prefersReducedMotion, {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0 }
            })}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              className="relative w-full max-w-sm glass-card p-5"
              {...getMotionProps(prefersReducedMotion, {
                initial: { y: 100, opacity: 0 },
                animate: { y: 0, opacity: 1 },
                exit: { y: 100, opacity: 0 }
              })}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-focus-500/20 flex items-center justify-center">
                    <Volume2 className="w-4 h-4 text-focus-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold">Focus Sounds</h3>
                    <p className="text-xs text-white/50">Block distractions</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sound options */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {SOUND_TYPES.map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => toggleSound(sound.id)}
                    className={`relative p-4 rounded-xl transition-all text-left ${
                      activeSound === sound.id
                        ? `bg-${sound.color}-500/20 border border-${sound.color}-500/30`
                        : 'bg-white/5 border border-transparent hover:bg-white/10'
                    }`}
                  >
                    {activeSound === sound.id && isPlaying && (
                      <div className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-${sound.color}-400 animate-pulse`} />
                    )}
                    <sound.icon className={`w-6 h-6 mb-2 ${
                      activeSound === sound.id ? `text-${sound.color}-400` : 'text-white/50'
                    }`} />
                    <p className={`text-sm font-medium ${
                      activeSound === sound.id ? 'text-white' : 'text-white/70'
                    }`}>
                      {sound.label}
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">{sound.description}</p>
                  </button>
                ))}
              </div>

              {/* Volume control */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Volume</span>
                  <span className="text-sm font-mono text-white/50">{Math.round(volume * 100)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setVolume(Math.max(0, volume - 0.1))}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="flex-1 h-2 rounded-full bg-white/10 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-nero-500"
                  />
                  <button
                    onClick={() => setVolume(Math.min(1, volume + 0.1))}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stop button */}
              {isPlaying && (
                <button
                  onClick={stopSound}
                  className="w-full mt-4 px-4 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <VolumeX className="w-4 h-4" />
                  Stop Sound
                </button>
              )}

              {/* Tip */}
              <p className="text-center text-white/30 text-xs mt-4">
                Sounds auto-play when focus timer starts
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
