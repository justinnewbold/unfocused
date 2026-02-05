import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Watch,
  Activity,
  Heart,
  Moon,
  Footprints,
  Flame,
  Battery,
  Bluetooth,
  BluetoothOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Settings,
  Zap,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const WEARABLE_KEY = 'nero_wearable_settings'
const HEALTH_DATA_KEY = 'nero_health_data'

// Supported devices
const SUPPORTED_DEVICES = [
  { id: 'apple_watch', name: 'Apple Watch', icon: Watch, color: 'gray' },
  { id: 'fitbit', name: 'Fitbit', icon: Watch, color: 'cyan' },
  { id: 'garmin', name: 'Garmin', icon: Watch, color: 'blue' },
  { id: 'samsung', name: 'Samsung Galaxy Watch', icon: Watch, color: 'purple' },
  { id: 'oura', name: 'Oura Ring', icon: Activity, color: 'white' },
  { id: 'whoop', name: 'WHOOP', icon: Activity, color: 'green' },
]

// Metrics we track
const HEALTH_METRICS = [
  { id: 'heart_rate', name: 'Heart Rate', icon: Heart, unit: 'bpm', color: 'red' },
  { id: 'hrv', name: 'Heart Rate Variability', icon: Activity, unit: 'ms', color: 'purple' },
  { id: 'steps', name: 'Steps', icon: Footprints, unit: 'steps', color: 'green' },
  { id: 'calories', name: 'Calories Burned', icon: Flame, unit: 'kcal', color: 'orange' },
  { id: 'sleep_score', name: 'Sleep Score', icon: Moon, unit: '%', color: 'indigo' },
  { id: 'stress', name: 'Stress Level', icon: Zap, unit: '', color: 'yellow' },
]

// Load settings
const loadSettings = () => {
  try {
    const stored = localStorage.getItem(WEARABLE_KEY)
    return stored ? JSON.parse(stored) : {
      connectedDevice: null,
      autoSync: true,
      syncInterval: 15,
      stressAlerts: true,
      stressThreshold: 70,
      useForEnergy: true,
      showOnDashboard: true,
    }
  } catch {
    return {}
  }
}

// Save settings
const saveSettings = (settings) => {
  localStorage.setItem(WEARABLE_KEY, JSON.stringify(settings))
}

// Load health data (simulated)
const loadHealthData = () => {
  try {
    const stored = localStorage.getItem(HEALTH_DATA_KEY)
    if (stored) return JSON.parse(stored)

    // Generate demo data
    return {
      heart_rate: { current: 72, trend: 'stable', history: generateHistory(60, 80) },
      hrv: { current: 45, trend: 'up', history: generateHistory(30, 60) },
      steps: { current: 4523, trend: 'up', history: generateHistory(2000, 8000) },
      calories: { current: 1234, trend: 'stable', history: generateHistory(800, 2000) },
      sleep_score: { current: 82, trend: 'down', history: generateHistory(60, 95) },
      stress: { current: 35, trend: 'stable', history: generateHistory(20, 80) },
      lastSync: new Date().toISOString(),
    }
  } catch {
    return {}
  }
}

// Generate demo history
const generateHistory = (min, max) => {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * (max - min) + min))
}

// Save health data
const saveHealthData = (data) => {
  localStorage.setItem(HEALTH_DATA_KEY, JSON.stringify(data))
}

