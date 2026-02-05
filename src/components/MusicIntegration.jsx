import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Radio,
  Headphones,
  Plus,
  X,
  Heart,
  Shuffle,
  Repeat,
  ExternalLink,
  ListMusic,
  Disc,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const MUSIC_KEY = 'nero_music_settings'
const PLAYLISTS_KEY = 'nero_custom_playlists'

// Pre-built focus playlists (simulated - would connect to Spotify API)
const FOCUS_PLAYLISTS = [
  {
    id: 'deep-focus',
    name: 'Deep Focus',
    description: 'Instrumental tracks for concentration',
    cover: '🎵',
    trackCount: 50,
    duration: '3h 20m',
    genre: 'ambient',
    spotifyId: '37i9dQZF1DWZeKCadgRdKQ',
  },
  {
    id: 'lo-fi-beats',
    name: 'Lo-Fi Beats',
    description: 'Chill beats to study/relax to',
    cover: '🎧',
    trackCount: 100,
    duration: '5h 45m',
    genre: 'lo-fi',
    spotifyId: '37i9dQZF1DWWQRwui0ExPn',
  },
  {
    id: 'classical-focus',
    name: 'Classical Focus',
    description: 'Mozart, Bach, and more',
    cover: '🎻',
    trackCount: 75,
    duration: '4h 10m',
    genre: 'classical',
    spotifyId: '37i9dQZF1DWWEJlAGA9gs0',
  },
  {
    id: 'nature-sounds',
    name: 'Nature & Focus',
    description: 'Rain, forests, and streams',
    cover: '🌿',
    trackCount: 40,
    duration: '2h 30m',
    genre: 'nature',
    spotifyId: '37i9dQZF1DX4PP3DA4J0N8',
  },
  {
    id: 'electronic-focus',
    name: 'Electronic Focus',
    description: 'Minimal techno and ambient electronic',
    cover: '🔊',
    trackCount: 60,
    duration: '3h 50m',
    genre: 'electronic',
    spotifyId: '37i9dQZF1DX5trt9i14X7j',
  },
  {
    id: 'video-game',
    name: 'Video Game OST',
    description: 'Epic soundtracks from games',
    cover: '🎮',
    trackCount: 80,
    duration: '4h 30m',
    genre: 'soundtrack',
    spotifyId: '37i9dQZF1DWTyiBJ6yEqeu',
  },
]

// Timer-based auto-play rules
const AUTO_PLAY_RULES = [
  { id: 'focus-start', label: 'When focus timer starts', event: 'timer_start' },
  { id: 'break-start', label: 'When break starts', event: 'break_start' },
  { id: 'morning', label: 'During morning hours (6-12)', event: 'time_morning' },
  { id: 'afternoon', label: 'During afternoon (12-18)', event: 'time_afternoon' },
  { id: 'evening', label: 'During evening (18-24)', event: 'time_evening' },
]

// Load settings
const loadSettings = () => {
  try {
    const stored = localStorage.getItem(MUSIC_KEY)
    return stored ? JSON.parse(stored) : {
      autoPlayEnabled: true,
      autoPlayPlaylist: 'deep-focus',
      autoPlayRules: ['focus-start'],
      volume: 70,
      fadeIn: true,
      fadeOut: true,
      pauseOnBreak: false,
    }
  } catch {
    return {}
  }
}

// Save settings
const saveSettings = (settings) => {
  localStorage.setItem(MUSIC_KEY, JSON.stringify(settings))
}

