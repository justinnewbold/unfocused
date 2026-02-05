import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  Clock,
  Play,
  Pause,
  LogOut,
  Plus,
  Lock,
  Globe,
  MessageSquare,
  Send,
  Settings,
  Volume2,
  VolumeX,
  UserPlus,
  Copy,
  Check,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const ROOMS_KEY = 'nero_focus_rooms'

// Pre-built room templates
const ROOM_TEMPLATES = [
  { id: 'deep-work', name: 'Deep Work', duration: 90, breakDuration: 15, maxUsers: 10, icon: '🧠' },
  { id: 'pomodoro', name: 'Pomodoro Sprint', duration: 25, breakDuration: 5, maxUsers: 20, icon: '🍅' },
  { id: 'study-hall', name: 'Study Hall', duration: 50, breakDuration: 10, maxUsers: 50, icon: '📚' },
  { id: 'morning-focus', name: 'Morning Focus', duration: 45, breakDuration: 10, maxUsers: 15, icon: '🌅' },
  { id: 'creative-flow', name: 'Creative Flow', duration: 60, breakDuration: 15, maxUsers: 10, icon: '🎨' },
]

// Demo users in rooms
const DEMO_USERS = [
  { id: '1', name: 'Focus Fox', avatar: '🦊', status: 'focusing', task: 'Writing report' },
  { id: '2', name: 'Study Owl', avatar: '🦉', status: 'focusing', task: 'Reading chapter 5' },
  { id: '3', name: 'Busy Bee', avatar: '🐝', status: 'break', task: 'Quick stretch' },
  { id: '4', name: 'Calm Cat', avatar: '🐱', status: 'focusing', task: 'Email inbox zero' },
  { id: '5', name: 'Diligent Dog', avatar: '🐕', status: 'focusing', task: 'Code review' },
]

// Public rooms
const PUBLIC_ROOMS = [
  { id: 'room-1', template: 'deep-work', users: DEMO_USERS.slice(0, 3), activeTimer: { remaining: 42 * 60, isBreak: false } },
  { id: 'room-2', template: 'pomodoro', users: DEMO_USERS.slice(1, 4), activeTimer: { remaining: 12 * 60, isBreak: false } },
  { id: 'room-3', template: 'study-hall', users: DEMO_USERS, activeTimer: { remaining: 5 * 60, isBreak: true } },
]

