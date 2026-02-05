import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Heart,
  Eye,
  EyeOff,
  Bell,
  MessageSquare,
  Trophy,
  Calendar,
  CheckCircle,
  Plus,
  X,
  ChevronRight,
  Shield,
  Star,
  Zap,
  Target,
  Send,
  UserPlus,
  Settings,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage keys
const FAMILY_MEMBERS_KEY = 'nero_family_members'
const FAMILY_SETTINGS_KEY = 'nero_family_settings'
const CHEERS_KEY = 'nero_family_cheers'

// Default sharing options
const SHARING_OPTIONS = [
  { id: 'wins', name: 'Celebrate Wins', description: 'Share when I complete important tasks', icon: Trophy },
  { id: 'streaks', name: 'Streak Updates', description: 'Share my focus streaks', icon: Zap },
  { id: 'goals', name: 'Goal Progress', description: 'Share progress toward my goals', icon: Target },
  { id: 'check-ins', name: 'Daily Check-ins', description: 'Let family send gentle check-ins', icon: MessageSquare },
]

// Load family members
const loadFamilyMembers = () => {
  try {
    const stored = localStorage.getItem(FAMILY_MEMBERS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save family members
const saveFamilyMembers = (members) => {
  localStorage.setItem(FAMILY_MEMBERS_KEY, JSON.stringify(members))
}

// Load cheers
const loadCheers = () => {
  try {
    const stored = localStorage.getItem(CHEERS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save cheers
const saveCheers = (cheers) => {
  localStorage.setItem(CHEERS_KEY, JSON.stringify(cheers))
}

export default function FamilyMode() {
  const prefersReducedMotion = useReducedMotion()
  const [familyMembers, setFamilyMembers] = useState([])
  const [cheers, setCheers] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [showCheers, setShowCheers] = useState(false)

  // New member form
  const [newMember, setNewMember] = useState({
    name: '',
    relationship: 'partner',
    permissions: ['wins'],
  })

  // Load data on mount
  useEffect(() => {
    setFamilyMembers(loadFamilyMembers())
    setCheers(loadCheers())
  }, [])

  // Add family member
  const addMember = () => {
    if (!newMember.name.trim()) return

    const member = {
      id: Date.now().toString(),
      ...newMember,
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      status: 'pending',
      joinedAt: null,
      createdAt: new Date().toISOString(),
    }

    const updated = [...familyMembers, member]
    setFamilyMembers(updated)
    saveFamilyMembers(updated)

    setNewMember({ name: '', relationship: 'partner', permissions: ['wins'] })
    setShowAddModal(false)
  }

  // Remove member
  const removeMember = (id) => {
    const updated = familyMembers.filter(m => m.id !== id)
    setFamilyMembers(updated)
    saveFamilyMembers(updated)
  }

  // Toggle permission
  const togglePermission = (memberId, permissionId) => {
    const updated = familyMembers.map(m => {
      if (m.id === memberId) {
        const permissions = m.permissions.includes(permissionId)
          ? m.permissions.filter(p => p !== permissionId)
          : [...m.permissions, permissionId]
        return { ...m, permissions }
      }
      return m
    })
    setFamilyMembers(updated)
    saveFamilyMembers(updated)
  }

  // Simulate receiving a cheer
  const receiveCheer = (fromName) => {
    const cheer = {
      id: Date.now().toString(),
      from: fromName,
      message: getRandomCheerMessage(),
      type: 'cheer',
      timestamp: new Date().toISOString(),
      read: false,
    }
    const updated = [cheer, ...cheers]
    setCheers(updated)
    saveCheers(updated)
  }

  // Random cheer messages
  const getRandomCheerMessage = () => {
    const messages = [
      "You've got this! 💪",
      "So proud of you! ⭐",
      "Keep up the amazing work!",
      "You're doing great! 🎉",
      "Cheering you on! 📣",
      "One step at a time! 🚀",
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  // Mark cheers as read
  const markCheersRead = () => {
    const updated = cheers.map(c => ({ ...c, read: true }))
    setCheers(updated)
    saveCheers(updated)
  }

  // Unread count
  const unreadCount = cheers.filter(c => !c.read).length

  // Relationship options
  const RELATIONSHIPS = [
    { id: 'partner', name: 'Partner/Spouse' },
    { id: 'parent', name: 'Parent' },
    { id: 'sibling', name: 'Sibling' },
    { id: 'child', name: 'Child' },
    { id: 'friend', name: 'Close Friend' },
    { id: 'other', name: 'Other' },
  ]

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
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <Heart className="w-6 h-6 text-pink-400" />
              Family Support
            </h2>
            <p className="text-sm text-white/50">Let loved ones cheer you on</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowCheers(true)
                markCheersRead()
              }}
              className="relative p-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Invite
            </button>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-6 p-4 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-xl border border-pink-500/20">
          <h3 className="text-sm font-medium mb-2">Supportive, Not Surveillance</h3>
          <p className="text-xs text-white/60">
            Family Mode lets loved ones send encouragement without monitoring you.
            They only see what you choose to share — celebrations, not struggles.
          </p>
        </div>

        {/* Family Members */}
        {familyMembers.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <h3 className="font-medium mb-2">Your Support Circle</h3>
            <p className="text-sm text-white/50 mb-4">
              Invite family or close friends to celebrate your wins with you
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 transition-colors"
            >
              Invite Someone
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {familyMembers.map((member) => (
              <motion.div
                key={member.id}
                {...getMotionProps(prefersReducedMotion, {
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 }
                })}
                className="glass-card p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">{member.name}</h3>
                      <p className="text-xs text-white/50 capitalize">{member.relationship}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      member.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {member.status === 'active' ? 'Connected' : 'Pending'}
                    </span>
                    <button
                      onClick={() => setSelectedMember(
                        selectedMember === member.id ? null : member.id
                      )}
                      className="p-1 rounded-lg hover:bg-white/10"
                    >
                      <Settings className="w-4 h-4 text-white/50" />
                    </button>
                  </div>
                </div>

                {/* Invite Code */}
                {member.status === 'pending' && (
                  <div className="p-3 bg-white/5 rounded-lg mb-3">
                    <p className="text-xs text-white/50 mb-1">Share this code:</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg tracking-widest text-pink-400">
                        {member.inviteCode}
                      </span>
                      <button
                        onClick={() => navigator.clipboard?.writeText(member.inviteCode)}
                        className="p-1 rounded hover:bg-white/10"
                      >
                        <Send className="w-4 h-4 text-white/50" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Demo: Send Cheer */}
                <button
                  onClick={() => receiveCheer(member.name)}
                  className="w-full px-3 py-2 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 text-sm transition-colors"
                >
                  <Star className="w-4 h-4 inline mr-2" />
                  Simulate Cheer from {member.name}
                </button>

                {/* Permission Settings */}
                <AnimatePresence>
                  {selectedMember === member.id && (
                    <motion.div
                      {...getMotionProps(prefersReducedMotion, {
                        initial: { opacity: 0, height: 0 },
                        animate: { opacity: 1, height: 'auto' },
                        exit: { opacity: 0, height: 0 }
                      })}
                      className="mt-4 pt-4 border-t border-white/10"
                    >
                      <p className="text-sm text-white/70 mb-3">What can they see?</p>
                      <div className="space-y-2">
                        {SHARING_OPTIONS.map((option) => {
                          const Icon = option.icon
                          const isEnabled = member.permissions.includes(option.id)

                          return (
                            <button
                              key={option.id}
                              onClick={() => togglePermission(member.id, option.id)}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                isEnabled
                                  ? 'bg-pink-500/20 border border-pink-500/30'
                                  : 'bg-white/5 hover:bg-white/10'
                              }`}
                            >
                              <Icon className={`w-4 h-4 ${isEnabled ? 'text-pink-400' : 'text-white/50'}`} />
                              <div className="flex-1 text-left">
                                <p className="text-sm font-medium">{option.name}</p>
                                <p className="text-xs text-white/50">{option.description}</p>
                              </div>
                              {isEnabled ? (
                                <Eye className="w-4 h-4 text-pink-400" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-white/30" />
                              )}
                            </button>
                          )
                        })}
                      </div>

                      <button
                        onClick={() => removeMember(member.id)}
                        className="w-full mt-4 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition-colors"
                      >
                        <X className="w-4 h-4 inline mr-1" />
                        Remove {member.name}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}

        {/* Recent Cheers */}
        {cheers.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-white/70 mb-3">Recent Cheers</h3>
            <div className="space-y-2">
              {cheers.slice(0, 3).map((cheer) => (
                <motion.div
                  key={cheer.id}
                  {...getMotionProps(prefersReducedMotion, {
                    initial: { opacity: 0, scale: 0.95 },
                    animate: { opacity: 1, scale: 1 }
                  })}
                  className="p-3 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-xl border border-pink-500/20"
                >
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm">
                      <strong>{cheer.from}</strong>: {cheer.message}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 }
              })}
              className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                {...getMotionProps(prefersReducedMotion, {
                  initial: { scale: 0.95 },
                  animate: { scale: 1 },
                  exit: { scale: 0.95 }
                })}
                className="bg-[#1a1a2e] rounded-2xl p-6 w-full max-w-md"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="font-display text-lg font-semibold mb-4">Invite Family Member</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Name</label>
                    <input
                      type="text"
                      value={newMember.name}
                      onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Mom, Partner, etc."
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-pink-500/50 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/70 mb-1">Relationship</label>
                    <select
                      value={newMember.relationship}
                      onChange={(e) => setNewMember(prev => ({ ...prev, relationship: e.target.value }))}
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-pink-500/50 outline-none"
                    >
                      {RELATIONSHIPS.map(rel => (
                        <option key={rel.id} value={rel.id}>{rel.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-white/70 mb-2">Initial Permissions</label>
                    <div className="space-y-2">
                      {SHARING_OPTIONS.map((option) => {
                        const Icon = option.icon
                        const isEnabled = newMember.permissions.includes(option.id)

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                              setNewMember(prev => ({
                                ...prev,
                                permissions: isEnabled
                                  ? prev.permissions.filter(p => p !== option.id)
                                  : [...prev.permissions, option.id]
                              }))
                            }}
                            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                              isEnabled ? 'bg-pink-500/20' : 'bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${isEnabled ? 'text-pink-400' : 'text-white/50'}`} />
                            <span className="text-sm">{option.name}</span>
                            <CheckCircle className={`w-4 h-4 ml-auto ${isEnabled ? 'text-pink-400' : 'text-white/20'}`} />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addMember}
                    disabled={!newMember.name.trim()}
                    className="flex-1 px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Create Invite
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cheers Modal */}
        <AnimatePresence>
          {showCheers && (
            <motion.div
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 }
              })}
              className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
              onClick={() => setShowCheers(false)}
            >
              <motion.div
                {...getMotionProps(prefersReducedMotion, {
                  initial: { scale: 0.95 },
                  animate: { scale: 1 },
                  exit: { scale: 0.95 }
                })}
                className="bg-[#1a1a2e] rounded-2xl p-6 w-full max-w-md max-h-[70vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="font-display text-lg font-semibold mb-4">Your Cheers 🎉</h3>

                {cheers.length === 0 ? (
                  <p className="text-center text-white/50 py-8">
                    No cheers yet. Your family will send encouragement when you achieve things!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {cheers.map((cheer) => (
                      <div
                        key={cheer.id}
                        className="p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-xl"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="font-medium">{cheer.from}</span>
                        </div>
                        <p className="text-sm text-white/80">{cheer.message}</p>
                        <p className="text-xs text-white/40 mt-2">
                          {new Date(cheer.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setShowCheers(false)}
                  className="w-full mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
