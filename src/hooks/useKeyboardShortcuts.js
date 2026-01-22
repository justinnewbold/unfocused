import { useEffect, useCallback, useState } from 'react'

/**
 * Custom hook for managing keyboard shortcuts
 * ADHD-friendly: Consistent, discoverable shortcuts that reduce cognitive load
 */
export function useKeyboardShortcuts(shortcuts, enabled = true) {
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return

    // Don't trigger shortcuts when typing in input/textarea
    const target = event.target
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return
    }

    const key = event.key.toLowerCase()
    const modifiers = {
      ctrl: event.ctrlKey || event.metaKey,
      shift: event.shiftKey,
      alt: event.altKey
    }

    for (const shortcut of shortcuts) {
      const requiredKey = shortcut.key.toLowerCase()
      const requiredMods = shortcut.modifiers || {}

      const keyMatch = key === requiredKey
      const modsMatch =
        (requiredMods.ctrl || false) === modifiers.ctrl &&
        (requiredMods.shift || false) === modifiers.shift &&
        (requiredMods.alt || false) === modifiers.alt

      if (keyMatch && modsMatch) {
        event.preventDefault()
        shortcut.action()
        return
      }
    }
  }, [shortcuts, enabled])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

/**
 * Hook to toggle help overlay with ?
 */
export function useShortcutsHelp() {
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
        const target = event.target
        if (
          target.tagName !== 'INPUT' &&
          target.tagName !== 'TEXTAREA' &&
          !target.isContentEditable
        ) {
          event.preventDefault()
          setShowHelp(prev => !prev)
        }
      }
      // Also close with Escape
      if (event.key === 'Escape' && showHelp) {
        setShowHelp(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showHelp])

  return { showHelp, setShowHelp }
}

export default useKeyboardShortcuts