export default function FocusRooms({ onJoinRoom, currentTask }) {
  const prefersReducedMotion = useReducedMotion()
  const [rooms, setRooms] = useState(PUBLIC_ROOMS)
  const [currentRoom, setCurrentRoom] = useState(null)
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [viewMode, setViewMode] = useState('browse') // 'browse' | 'room'
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [userSettings, setUserSettings] = useState({
    micEnabled: false,
    videoEnabled: false,
    soundEnabled: true,
    showTask: true,
  })

  // User's presence in room
  const [myPresence, setMyPresence] = useState({
    id: 'me',
    name: 'You',
    avatar: '🧠',
    status: 'focusing',
    task: currentTask?.title || 'Getting ready...',
  })

  // Update task from props
  useEffect(() => {
    if (currentTask?.title) {
      setMyPresence(prev => ({ ...prev, task: currentTask.title }))
    }
  }, [currentTask])

  // Join room
  const joinRoom = (roomId) => {
    const room = rooms.find(r => r.id === roomId)
    if (room) {
      setCurrentRoom({
        ...room,
        users: [...room.users, myPresence],
      })
      setViewMode('room')
      onJoinRoom?.(room)

      // Add join message
      setChatMessages([{
        id: Date.now(),
        type: 'system',
        content: 'You joined the room',
        timestamp: new Date(),
      }])
    }
  }

  // Leave room
  const leaveRoom = () => {
    setCurrentRoom(null)
    setViewMode('browse')
    setChatMessages([])
  }

  // Send chat message
  const sendMessage = () => {
    if (!newMessage.trim()) return

    setChatMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      author: myPresence.name,
      avatar: myPresence.avatar,
      content: newMessage,
      timestamp: new Date(),
    }])
    setNewMessage('')
  }

  // Create room
  const createRoom = (templateId, isPrivate = false) => {
    const template = ROOM_TEMPLATES.find(t => t.id === templateId)
    if (!template) return

    const newRoom = {
      id: `room-${Date.now()}`,
      template: templateId,
      users: [myPresence],
      activeTimer: { remaining: template.duration * 60, isBreak: false },
      isPrivate,
      inviteCode: isPrivate ? Math.random().toString(36).substring(2, 8).toUpperCase() : null,
    }

    setRooms(prev => [newRoom, ...prev])
    setCurrentRoom(newRoom)
    setViewMode('room')
    setShowCreateRoom(false)
  }

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Get template info
  const getTemplate = (templateId) => {
    return ROOM_TEMPLATES.find(t => t.id === templateId) || ROOM_TEMPLATES[0]
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
        {/* Browse View */}
        {viewMode === 'browse' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-xl font-semibold">Focus Rooms</h2>
                <p className="text-sm text-white/50">Digital body doubling</p>
              </div>
              <button
                onClick={() => setShowCreateRoom(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create
              </button>
            </div>

            {/* Active Rooms */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white/70">Active Rooms</h3>

              {rooms.map((room) => {
                const template = getTemplate(room.template)

                return (
                  <motion.div
                    key={room.id}
                    {...getMotionProps(prefersReducedMotion, {
                      initial: { opacity: 0, y: 10 },
                      animate: { opacity: 1, y: 0 }
                    })}
                    className="glass-card p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-2xl">
                        {template.icon}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{template.name}</h3>
                          {room.isPrivate && <Lock className="w-3 h-3 text-white/30" />}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-white/50 mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {room.users.length}/{template.maxUsers}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {room.activeTimer.isBreak ? 'Break' : 'Focus'}: {formatTime(room.activeTimer.remaining)}
                          </span>
                        </div>

                        {/* User avatars */}
                        <div className="flex -space-x-2 mt-2">
                          {room.users.slice(0, 5).map((user) => (
                            <div
                              key={user.id}
                              className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-sm ring-2 ring-surface"
                              title={user.name}
                            >
                              {user.avatar}
                            </div>
                          ))}
                          {room.users.length > 5 && (
                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs ring-2 ring-surface">
                              +{room.users.length - 5}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => joinRoom(room.id)}
                        className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm transition-colors"
                      >
                        Join
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Tips */}
            <div className="mt-6 p-4 bg-white/5 rounded-xl">
              <p className="text-sm text-white/50">
                <strong className="text-white/70">Body Doubling:</strong> Working alongside others can
                help maintain focus. You don't need to interact - just knowing others are working too helps!
              </p>
            </div>
          </>
        )}

        {/* Room View */}
        {viewMode === 'room' && currentRoom && (
          <>
            {/* Room Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-xl">
                  {getTemplate(currentRoom.template).icon}
                </div>
                <div>
                  <h2 className="font-medium">{getTemplate(currentRoom.template).name}</h2>
                  <p className="text-xs text-white/50">{currentRoom.users.length} people focusing</p>
                </div>
              </div>
              <button
                onClick={leaveRoom}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Leave
              </button>
            </div>

            {/* Timer */}
            <div className={`glass-card p-6 mb-4 text-center ${
              currentRoom.activeTimer.isBreak ? 'border border-green-500/30' : 'border border-indigo-500/30'
            }`}>
              <p className="text-sm text-white/50 mb-2">
                {currentRoom.activeTimer.isBreak ? 'Break Time' : 'Focus Session'}
              </p>
              <p className="text-5xl font-bold font-mono">
                {formatTime(currentRoom.activeTimer.remaining)}
              </p>
            </div>

            {/* Participants */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-white/70 mb-2">Participants</h3>
              <div className="grid grid-cols-2 gap-2">
                {currentRoom.users.map((user) => (
                  <div
                    key={user.id}
                    className={`p-3 rounded-xl bg-white/5 ${
                      user.status === 'break' ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        {user.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className={`text-xs ${user.status === 'focusing' ? 'text-green-400' : 'text-yellow-400'}`}>
                          {user.status === 'focusing' ? '● Focusing' : '○ On break'}
                        </p>
                      </div>
                    </div>
                    {userSettings.showTask && (
                      <p className="text-xs text-white/40 truncate pl-10">{user.task}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Chat */}
            <div className="glass-card p-4">
              <h3 className="text-sm font-medium text-white/70 mb-2">Chat</h3>

              {/* Messages */}
              <div className="h-32 overflow-y-auto mb-3 space-y-2">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={msg.type === 'system' ? 'text-center' : ''}>
                    {msg.type === 'system' ? (
                      <span className="text-xs text-white/30">{msg.content}</span>
                    ) : (
                      <div className="flex items-start gap-2">
                        <span className="text-sm">{msg.avatar}</span>
                        <div>
                          <span className="text-xs text-white/50">{msg.author}</span>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {chatMessages.length === 0 && (
                  <p className="text-xs text-white/30 text-center">No messages yet</p>
                )}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Send a message..."
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-3 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={() => setUserSettings(prev => ({ ...prev, micEnabled: !prev.micEnabled }))}
                className={`p-3 rounded-xl transition-colors ${
                  userSettings.micEnabled ? 'bg-white/10' : 'bg-red-500/20 text-red-400'
                }`}
              >
                {userSettings.micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setUserSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                className={`p-3 rounded-xl transition-colors ${
                  userSettings.soundEnabled ? 'bg-white/10' : 'bg-red-500/20 text-red-400'
                }`}
              >
                {userSettings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
          </>
        )}

        {/* Create Room Modal */}
        <AnimatePresence>
          {showCreateRoom && (
            <motion.div
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 }
              })}
            >
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCreateRoom(false)} />

              <motion.div
                className="relative w-full max-w-md glass-card p-5"
                {...getMotionProps(prefersReducedMotion, {
                  initial: { y: 100, opacity: 0 },
                  animate: { y: 0, opacity: 1 },
                  exit: { y: 100, opacity: 0 }
                })}
              >
                <h3 className="font-display text-lg font-semibold mb-4">Create Focus Room</h3>

                <div className="space-y-2 mb-4">
                  {ROOM_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => createRoom(template.id, false)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-xl">
                        {template.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs text-white/50">
                          {template.duration}m focus / {template.breakDuration}m break
                        </p>
                      </div>
                      <Globe className="w-4 h-4 text-white/30" />
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowCreateRoom(false)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                >
                  Cancel
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
