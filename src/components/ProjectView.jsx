import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FolderKanban,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CheckCircle,
  Circle,
  Clock,
  Target,
  Trash2,
  Edit2,
  Calendar,
  Flag,
  MoreVertical,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const PROJECTS_KEY = 'nero_projects'

// Project colors
const PROJECT_COLORS = [
  { id: 'blue', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', fill: 'bg-blue-500' },
  { id: 'purple', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30', fill: 'bg-purple-500' },
  { id: 'green', bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', fill: 'bg-green-500' },
  { id: 'orange', bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', fill: 'bg-orange-500' },
  { id: 'pink', bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30', fill: 'bg-pink-500' },
  { id: 'cyan', bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30', fill: 'bg-cyan-500' },
]

// Load projects
const loadProjects = () => {
  try {
    const stored = localStorage.getItem(PROJECTS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save projects
const saveProjects = (projects) => {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
}

export default function ProjectView({ onSelectTask }) {
  const prefersReducedMotion = useReducedMotion()
  const [projects, setProjects] = useState([])
  const [expandedProject, setExpandedProject] = useState(null)
  const [showAddProject, setShowAddProject] = useState(false)
  const [showAddTask, setShowAddTask] = useState(null) // project id
  const [editingProject, setEditingProject] = useState(null)

  // Form state
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    color: 'blue',
    deadline: '',
  })

  const [newTask, setNewTask] = useState({
    title: '',
    energyRequired: 2,
  })

  // Load data on mount
  useEffect(() => {
    setProjects(loadProjects())
  }, [])

  // Calculate project stats
  const getProjectStats = (project) => {
    const total = project.tasks?.length || 0
    const completed = project.tasks?.filter(t => t.completed).length || 0
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, progress }
  }

  // Get color class
  const getColor = (colorId, type) => {
    const color = PROJECT_COLORS.find(c => c.id === colorId) || PROJECT_COLORS[0]
    return color[type]
  }

  // Save project
  const saveProject = () => {
    if (!newProject.name.trim()) return

    let updatedProjects
    if (editingProject) {
      updatedProjects = projects.map(p =>
        p.id === editingProject.id ? { ...p, ...newProject } : p
      )
    } else {
      const project = {
        ...newProject,
        id: Date.now().toString(),
        tasks: [],
        createdAt: new Date().toISOString(),
      }
      updatedProjects = [project, ...projects]
    }

    setProjects(updatedProjects)
    saveProjects(updatedProjects)
    resetProjectForm()
  }

  // Delete project
  const deleteProject = (projectId) => {
    const updatedProjects = projects.filter(p => p.id !== projectId)
    setProjects(updatedProjects)
    saveProjects(updatedProjects)
  }

  // Add task to project
  const addTask = (projectId) => {
    if (!newTask.title.trim()) return

    const task = {
      id: Date.now().toString(),
      title: newTask.title,
      energyRequired: newTask.energyRequired,
      completed: false,
      createdAt: new Date().toISOString(),
    }

    const updatedProjects = projects.map(p =>
      p.id === projectId
        ? { ...p, tasks: [...(p.tasks || []), task] }
        : p
    )

    setProjects(updatedProjects)
    saveProjects(updatedProjects)
    setNewTask({ title: '', energyRequired: 2 })
    setShowAddTask(null)
  }

  // Toggle task completion
  const toggleTask = (projectId, taskId) => {
    const updatedProjects = projects.map(p =>
      p.id === projectId
        ? {
            ...p,
            tasks: p.tasks.map(t =>
              t.id === taskId ? { ...t, completed: !t.completed } : t
            )
          }
        : p
    )

    setProjects(updatedProjects)
    saveProjects(updatedProjects)
  }

  // Delete task
  const deleteTask = (projectId, taskId) => {
    const updatedProjects = projects.map(p =>
      p.id === projectId
        ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) }
        : p
    )

    setProjects(updatedProjects)
    saveProjects(updatedProjects)
  }

  // Start task in One Thing mode
  const startTask = (project, task) => {
    onSelectTask?.({
      id: task.id,
      title: task.title,
      description: `Part of: ${project.name}`,
      energyRequired: task.energyRequired,
      reason: 'Project task',
      isCompleted: false,
      projectId: project.id,
    })
  }

  // Reset form
  const resetProjectForm = () => {
    setNewProject({
      name: '',
      description: '',
      color: 'blue',
      deadline: '',
    })
    setEditingProject(null)
    setShowAddProject(false)
  }

  // Start editing
  const startEdit = (project) => {
    setEditingProject(project)
    setNewProject({
      name: project.name,
      description: project.description || '',
      color: project.color,
      deadline: project.deadline || '',
    })
    setShowAddProject(true)
  }

  // Overall stats
  const stats = useMemo(() => {
    let totalTasks = 0
    let completedTasks = 0

    projects.forEach(p => {
      totalTasks += p.tasks?.length || 0
      completedTasks += p.tasks?.filter(t => t.completed).length || 0
    })

    return {
      projectCount: projects.length,
      totalTasks,
      completedTasks,
      activeProjects: projects.filter(p => {
        const stats = getProjectStats(p)
        return stats.progress < 100
      }).length,
    }
  }, [projects])

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
            <h2 className="font-display text-xl font-semibold">Projects</h2>
            <p className="text-sm text-white/50">Organize related tasks together</p>
          </div>
          <button
            onClick={() => setShowAddProject(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>

        {/* Stats */}
        {stats.projectCount > 0 && (
          <div className="glass-card p-4 mb-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{stats.activeProjects}</p>
                <p className="text-xs text-white/50">Active</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">{stats.totalTasks}</p>
                <p className="text-xs text-white/50">Tasks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{stats.completedTasks}</p>
                <p className="text-xs text-white/50">Done</p>
              </div>
            </div>
          </div>
        )}

        {/* Projects List */}
        <div className="space-y-3">
          {projects.map((project) => {
            const stats = getProjectStats(project)
            const isExpanded = expandedProject === project.id

            return (
              <motion.div
                key={project.id}
                {...getMotionProps(prefersReducedMotion, {
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 }
                })}
                className={`glass-card overflow-hidden ${getColor(project.color, 'border')} border`}
              >
                {/* Project Header */}
                <button
                  onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${getColor(project.color, 'bg')} flex items-center justify-center`}>
                      <FolderKanban className={`w-5 h-5 ${getColor(project.color, 'text')}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">{project.name}</h3>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-white/50" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-white/50" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-white/50">
                          {stats.completed}/{stats.total} tasks
                        </span>
                        {project.deadline && (
                          <span className="text-xs text-white/50 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(project.deadline).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getColor(project.color, 'fill')} transition-all duration-500`}
                      style={{ width: `${stats.progress}%` }}
                    />
                  </div>
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-white/10">
                        {/* Description */}
                        {project.description && (
                          <p className="text-sm text-white/50 py-3">{project.description}</p>
                        )}

                        {/* Tasks */}
                        <div className="space-y-2 mt-3">
                          {project.tasks?.map((task) => (
                            <div
                              key={task.id}
                              className={`flex items-center gap-3 p-3 rounded-xl bg-white/5 ${
                                task.completed ? 'opacity-60' : ''
                              }`}
                            >
                              <button
                                onClick={() => toggleTask(project.id, task.id)}
                                className="flex-shrink-0"
                              >
                                {task.completed ? (
                                  <CheckCircle className="w-5 h-5 text-green-400" />
                                ) : (
                                  <Circle className="w-5 h-5 text-white/30" />
                                )}
                              </button>
                              <span className={`flex-1 text-sm ${task.completed ? 'line-through text-white/50' : ''}`}>
                                {task.title}
                              </span>
                              <div className="flex items-center gap-1">
                                {!task.completed && (
                                  <button
                                    onClick={() => startTask(project, task)}
                                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                    title="Start in Focus mode"
                                  >
                                    <Target className="w-4 h-4 text-nero-400" />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteTask(project.id, task.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 text-red-400/50" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Add task form */}
                          {showAddTask === project.id ? (
                            <div className="p-3 rounded-xl bg-white/5 space-y-2">
                              <input
                                type="text"
                                value={newTask.title}
                                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                                onKeyDown={(e) => e.key === 'Enter' && addTask(project.id)}
                                placeholder="Task title..."
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none text-sm"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setShowAddTask(null)}
                                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => addTask(project.id)}
                                  disabled={!newTask.title.trim()}
                                  className="flex-1 px-3 py-2 rounded-lg bg-nero-500 hover:bg-nero-600 text-white text-sm disabled:opacity-50"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowAddTask(project.id)}
                              className="w-full p-3 rounded-xl border border-dashed border-white/20 text-white/50 hover:border-white/40 hover:text-white/70 transition-colors text-sm flex items-center justify-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Add task
                            </button>
                          )}
                        </div>

                        {/* Project actions */}
                        <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                          <button
                            onClick={() => startEdit(project)}
                            className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm flex items-center justify-center gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => deleteProject(project.id)}
                            className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm flex items-center justify-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        {/* Empty state */}
        {projects.length === 0 && (
          <div className="text-center py-12">
            <FolderKanban className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">No projects yet</p>
            <p className="text-sm text-white/30 mt-1">
              Group related tasks into projects
            </p>
            <button
              onClick={() => setShowAddProject(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
            >
              Create Project
            </button>
          </div>
        )}

        {/* Add/Edit Project Modal */}
        <AnimatePresence>
          {showAddProject && (
            <motion.div
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 }
              })}
            >
              <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={resetProjectForm}
              />

              <motion.div
                className="relative w-full max-w-md glass-card p-5"
                {...getMotionProps(prefersReducedMotion, {
                  initial: { y: 100, opacity: 0 },
                  animate: { y: 0, opacity: 1 },
                  exit: { y: 100, opacity: 0 }
                })}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-semibold">
                    {editingProject ? 'Edit Project' : 'New Project'}
                  </h3>
                  <button
                    onClick={resetProjectForm}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Name */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Project Name *</label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Website Redesign"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                  />
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Description (optional)</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What's this project about?"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 resize-none"
                    rows={2}
                  />
                </div>

                {/* Color */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Color</label>
                  <div className="flex gap-2">
                    {PROJECT_COLORS.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setNewProject(prev => ({ ...prev, color: color.id }))}
                        className={`w-10 h-10 rounded-xl ${color.bg} ${
                          newProject.color === color.id ? 'ring-2 ring-white ring-offset-2 ring-offset-surface' : ''
                        } transition-all`}
                      />
                    ))}
                  </div>
                </div>

                {/* Deadline */}
                <div className="mb-6">
                  <label className="block text-sm text-white/70 mb-2">Deadline (optional)</label>
                  <input
                    type="date"
                    value={newProject.deadline}
                    onChange={(e) => setNewProject(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/20"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={resetProjectForm}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveProject}
                    disabled={!newProject.name.trim()}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                      newProject.name.trim()
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    {editingProject ? 'Save Changes' : 'Create Project'}
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