// Load custom playlists
const loadCustomPlaylists = () => {
  try {
    const stored = localStorage.getItem(PLAYLISTS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save custom playlists
const saveCustomPlaylists = (playlists) => {
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists))
}

export default function MusicIntegration({ isTimerActive, isBreak, onPlayStateChange }) {
  const prefersReducedMotion = useReducedMotion()
  const [settings, setSettings] = useState(loadSettings())
  const [customPlaylists, setCustomPlaylists] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPlaylist, setCurrentPlaylist] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewMode, setViewMode] = useState('playlists') // 'playlists' | 'settings'
  const [favorites, setFavorites] = useState([])

  // Load data on mount
  useEffect(() => {
    setSettings(loadSettings())
    setCustomPlaylists(loadCustomPlaylists())
  }, [])

  // Auto-play logic
  useEffect(() => {
    if (!settings.autoPlayEnabled) return

    if (isTimerActive && !isBreak && settings.autoPlayRules.includes('focus-start')) {
      const playlist = allPlaylists.find(p => p.id === settings.autoPlayPlaylist)
      if (playlist) {
        setCurrentPlaylist(playlist)
        setIsPlaying(true)
      }
    }

    if (isBreak && settings.pauseOnBreak) {
      setIsPlaying(false)
    }
  }, [isTimerActive, isBreak, settings])

  // All playlists combined
  const allPlaylists = useMemo(() => {
    return [...FOCUS_PLAYLISTS, ...customPlaylists]
  }, [customPlaylists])

  // Update settings
  const updateSettings = (key, value) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    saveSettings(updated)
  }

  // Toggle rule
  const toggleRule = (ruleId) => {
    const rules = settings.autoPlayRules.includes(ruleId)
      ? settings.autoPlayRules.filter(r => r !== ruleId)
      : [...settings.autoPlayRules, ruleId]
    updateSettings('autoPlayRules', rules)
  }

  // Play playlist
  const playPlaylist = (playlist) => {
    setCurrentPlaylist(playlist)
    setIsPlaying(true)
    onPlayStateChange?.(true, playlist)
  }

  // Toggle play/pause
  const togglePlay = () => {
    setIsPlaying(!isPlaying)
    onPlayStateChange?.(!isPlaying, currentPlaylist)
  }

  // Toggle favorite
  const toggleFavorite = (playlistId) => {
    setFavorites(prev =>
      prev.includes(playlistId)
        ? prev.filter(id => id !== playlistId)
        : [...prev, playlistId]
    )
  }

  // Add custom playlist
  const addCustomPlaylist = (playlist) => {
    const newPlaylist = {
      ...playlist,
      id: Date.now().toString(),
      isCustom: true,
    }
    const updated = [...customPlaylists, newPlaylist]
    setCustomPlaylists(updated)
    saveCustomPlaylists(updated)
    setShowAddModal(false)
  }

  // Open Spotify link
  const openSpotify = (spotifyId) => {
    window.open(`https://open.spotify.com/playlist/${spotifyId}`, '_blank')
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
            <h2 className="font-display text-xl font-semibold">Music & Focus</h2>
            <p className="text-sm text-white/50">Auto-play focus playlists</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Now Playing */}
        {currentPlaylist && (
          <motion.div
            {...getMotionProps(prefersReducedMotion, {
              initial: { opacity: 0, scale: 0.95 },
              animate: { opacity: 1, scale: 1 }
            })}
            className="mb-6 p-4 glass-card border border-green-500/30 bg-gradient-to-r from-green-500/10 to-emerald-500/10"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center text-3xl">
                {currentPlaylist.cover}
              </div>

              <div className="flex-1">
                <p className="font-medium">{currentPlaylist.name}</p>
                <p className="text-sm text-white/50">{currentPlaylist.description}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <Shuffle className="w-4 h-4 text-white/50" />
              </button>
              <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white ml-1" />
                )}
              </button>
              <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <SkipForward className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <Repeat className="w-4 h-4 text-white/50" />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 mt-4">
              <VolumeX className="w-4 h-4 text-white/50" />
              <input
                type="range"
                min="0"
                max="100"
                value={settings.volume}
                onChange={(e) => updateSettings('volume', parseInt(e.target.value))}
                className="flex-1"
              />
              <Volume2 className="w-4 h-4 text-white/50" />
            </div>
          </motion.div>
        )}

        {/* View Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'playlists', label: 'Playlists', icon: ListMusic },
            { id: 'settings', label: 'Settings', icon: Radio },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                viewMode === tab.id
                  ? 'bg-white/10 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Playlists View */}
        {viewMode === 'playlists' && (
          <div className="space-y-3">
            {allPlaylists.map((playlist) => {
              const isFavorite = favorites.includes(playlist.id)
              const isCurrent = currentPlaylist?.id === playlist.id

              return (
                <motion.div
                  key={playlist.id}
                  {...getMotionProps(prefersReducedMotion, {
                    initial: { opacity: 0, y: 10 },
                    animate: { opacity: 1, y: 0 }
                  })}
                  className={`glass-card p-3 ${isCurrent ? 'border border-green-500/30' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">
                      {playlist.cover}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{playlist.name}</p>
                      <p className="text-xs text-white/50">
                        {playlist.trackCount} tracks • {playlist.duration}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleFavorite(playlist.id)}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <Heart className={`w-4 h-4 ${isFavorite ? 'text-red-400 fill-red-400' : 'text-white/30'}`} />
                      </button>

                      {playlist.spotifyId && (
                        <button
                          onClick={() => openSpotify(playlist.spotifyId)}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 text-green-400" />
                        </button>
                      )}

                      <button
                        onClick={() => playPlaylist(playlist)}
                        className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 transition-colors"
                      >
                        {isCurrent && isPlaying ? (
                          <Pause className="w-4 h-4 text-green-400" />
                        ) : (
                          <Play className="w-4 h-4 text-green-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Settings View */}
        {viewMode === 'settings' && (
          <div className="space-y-4">
            {/* Auto-play Toggle */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">Auto-Play</p>
                  <p className="text-sm text-white/50">Automatically start music</p>
                </div>
                <button
                  onClick={() => updateSettings('autoPlayEnabled', !settings.autoPlayEnabled)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.autoPlayEnabled ? 'bg-green-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.autoPlayEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Default Playlist */}
              {settings.autoPlayEnabled && (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-white/70 mb-2">Default Playlist</p>
                    <select
                      value={settings.autoPlayPlaylist}
                      onChange={(e) => updateSettings('autoPlayPlaylist', e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                    >
                      {allPlaylists.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Rules */}
                  <div>
                    <p className="text-sm text-white/70 mb-2">Auto-play when:</p>
                    <div className="space-y-2">
                      {AUTO_PLAY_RULES.map((rule) => (
                        <button
                          key={rule.id}
                          onClick={() => toggleRule(rule.id)}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                            settings.autoPlayRules.includes(rule.id)
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-white/5 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border ${
                            settings.autoPlayRules.includes(rule.id)
                              ? 'bg-green-500 border-green-500'
                              : 'border-white/30'
                          }`}>
                            {settings.autoPlayRules.includes(rule.id) && (
                              <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm">{rule.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Playback Options */}
            <div className="glass-card p-4">
              <h3 className="font-medium mb-3">Playback Options</h3>

              <div className="space-y-3">
                <button
                  onClick={() => updateSettings('fadeIn', !settings.fadeIn)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5"
                >
                  <span className="text-sm text-white/70">Fade in on start</span>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${
                    settings.fadeIn ? 'bg-green-500' : 'bg-white/20'
                  }`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.fadeIn ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </div>
                </button>

                <button
                  onClick={() => updateSettings('fadeOut', !settings.fadeOut)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5"
                >
                  <span className="text-sm text-white/70">Fade out on stop</span>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${
                    settings.fadeOut ? 'bg-green-500' : 'bg-white/20'
                  }`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.fadeOut ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </div>
                </button>

                <button
                  onClick={() => updateSettings('pauseOnBreak', !settings.pauseOnBreak)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5"
                >
                  <span className="text-sm text-white/70">Pause during breaks</span>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${
                    settings.pauseOnBreak ? 'bg-green-500' : 'bg-white/20'
                  }`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.pauseOnBreak ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </div>
                </button>
              </div>
            </div>

            {/* Spotify Connection */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <Disc className="w-5 h-5 text-green-400" />
                <h3 className="font-medium">Spotify</h3>
              </div>
              <p className="text-sm text-white/50 mb-3">
                Connect your Spotify account to control playback directly from Nero.
              </p>
              <button className="w-full px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium transition-colors">
                Connect Spotify
              </button>
            </div>
          </div>
        )}

        {/* Add Playlist Modal */}
        <AnimatePresence>
          {showAddModal && (
            <AddPlaylistModal
              prefersReducedMotion={prefersReducedMotion}
              onClose={() => setShowAddModal(false)}
              onSave={addCustomPlaylist}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// Add Playlist Modal
function AddPlaylistModal({ prefersReducedMotion, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    spotifyUrl: '',
    cover: '🎵',
  })

  const covers = ['🎵', '🎧', '🎹', '🎸', '🎺', '🎻', '🥁', '🎤', '🎼', '🔊']

  const handleSave = () => {
    if (!formData.name.trim()) return

    // Extract Spotify ID from URL if provided
    let spotifyId = null
    if (formData.spotifyUrl) {
      const match = formData.spotifyUrl.match(/playlist\/([a-zA-Z0-9]+)/)
      spotifyId = match ? match[1] : null
    }

    onSave({
      ...formData,
      spotifyId,
      trackCount: 0,
      duration: 'Custom',
      genre: 'custom',
    })
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      {...getMotionProps(prefersReducedMotion, {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
      })}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative w-full max-w-md glass-card p-5"
        {...getMotionProps(prefersReducedMotion, {
          initial: { y: 100, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: 100, opacity: 0 }
        })}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold">Add Playlist</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cover */}
        <div className="mb-4">
          <label className="block text-sm text-white/70 mb-2">Cover</label>
          <div className="flex gap-2 flex-wrap">
            {covers.map((cover) => (
              <button
                key={cover}
                onClick={() => setFormData(prev => ({ ...prev, cover }))}
                className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                  formData.cover === cover
                    ? 'bg-green-500/20 ring-2 ring-green-500'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                {cover}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm text-white/70 mb-2">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="My Focus Playlist"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm text-white/70 mb-2">Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Perfect for deep work"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
          />
        </div>

        {/* Spotify URL */}
        <div className="mb-6">
          <label className="block text-sm text-white/70 mb-2">Spotify Playlist URL (optional)</label>
          <input
            type="text"
            value={formData.spotifyUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, spotifyUrl: e.target.value }))}
            placeholder="https://open.spotify.com/playlist/..."
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.name.trim()}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
              formData.name.trim()
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            Add Playlist
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
