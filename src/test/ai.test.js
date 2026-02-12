import { describe, it, expect } from 'vitest'
import { generateNeroResponse, isAiApiConfigured } from '../lib/ai'

describe('AI Response Infrastructure', () => {
  describe('isAiApiConfigured', () => {
    it('returns false when no API key is set', () => {
      expect(isAiApiConfigured()).toBe(false)
    })
  })

  describe('generateNeroResponse (local fallback)', () => {
    it('returns a response for help-seeking messages', async () => {
      const result = await generateNeroResponse('I need help', [], { energyLevel: 3 })
      expect(result.content).toBeTruthy()
      expect(result.source).toBe('local')
      expect(result.content).toContain('break this down')
    })

    it('responds to overwhelm keywords', async () => {
      const result = await generateNeroResponse('I feel overwhelmed', [], { energyLevel: 3 })
      expect(result.content).toContain('valid')
      expect(result.source).toBe('local')
    })

    it('responds to forgetfulness keywords', async () => {
      const result = await generateNeroResponse('I forgot where I was', [], { energyLevel: 3 })
      expect(result.content).toContain('Trail')
    })

    it('adjusts response for low energy', async () => {
      const result = await generateNeroResponse('what should I do', [], { energyLevel: 1 })
      expect(result.content).toBeTruthy()
      expect(result.source).toBe('local')
    })

    it('responds to anxiety keywords', async () => {
      const result = await generateNeroResponse('I feel anxious', [], { energyLevel: 3 })
      expect(result.content).toContain('grounding')
    })

    it('responds to break requests', async () => {
      const result = await generateNeroResponse('I need a break', [], { energyLevel: 3 })
      expect(result.content).toContain('Break')
    })

    it('responds to task completion', async () => {
      const result = await generateNeroResponse('I just finished it!', [], { energyLevel: 4 })
      expect(result.content).toContain('momentum')
    })

    it('gives a default response for unmatched input', async () => {
      const result = await generateNeroResponse('random unrelated text xyz', [], { energyLevel: 4 })
      expect(result.content).toBeTruthy()
      expect(result.source).toBe('local')
    })
  })
})