export default function WearableSync({ onEnergyUpdate, onStressAlert }) {
  const prefersReducedMotion = useReducedMotion()
  const [settings, setSettings] = useState(loadSettings())
  const [healthData, setHealthData] = useState({})
  const [isConnecting, setIsConnecting] = useState(false)
  const [showDevices, setShowDevices] = useState(false)
  const [viewMode, setViewMode] = useState('metrics') // 'metrics' | 'settings'

  // Load data on mount
  useEffect(() => {
    setSettings(loadSettings())
    setHealthData(loadHealthData())
  }, [])

  // Calculate energy suggestion from wearable data
  useEffect(() => {
    if (!settings.useForEnergy || !healthData.hrv) return

    const hrv = healthData.hrv.current
    const stress = healthData.stress?.current || 50
    const sleepScore = healthData.sleep_score?.current || 70

    // Simple energy calculation based on HRV, stress, and sleep
    let suggestedEnergy = 2 // medium default

    if (hrv > 50 && stress < 40 && sleepScore > 80) {
      suggestedEnergy = 3 // high
    } else if (hrv < 30 || stress > 70 || sleepScore < 60) {
      suggestedEnergy = 1 // low
    }

    onEnergyUpdate?.(suggestedEnergy)
  }, [healthData, settings.useForEnergy])

  // Stress alerts
  useEffect(() => {
    if (!settings.stressAlerts || !healthData.stress) return

    if (healthData.stress.current > settings.stressThreshold) {
      onStressAlert?.({
        level: healthData.stress.current,
        message: 'Your stress level is elevated. Consider taking a break.',
      })
    }
  }, [healthData.stress, settings])

  // Update settings
  const updateSettings = (key, value) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    saveSettings(updated)
  }

  // Connect device (simulated)
  const connectDevice = async (deviceId) => {
    setIsConnecting(true)

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    updateSettings('connectedDevice', deviceId)
    setIsConnecting(false)
    setShowDevices(false)

    // Load fresh data
    const newData = loadHealthData()
    setHealthData(newData)
    saveHealthData(newData)
  }

  // Disconnect device
  const disconnectDevice = () => {
    updateSettings('connectedDevice', null)
    setHealthData({})
  }

  // Manual sync (simulated)
  const syncData = async () => {
    setIsConnecting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))

    const newData = loadHealthData()
    newData.lastSync = new Date().toISOString()
    setHealthData(newData)
    saveHealthData(newData)
    setIsConnecting(false)
  }

  // Get connected device
  const connectedDevice = SUPPORTED_DEVICES.find(d => d.id === settings.connectedDevice)

  // Get trend icon
  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3 text-green-400" />
    if (trend === 'down') return <TrendingDown className="w-3 h-3 text-red-400" />
    return null
  }

  // Format last sync time
  const formatLastSync = () => {
    if (!healthData.lastSync) return 'Never'
    const diff = (Date.now() - new Date(healthData.lastSync).getTime()) / 1000 / 60
    if (diff < 1) return 'Just now'
    if (diff < 60) return `${Math.floor(diff)}m ago`
    return `${Math.floor(diff / 60)}h ago`
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
            <h2 className="font-display text-xl font-semibold">Wearable Sync</h2>
            <p className="text-sm text-white/50">Connect your fitness tracker</p>
          </div>
          {connectedDevice && (
            <button
              onClick={syncData}
              disabled={isConnecting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
              Sync
            </button>
          )}
        </div>

        {/* Connection Status */}
        <div className="glass-card p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {connectedDevice ? (
                <>
                  <div className={`w-12 h-12 rounded-xl bg-${connectedDevice.color}-500/20 flex items-center justify-center`}>
                    <connectedDevice.icon className={`w-6 h-6 text-${connectedDevice.color}-400`} />
                  </div>
                  <div>
                    <p className="font-medium">{connectedDevice.name}</p>
                    <div className="flex items-center gap-2 text-xs text-green-400">
                      <Bluetooth className="w-3 h-3" />
                      Connected • Synced {formatLastSync()}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <BluetoothOff className="w-6 h-6 text-white/30" />
                  </div>
                  <div>
                    <p className="font-medium">No Device Connected</p>
                    <p className="text-xs text-white/50">Connect a wearable to get started</p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => connectedDevice ? disconnectDevice() : setShowDevices(true)}
              className={`px-4 py-2 rounded-xl text-sm transition-colors ${
                connectedDevice
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-cyan-500 text-white hover:bg-cyan-600'
              }`}
            >
              {connectedDevice ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        </div>

        {/* View Tabs */}
        {connectedDevice && (
          <div className="flex gap-2 mb-4">
            {[
              { id: 'metrics', label: 'Metrics', icon: Activity },
              { id: 'settings', label: 'Settings', icon: Settings },
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
        )}

        {/* Metrics View */}
        {connectedDevice && viewMode === 'metrics' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {HEALTH_METRICS.map((metric) => {
                const data = healthData[metric.id]
                if (!data) return null

                return (
                  <motion.div
                    key={metric.id}
                    {...getMotionProps(prefersReducedMotion, {
                      initial: { opacity: 0, scale: 0.95 },
                      animate: { opacity: 1, scale: 1 }
                    })}
                    className="glass-card p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <metric.icon className={`w-4 h-4 text-${metric.color}-400`} />
                      <span className="text-xs text-white/50">{metric.name}</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-bold">{data.current}</span>
                      <span className="text-sm text-white/50 mb-1">{metric.unit}</span>
                      {getTrendIcon(data.trend)}
                    </div>

                    {/* Mini sparkline */}
                    {data.history && (
                      <div className="flex items-end gap-0.5 mt-2 h-8">
                        {data.history.slice(-12).map((val, i) => {
                          const max = Math.max(...data.history)
                          const height = (val / max) * 100
                          return (
                            <div
                              key={i}
                              className={`flex-1 rounded-t bg-${metric.color}-500/50`}
                              style={{ height: `${height}%` }}
                            />
                          )
                        })}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Energy Suggestion */}
            {settings.useForEnergy && (
              <div className="glass-card p-4 border border-cyan-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium">Energy Suggestion</span>
                </div>
                <p className="text-sm text-white/70">
                  Based on your HRV ({healthData.hrv?.current}ms), stress level ({healthData.stress?.current}%),
                  and sleep score ({healthData.sleep_score?.current}%), we suggest{' '}
                  <span className="text-cyan-400 font-medium">
                    {healthData.hrv?.current > 50 ? 'high' : healthData.hrv?.current > 35 ? 'medium' : 'low'} energy tasks
                  </span>{' '}
                  today.
                </p>
              </div>
            )}

            {/* Stress Alert */}
            {healthData.stress?.current > settings.stressThreshold && (
              <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-400">Elevated Stress Detected</span>
                </div>
                <p className="text-sm text-white/70">
                  Your stress level is at {healthData.stress.current}%. Consider taking a short break,
                  doing some breathing exercises, or going for a walk.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Settings View */}
        {connectedDevice && viewMode === 'settings' && (
          <div className="space-y-3">
            {/* Auto Sync */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium">Auto Sync</p>
                  <p className="text-xs text-white/50">Automatically sync data in background</p>
                </div>
                <button
                  onClick={() => updateSettings('autoSync', !settings.autoSync)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.autoSync ? 'bg-cyan-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.autoSync ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {settings.autoSync && (
                <div>
                  <p className="text-sm text-white/70 mb-2">Sync every {settings.syncInterval} minutes</p>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={settings.syncInterval}
                    onChange={(e) => updateSettings('syncInterval', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Stress Alerts */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium">Stress Alerts</p>
                  <p className="text-xs text-white/50">Get notified when stress is high</p>
                </div>
                <button
                  onClick={() => updateSettings('stressAlerts', !settings.stressAlerts)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.stressAlerts ? 'bg-cyan-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.stressAlerts ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {settings.stressAlerts && (
                <div>
                  <p className="text-sm text-white/70 mb-2">Alert when stress exceeds {settings.stressThreshold}%</p>
                  <input
                    type="range"
                    min="50"
                    max="90"
                    step="5"
                    value={settings.stressThreshold}
                    onChange={(e) => updateSettings('stressThreshold', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Use for Energy */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Use for Energy Suggestions</p>
                  <p className="text-xs text-white/50">Suggest energy level based on health data</p>
                </div>
                <button
                  onClick={() => updateSettings('useForEnergy', !settings.useForEnergy)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.useForEnergy ? 'bg-cyan-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.useForEnergy ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>

            {/* Show on Dashboard */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show on Dashboard</p>
                  <p className="text-xs text-white/50">Display health metrics on main screen</p>
                </div>
                <button
                  onClick={() => updateSettings('showOnDashboard', !settings.showOnDashboard)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.showOnDashboard ? 'bg-cyan-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.showOnDashboard ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Device Connected */}
        {!connectedDevice && (
          <div className="text-center py-8">
            <Watch className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 mb-2">Connect a wearable device</p>
            <p className="text-sm text-white/30">
              Track heart rate, stress, and more to get personalized energy recommendations
            </p>
          </div>
        )}

        {/* Device Selection Modal */}
        <AnimatePresence>
          {showDevices && (
            <motion.div
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 }
              })}
            >
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowDevices(false)} />

              <motion.div
                className="relative w-full max-w-md glass-card p-5"
                {...getMotionProps(prefersReducedMotion, {
                  initial: { y: 100, opacity: 0 },
                  animate: { y: 0, opacity: 1 },
                  exit: { y: 100, opacity: 0 }
                })}
              >
                <h3 className="font-display text-lg font-semibold mb-4">Connect Device</h3>

                <div className="space-y-2">
                  {SUPPORTED_DEVICES.map((device) => (
                    <button
                      key={device.id}
                      onClick={() => connectDevice(device.id)}
                      disabled={isConnecting}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                      <div className={`w-10 h-10 rounded-lg bg-${device.color}-500/20 flex items-center justify-center`}>
                        <device.icon className={`w-5 h-5 text-${device.color}-400`} />
                      </div>
                      <span className="font-medium">{device.name}</span>
                      {isConnecting && (
                        <RefreshCw className="w-4 h-4 ml-auto animate-spin text-white/50" />
                      )}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowDevices(false)}
                  className="w-full mt-4 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
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
