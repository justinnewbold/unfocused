import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Heart,
  MessageCircle,
  Share2,
  Plus,
  Sparkles,
  Lightbulb,
  Trophy,
  Filter,
  TrendingUp,
  Clock,
  BookOpen,
  ThumbsUp,
  Flag,
  MoreHorizontal,
  Send,
  X,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const FEED_KEY = 'nero_community_feed'
const USER_KEY = 'nero_community_user'

// Post types
const POST_TYPES = [
  { id: 'tip', label: 'Tip', icon: Lightbulb, color: 'yellow' },
  { id: 'win', label: 'Win', icon: Trophy, color: 'green' },
  { id: 'question', label: 'Question', icon: MessageCircle, color: 'blue' },
  { id: 'encouragement', label: 'Encouragement', icon: Heart, color: 'pink' },
]

// Demo posts
const DEMO_POSTS = [
  {
    id: '1',
    type: 'tip',
    content: 'Body doubling works even better when you tell the other person what you\'re working on. The accountability makes a huge difference!',
    author: 'Anonymous Brain',
    avatar: '🧠',
    likes: 47,
    comments: 12,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    tags: ['body-doubling', 'accountability'],
  },
  {
    id: '2',
    type: 'win',
    content: 'Finally finished a project I started 3 months ago! Broke it into tiny pieces and celebrated each one. You can do this too! 🎉',
    author: 'Focused Fox',
    avatar: '🦊',
    likes: 89,
    comments: 23,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    tags: ['task-breakdown', 'celebration'],
  },
  {
    id: '3',
    type: 'tip',
    content: 'Put your phone in another room during focus time. Not on silent. Not face down. ANOTHER ROOM. Game changer.',
    author: 'Distraction Destroyer',
    avatar: '🛡️',
    likes: 156,
    comments: 34,
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    tags: ['focus', 'distraction'],
  },
  {
    id: '4',
    type: 'encouragement',
    content: 'If you\'re reading this, you\'re doing better than you think. ADHD is hard mode, and you\'re still here. That\'s not nothing. 💪',
    author: 'Cheerful Champion',
    avatar: '✨',
    likes: 234,
    comments: 45,
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    tags: ['motivation', 'self-compassion'],
  },
  {
    id: '5',
    type: 'question',
    content: 'Does anyone else feel more productive late at night? Is this an ADHD thing or just me? How do you manage it with a normal schedule?',
    author: 'Night Owl',
    avatar: '🦉',
    likes: 67,
    comments: 41,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    tags: ['sleep', 'productivity'],
  },
  {
    id: '6',
    type: 'tip',
    content: 'The "2-minute rule" saved my inbox: If it takes less than 2 minutes, do it NOW. Don\'t add it to a list. Just do it.',
    author: 'Quick Fixer',
    avatar: '⚡',
    likes: 112,
    comments: 19,
    timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    tags: ['productivity', 'email'],
  },
]

// Load user profile
const loadUser = () => {
  try {
    const stored = localStorage.getItem(USER_KEY)
    return stored ? JSON.parse(stored) : {
      avatar: '🧠',
      name: 'Anonymous Brain',
      joined: new Date().toISOString(),
    }
  } catch {
    return { avatar: '🧠', name: 'Anonymous Brain' }
  }
}

