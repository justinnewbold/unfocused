import '@testing-library/jest-dom'

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (index) => Object.keys(store)[index] ?? null,
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock matchMedia for useReducedMotion
Object.defineProperty(window, 'matchMedia', {
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock AudioContext for AmbientSounds
window.AudioContext = class AudioContext {
  constructor() {
    this.state = 'running'
    this.sampleRate = 44100
    this.currentTime = 0
  }
  createGain() {
    return {
      gain: { value: 1, setValueAtTime: () => {}, linearRampToValueAtTime: () => {} },
      connect: () => {},
      disconnect: () => {},
    }
  }
  createBiquadFilter() {
    return {
      type: 'lowpass',
      frequency: { value: 1000 },
      connect: () => {},
      disconnect: () => {},
    }
  }
  createBuffer(channels, length, sampleRate) {
    return {
      getChannelData: () => new Float32Array(length),
    }
  }
  createBufferSource() {
    return {
      buffer: null,
      loop: false,
      connect: () => {},
      disconnect: () => {},
      start: () => {},
      stop: () => {},
    }
  }
  resume() { return Promise.resolve() }
  close() { return Promise.resolve() }
}
