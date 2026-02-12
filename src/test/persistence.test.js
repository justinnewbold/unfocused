import { describe, it, expect, beforeEach, vi } from 'vitest'
import { read, write, remove, update, exportAll, flushAll, clearCache } from '../lib/persistence'

describe('Persistence Layer', () => {
  beforeEach(() => {
    localStorage.clear()
    clearCache()
    flushAll()
  })

  describe('read', () => {
    it('returns default value when key does not exist', () => {
      expect(read('nonexistent', 'default')).toBe('default')
    })

    it('returns null as default when no default provided', () => {
      expect(read('nonexistent')).toBeNull()
    })

    it('reads values written to localStorage', () => {
      localStorage.setItem('test-key', JSON.stringify({ foo: 'bar' }))
      expect(read('test-key')).toEqual({ foo: 'bar' })
    })

    it('handles corrupted JSON gracefully', () => {
      localStorage.setItem('corrupt', 'not valid json{{{')
      expect(read('corrupt', 'fallback')).toBe('fallback')
      // Should have removed the corrupted entry
      expect(localStorage.getItem('corrupt')).toBeNull()
    })
  })

  describe('write', () => {
    it('writes values that can be read back immediately from cache', () => {
      write('key1', { hello: 'world' })
      // Cache is updated immediately even before debounce fires
      expect(read('key1')).toEqual({ hello: 'world' })
    })

    it('writes to localStorage when immediate flag is set', () => {
      write('key2', [1, 2, 3], { immediate: true })
      expect(JSON.parse(localStorage.getItem('key2'))).toEqual([1, 2, 3])
    })

    it('debounces localStorage writes', async () => {
      write('debounce-test', 'first', { debounceMs: 50 })
      write('debounce-test', 'second', { debounceMs: 50 })
      write('debounce-test', 'third', { debounceMs: 50 })

      // localStorage shouldn't have been written yet
      expect(localStorage.getItem('debounce-test')).toBeNull()

      // Cache should have the latest value
      expect(read('debounce-test')).toBe('third')

      // Wait for debounce to fire
      await new Promise((r) => setTimeout(r, 100))
      expect(JSON.parse(localStorage.getItem('debounce-test'))).toBe('third')
    })
  })

  describe('remove', () => {
    it('removes values from cache and localStorage', () => {
      write('to-remove', 'data', { immediate: true })
      expect(read('to-remove')).toBe('data')

      remove('to-remove')
      expect(read('to-remove')).toBeNull()
      expect(localStorage.getItem('to-remove')).toBeNull()
    })
  })

  describe('update', () => {
    it('applies transform function to existing value', () => {
      write('counter', 5, { immediate: true })
      const result = update('counter', (val) => val + 1)
      expect(result).toBe(6)
      expect(read('counter')).toBe(6)
    })

    it('uses default value when key does not exist', () => {
      const result = update('new-counter', (val) => val + 1, 0)
      expect(result).toBe(1)
    })

    it('works with objects', () => {
      write('obj', { items: [] }, { immediate: true })
      update('obj', (val) => ({ ...val, items: [...val.items, 'new'] }))
      expect(read('obj')).toEqual({ items: ['new'] })
    })
  })

  describe('exportAll', () => {
    it('exports all localStorage data', () => {
      write('a', 1, { immediate: true })
      write('b', 'hello', { immediate: true })
      write('c', [1, 2], { immediate: true })

      const exported = exportAll()
      expect(exported.a).toBe(1)
      expect(exported.b).toBe('hello')
      expect(exported.c).toEqual([1, 2])
    })
  })

  describe('flushAll', () => {
    it('flushes pending debounced writes', () => {
      write('pending1', 'value1', { debounceMs: 10000 })
      write('pending2', 'value2', { debounceMs: 10000 })

      // Not in localStorage yet (debounce hasn't fired)
      expect(localStorage.getItem('pending1')).toBeNull()

      flushAll()

      // Now they should be in localStorage
      expect(JSON.parse(localStorage.getItem('pending1'))).toBe('value1')
      expect(JSON.parse(localStorage.getItem('pending2'))).toBe('value2')
    })
  })
})