// Save user
const saveUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export default function CommunityFeed() {
  const prefersReducedMotion = useReducedMotion()
  const [posts, setPosts] = useState(DEMO_POSTS)
  const [user, setUser] = useState(loadUser())
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent') // 'recent' | 'popular'
  const [showNewPost, setShowNewPost] = useState(false)
  const [likedPosts, setLikedPosts] = useState([])

  // New post form
  const [newPost, setNewPost] = useState({
    type: 'tip',
    content: '',
    tags: [],
  })

  // Filtered and sorted posts
  const displayedPosts = useMemo(() => {
    let filtered = posts

    if (filter !== 'all') {
      filtered = filtered.filter(p => p.type === filter)
    }

    if (sortBy === 'popular') {
      filtered = [...filtered].sort((a, b) => b.likes - a.likes)
    } else {
      filtered = [...filtered].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    }

    return filtered
  }, [posts, filter, sortBy])

  // Toggle like
  const toggleLike = (postId) => {
    if (likedPosts.includes(postId)) {
      setLikedPosts(prev => prev.filter(id => id !== postId))
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, likes: p.likes - 1 } : p
      ))
    } else {
      setLikedPosts(prev => [...prev, postId])
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, likes: p.likes + 1 } : p
      ))
    }
  }

  // Create post
  const createPost = () => {
    if (!newPost.content.trim()) return

    const post = {
      id: Date.now().toString(),
      ...newPost,
      author: user.name,
      avatar: user.avatar,
      likes: 0,
      comments: 0,
      timestamp: new Date().toISOString(),
    }

    setPosts(prev => [post, ...prev])
    setNewPost({ type: 'tip', content: '', tags: [] })
    setShowNewPost(false)
  }

  // Format timestamp
  const formatTime = (timestamp) => {
    const diff = (Date.now() - new Date(timestamp).getTime()) / 1000

    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  // Get post type info
  const getTypeInfo = (type) => {
    return POST_TYPES.find(t => t.id === type) || POST_TYPES[0]
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
            <h2 className="font-display text-xl font-semibold">Community</h2>
            <p className="text-sm text-white/50">Tips & wins from ADHD brains</p>
          </div>
          <button
            onClick={() => setShowNewPost(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-nero-500 hover:bg-nero-600 text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Post
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
              filter === 'all' ? 'bg-white/10 text-white' : 'bg-white/5 text-white/50'
            }`}
          >
            All
          </button>
          {POST_TYPES.map((type) => {
            const Icon = type.icon
            return (
              <button
                key={type.id}
                onClick={() => setFilter(type.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  filter === type.id ? `bg-${type.color}-500/20 text-${type.color}-400` : 'bg-white/5 text-white/50'
                }`}
              >
                <Icon className="w-3 h-3" />
                {type.label}
              </button>
            )
          })}
        </div>

        {/* Sort */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSortBy('recent')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              sortBy === 'recent' ? 'bg-white/10 text-white' : 'bg-white/5 text-white/50'
            }`}
          >
            <Clock className="w-3 h-3" />
            Recent
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              sortBy === 'popular' ? 'bg-white/10 text-white' : 'bg-white/5 text-white/50'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            Popular
          </button>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {displayedPosts.map((post) => {
            const typeInfo = getTypeInfo(post.type)
            const TypeIcon = typeInfo.icon
            const isLiked = likedPosts.includes(post.id)

            return (
              <motion.div
                key={post.id}
                {...getMotionProps(prefersReducedMotion, {
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 }
                })}
                className="glass-card p-4"
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl">
                    {post.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{post.author}</span>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-${typeInfo.color}-500/20 text-${typeInfo.color}-400`}>
                        <TypeIcon className="w-3 h-3" />
                        {typeInfo.label}
                      </span>
                    </div>
                    <span className="text-xs text-white/40">{formatTime(post.timestamp)}</span>
                  </div>
                  <button className="p-1 rounded-lg hover:bg-white/10">
                    <MoreHorizontal className="w-4 h-4 text-white/30" />
                  </button>
                </div>

                {/* Content */}
                <p className="text-sm mb-3 leading-relaxed">{post.content}</p>

                {/* Tags */}
                {post.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/50">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 pt-2 border-t border-white/10">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-1 text-sm transition-colors ${
                      isLiked ? 'text-red-400' : 'text-white/50 hover:text-white/70'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-400' : ''}`} />
                    {post.likes}
                  </button>
                  <button className="flex items-center gap-1 text-sm text-white/50 hover:text-white/70">
                    <MessageCircle className="w-4 h-4" />
                    {post.comments}
                  </button>
                  <button className="flex items-center gap-1 text-sm text-white/50 hover:text-white/70 ml-auto">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-3 bg-white/5 rounded-xl">
          <p className="text-xs text-white/40 text-center">
            All posts are anonymous. Be kind and supportive. 💙
          </p>
        </div>

        {/* New Post Modal */}
        <AnimatePresence>
          {showNewPost && (
            <motion.div
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 }
              })}
            >
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowNewPost(false)} />

              <motion.div
                className="relative w-full max-w-md glass-card p-5"
                {...getMotionProps(prefersReducedMotion, {
                  initial: { y: 100, opacity: 0 },
                  animate: { y: 0, opacity: 1 },
                  exit: { y: 100, opacity: 0 }
                })}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-semibold">Share with Community</h3>
                  <button onClick={() => setShowNewPost(false)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Post Type */}
                <div className="flex gap-2 mb-4">
                  {POST_TYPES.map((type) => {
                    const Icon = type.icon
                    return (
                      <button
                        key={type.id}
                        onClick={() => setNewPost(prev => ({ ...prev, type: type.id }))}
                        className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
                          newPost.type === type.id
                            ? `bg-${type.color}-500/20 text-${type.color}-400 border border-${type.color}-500/30`
                            : 'bg-white/5 text-white/50 hover:bg-white/10'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{type.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Content */}
                <div className="mb-4">
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                    placeholder={
                      newPost.type === 'tip' ? 'Share a tip that helps you...' :
                      newPost.type === 'win' ? 'Celebrate a win!' :
                      newPost.type === 'question' ? 'Ask the community...' :
                      'Send some encouragement...'
                    }
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 resize-none"
                    rows={4}
                  />
                  <p className="text-xs text-white/40 mt-1 text-right">
                    {newPost.content.length}/280
                  </p>
                </div>

                {/* Author Preview */}
                <div className="flex items-center gap-3 mb-4 p-3 bg-white/5 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    {user.avatar}
                  </div>
                  <span className="text-sm text-white/70">Posting as {user.name}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowNewPost(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createPost}
                    disabled={!newPost.content.trim() || newPost.content.length > 280}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                      newPost.content.trim() && newPost.content.length <= 280
                        ? 'bg-nero-500 hover:bg-nero-600 text-white'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    Post
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
