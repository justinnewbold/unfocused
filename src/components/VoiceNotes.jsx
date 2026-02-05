import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Trash2,
  Plus,
  Square,
  Clock,
  Tag,
  Search,
  Volume2,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const VOICE_NOTES_KEY = 'nero_voice_notes'

// Load voice notes metadata
const loadVoiceNotes = () => {
  try {
    const stored = localStorage.getItem(VOICE_NOTES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save voice notes metadata
const saveVoiceNotes = (notes) => {
  localStorage.setItem(VOICE_NOTES_KEY, JSON.stringify(notes))
}

// Format duration
const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Tags
const DEFAULT_TAGS = ['Task', 'Idea', 'Reminder', 'Note', 'Meeting']

export default function VoiceNotes({ onCreateTask }) {
  const prefersReducedMotion = useReducedMotion()
  const [notes, setNotes] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [playingId, setPlayingId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState(null)
  const [showTagPicker, setShowTagPicker] = useState(null)
  const [editingTitle, setEditingTitle] = useState(null)
  const [newTitle, setNewTitle] = useState('')

  // Refs
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const audioRef = useRef(null)
  const timerRef = useRef(null)

  // Load notes on mount
  useEffect(() => {
    setNotes(loadVoiceNotes())
  }, [])

  // Check for Web Audio API support
  const isSupported = typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia

  // Start recording
  const startRecording = async () => {
    if (!isSupported) {
      alert('Voice recording is not supported in your browser')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        saveRecording(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Error accessing microphone:', err)
      alert('Could not access microphone. Please check your permissions.')
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(timerRef.current)
    }
  }

  // Save recording
  const saveRecording = (blob) => {
    // Convert blob to base64 for localStorage
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result

      const note = {
        id: Date.now().toString(),
        title: `Voice Note ${notes.length + 1}`,
        duration: recordingTime,
        audioData: base64,
        tag: null,
        createdAt: new Date().toISOString(),
      }

      const updatedNotes = [note, ...notes]
      setNotes(updatedNotes)
      saveVoiceNotes(updatedNotes)
    }
    reader.readAsDataURL(blob)
  }

  // Play note
  const playNote = (note) => {
    if (playingId === note.id) {
      // Pause
      if (audioRef.current) {
        audioRef.current.pause()
      }
      setPlayingId(null)
    } else {
      // Play
      if (audioRef.current) {
        audioRef.current.pause()
      }

      const audio = new Audio(note.audioData)
      audioRef.current = audio

      audio.onended = () => {
        setPlayingId(null)
      }

      audio.play()
      setPlayingId(note.id)
    }
  }

  // Delete note
  const deleteNote = (noteId) => {
    const updatedNotes = notes.filter(n => n.id !== noteId)
    setNotes(updatedNotes)
    saveVoiceNotes(updatedNotes)

    if (playingId === noteId && audioRef.current) {
      audioRef.current.pause()
      setPlayingId(null)
    }
  }

  // Update note tag
  const updateTag = (noteId, tag) => {
    const updatedNotes = notes.map(n =>
      n.id === noteId ? { ...n, tag } : n
    )
    setNotes(updatedNotes)
    saveVoiceNotes(updatedNotes)
    setShowTagPicker(null)
  }

  // Update note title
  const updateTitle = (noteId) => {
    if (!newTitle.trim()) {
      setEditingTitle(null)
      return
    }

    const updatedNotes = notes.map(n =>
      n.id === noteId ? { ...n, title: newTitle.trim() } : n
    )
    setNotes(updatedNotes)
    saveVoiceNotes(updatedNotes)
    setEditingTitle(null)
    setNewTitle('')
  }

  // Filter notes
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = !searchQuery ||
        note.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesTag = !selectedTag || note.tag === selectedTag
      return matchesSearch && matchesTag
    })
  }, [notes, searchQuery, selectedTag])

  // Download note
  const downloadNote = (note) => {
    const link = document.createElement('a')
    link.href = note.audioData
    link.download = `${note.title.replace(/\s+/g, '_')}.webm`
    link.click()
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      clearInterval(timerRef.current)
    }
  }, [])

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
            <h2 className="font-display text-xl font-semibold">Voice Notes</h2>
            <p className="text-sm text-white/50">Capture thoughts instantly</p>
          </div>
        </div>

        {/* Recording Button */}
        <div className="flex justify-center mb-6">
          <motion.button
            onClick={isRecording ? stopRecording : startRecording}
            whileHover={!prefersReducedMotion ? { scale: 1.05 } : {}}
            whileTap={!prefersReducedMotion ? { scale: 0.95 } : {}}
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-nero-500 hover:bg-nero-600'
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-8 h-8 text-white" />
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-red-400"
                  animate={{ scale: [1, 1.1, 1], opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              </>
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </motion.button>
        </div>

        {/* Recording Timer */}
        {isRecording && (
          <motion.div
            {...getMotionProps(prefersReducedMotion, {
              initial: { opacity: 0 },
              animate: { opacity: 1 }
            })}
            className="text-center mb-6"
          >
            <p className="text-2xl font-mono text-red-400">{formatDuration(recordingTime)}</p>
            <p className="text-sm text-white/50">Recording...</p>
          </motion.div>
        )}

        {/* Search and Filter */}
        {notes.length > 0 && (
          <div className="mb-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
              />
            </div>

            {/* Tag Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  !selectedTag
                    ? 'bg-white/10 text-white'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                All
              </button>
              {DEFAULT_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    selectedTag === tag
                      ? 'bg-nero-500/20 text-nero-400'
                      : 'bg-white/5 text-white/50 hover:bg-white/10'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notes List */}
        <div className="space-y-3">
          {filteredNotes.map((note) => (
            <motion.div
              key={note.id}
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0 }
              })}
              className="glass-card p-4"
            >
              <div className="flex items-start gap-3">
                {/* Play Button */}
                <button
                  onClick={() => playNote(note)}
                  className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center transition-colors ${
                    playingId === note.id
                      ? 'bg-nero-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {playingId === note.id ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {editingTitle === note.id ? (
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onBlur={() => updateTitle(note.id)}
                      onKeyDown={(e) => e.key === 'Enter' && updateTitle(note.id)}
                      className="w-full bg-white/10 rounded px-2 py-1 text-sm focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setEditingTitle(note.id)
                        setNewTitle(note.title)
                      }}
                      className="font-medium text-left hover:text-nero-400 transition-colors"
                    >
                      {note.title}
                    </button>
                  )}

                  <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(note.duration)}
                    </span>
                    <span>
                      {new Date(note.createdAt).toLocaleDateString('en', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {/* Tag */}
                  <div className="mt-2 relative">
                    <button
                      onClick={() => setShowTagPicker(showTagPicker === note.id ? null : note.id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                        note.tag
                          ? 'bg-nero-500/20 text-nero-400'
                          : 'bg-white/5 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      <Tag className="w-3 h-3" />
                      {note.tag || 'Add tag'}
                    </button>

                    {showTagPicker === note.id && (
                      <div className="absolute left-0 top-full mt-1 bg-surface-dark border border-white/10 rounded-lg p-2 z-10 flex flex-wrap gap-1">
                        {DEFAULT_TAGS.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => updateTag(note.id, tag)}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
                              note.tag === tag
                                ? 'bg-nero-500/20 text-nero-400'
                                : 'bg-white/5 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                        {note.tag && (
                          <button
                            onClick={() => updateTag(note.id, null)}
                            className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <button
                    onClick={() => downloadNote(note)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4 text-white/50" />
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-400/50" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {notes.length === 0 && (
          <div className="text-center py-12">
            <Mic className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">No voice notes yet</p>
            <p className="text-sm text-white/30 mt-1">
              Tap the mic to record your first note
            </p>
          </div>
        )}

        {filteredNotes.length === 0 && notes.length > 0 && (
          <div className="text-center py-8">
            <p className="text-white/50">No notes match your search</p>
          </div>
        )}

        {/* Tips */}
        <div className="mt-6 p-4 bg-white/5 rounded-xl">
          <p className="text-sm text-white/50">
            <strong className="text-white/70">ADHD tip:</strong> Voice notes are perfect for capturing
            ideas before they disappear. Don't filter - just record and organize later!
          </p>
        </div>

        {/* Browser Support Warning */}
        {!isSupported && (
          <div className="mt-4 p-4 bg-orange-500/20 rounded-xl border border-orange-500/30">
            <p className="text-sm text-orange-400">
              Voice recording is not supported in your browser. Try using Chrome, Firefox, or Safari.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
