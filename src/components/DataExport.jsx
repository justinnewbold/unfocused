import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, FileJson, FileSpreadsheet, X, Check, AlertCircle } from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'
import { exportAll } from '../lib/persistence'

/**
 * Data export component - allows users to download their data as JSON or CSV.
 */
export default function DataExport({ isOpen, onClose }) {
  const prefersReducedMotion = useReducedMotion()
  const [exported, setExported] = useState(null) // 'json' | 'csv' | null
  const [error, setError] = useState(null)

  const handleExportJSON = () => {
    try {
      const data = exportAll()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      downloadBlob(blob, `unfocused-export-${getDateStamp()}.json`)
      setExported('json')
      setError(null)
      setTimeout(() => setExported(null), 3000)
    } catch (e) {
      setError('Failed to export data. Please try again.')
      console.error('[DataExport] JSON export failed:', e)
    }
  }

  const handleExportCSV = () => {
    try {
      const data = exportAll()
      const csvContent = convertToCSV(data)
      const blob = new Blob([csvContent], { type: 'text/csv' })
      downloadBlob(blob, `unfocused-export-${getDateStamp()}.csv`)
      setExported('csv')
      setError(null)
      setTimeout(() => setExported(null), 3000)
    } catch (e) {
      setError('Failed to export data. Please try again.')
      console.error('[DataExport] CSV export failed:', e)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        {...getMotionProps(prefersReducedMotion, {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        })}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          className="relative w-full max-w-sm glass-card p-6"
          {...getMotionProps(prefersReducedMotion, {
            initial: { y: 50, opacity: 0 },
            animate: { y: 0, opacity: 1 },
            exit: { y: 50, opacity: 0 },
          })}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-focus-500/20 flex items-center justify-center">
                <Download className="w-5 h-5 text-focus-400" />
              </div>
              <div>
                <h3 className="font-display font-semibold">Export Your Data</h3>
                <p className="text-xs text-white/50">Download everything</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-white/60 mb-5">
            Export all your tasks, insights, mood logs, and settings.
            Your data belongs to you.
          </p>

          {/* Export options */}
          <div className="space-y-3">
            <button
              onClick={handleExportJSON}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <FileJson className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">JSON Format</p>
                <p className="text-xs text-white/40">Full data, importable later</p>
              </div>
              {exported === 'json' && (
                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
              )}
            </button>

            <button
              onClick={handleExportCSV}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">CSV Format</p>
                <p className="text-xs text-white/40">Spreadsheet-friendly</p>
              </div>
              {exported === 'csv' && (
                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
              )}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* Privacy note */}
          <p className="text-center text-white/30 text-xs mt-5">
            All data is stored locally on your device.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Helpers

function getDateStamp() {
  return new Date().toISOString().split('T')[0]
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function convertToCSV(data) {
  const rows = [['Category', 'Key', 'Value', 'Date']]

  for (const [key, value] of Object.entries(data)) {
    if (key === 'neroInsights' && typeof value === 'object') {
      // Flatten insights by date
      for (const [date, dayData] of Object.entries(value)) {
        for (const [statKey, statValue] of Object.entries(dayData)) {
          rows.push([
            'Insights',
            statKey,
            Array.isArray(statValue) ? statValue.join('; ') : String(statValue),
            date,
          ])
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      rows.push([
        'Data',
        key,
        JSON.stringify(value),
        '',
      ])
    } else {
      rows.push([
        'Setting',
        key,
        String(value),
        '',
      ])
    }
  }

  return rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
}
