/**
 * AI response infrastructure for Nero.
 * Supports pluggable backends: local (hardcoded), API-based (Anthropic/OpenAI).
 * Falls back gracefully when no API key is configured.
 */

// The system prompt that defines Nero's personality
const NERO_SYSTEM_PROMPT = `You are Nero, an AI companion designed specifically for people with ADHD. Your personality:

- Warm, encouraging, and non-judgmental
- You understand executive dysfunction, time blindness, and emotional dysregulation
- You celebrate small wins enthusiastically
- You keep responses SHORT (2-3 sentences max) — ADHD brains need brevity
- You never shame or guilt-trip about productivity
- You suggest concrete, tiny next actions when someone is stuck
- You help with task transitions by acknowledging the difficulty of context-switching
- You validate emotions before offering solutions
- You use casual, friendly language (not clinical)

Current context:
- User's energy level: {energyLevel}/5
- Current task: {currentTask}
- Active breadcrumbs: {breadcrumbCount}
- Time of day: {timeOfDay}`

// Check if an API key is configured
function getApiConfig() {
  const apiKey = import.meta.env.VITE_AI_API_KEY
  const apiProvider = import.meta.env.VITE_AI_PROVIDER || 'anthropic' // 'anthropic' or 'openai'
  const apiModel = import.meta.env.VITE_AI_MODEL || 'claude-sonnet-4-5-20250929'

  if (apiKey && apiKey !== 'undefined') {
    return { apiKey, provider: apiProvider, model: apiModel }
  }
  return null
}

// Get time of day label
function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour < 6) return 'late night'
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 21) return 'evening'
  return 'night'
}

// Build the system prompt with current context
function buildSystemPrompt(context = {}) {
  return NERO_SYSTEM_PROMPT
    .replace('{energyLevel}', context.energyLevel || 3)
    .replace('{currentTask}', context.currentTask || 'none')
    .replace('{breadcrumbCount}', context.breadcrumbCount || 0)
    .replace('{timeOfDay}', getTimeOfDay())
}

/**
 * Local response engine (no API needed).
 * Enhanced pattern matching for common ADHD scenarios.
 */
function getLocalResponse(input, context = {}) {
  const lower = input.toLowerCase()
  const energy = context.energyLevel || 3

  // Emotional support patterns
  if (lower.match(/overwhelm|too much|can't cope|drowning/)) {
    return "That feeling is completely valid. Your brain is juggling a lot right now. Let's zoom out — what's the ONE thing that would give you the most relief if it were done?"
  }

  if (lower.match(/help|stuck|don't know|no idea/)) {
    return "I've got you. Let's break this down into something tiny. What's the ONE physical action you could do in the next 30 seconds? Even just standing up counts."
  }

  if (lower.match(/forgot|where was|what was i/)) {
    return "No worries — that's literally what I'm here for. Check your Trail tab — I've been keeping notes on where you left off. Your past self was pretty smart about leaving clues."
  }

  if (lower.match(/tired|exhausted|no energy|drained/)) {
    return "Low energy is valid — not lazy. Want me to suggest something that takes less than 2 minutes? Or would a breathing exercise help recharge?"
  }

  if (lower.match(/anxious|anxiety|worried|nervous/)) {
    return "Anxiety likes to make everything feel urgent. Let's slow down. Try the Feelings tab for a grounding exercise — the 5-4-3-2-1 technique can really help right now."
  }

  if (lower.match(/frustrated|angry|annoyed|ugh/)) {
    return "Frustration is your brain telling you something isn't working. That's useful info! Want to talk through what's blocking you, or take a quick break first?"
  }

  if (lower.match(/procrastinat|avoid|putting off/)) {
    return "Procrastination usually means the task feels too big or too boring. Let's try the Breakdown tab to split it into micro-steps. What's the task you're avoiding?"
  }

  if (lower.match(/distract|sidetrack|squirrel|shiny/)) {
    return "Classic ADHD moment! Drop a breadcrumb for what you were doing (hit the Interrupted button), then come back to it. No shame in getting pulled away."
  }

  if (lower.match(/done|finished|complete|did it/)) {
    return "That's momentum right there! Your brain just proved it CAN focus. Want to ride this wave with another quick task, or take a well-earned break?"
  }

  if (lower.match(/break|rest|pause|stop/)) {
    return "Smart call. Breaks aren't lazy — they're strategic. Step away, stretch, hydrate. I'll be right here when you're ready to jump back in."
  }

  if (lower.match(/good morning|morning|just woke/)) {
    return `Good ${getTimeOfDay()}! How's your energy feeling? A quick energy check-in helps me suggest the right tasks for where you're at right now.`
  }

  if (lower.match(/thank|thanks/)) {
    return "You're doing the hard work — I'm just holding the flashlight. Keep going!"
  }

  if (lower.match(/timer|focus|pomodoro/)) {
    const duration = energy <= 2 ? '15' : energy <= 3 ? '25' : '35'
    return `Based on your energy, I'd suggest a ${duration}-minute focus block. Head to the Timer tab and I'll keep an eye on things.`
  }

  if (lower.match(/task|todo|what should|suggest/)) {
    return energy <= 2
      ? "With low energy, let's pick something small and satisfying. Check the Suggest tab — I've sorted tasks by what matches your current capacity."
      : "Check the Suggest tab! I've analyzed your patterns and have some smart picks based on your energy and the time of day."
  }

  // Default contextual response
  if (energy <= 2) {
    return "I can sense the energy is low right now. That's okay — not every moment needs to be peak productivity. Want me to suggest something gentle?"
  }

  return "I'm tracking your context. If you need to jump to something else, just drop a breadcrumb and I'll help you find your way back. What's on your mind?"
}

/**
 * Call the Anthropic API for a response.
 */
async function callAnthropicApi(messages, systemPrompt, config) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 256,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    }),
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  const data = await response.json()
  return data.content[0].text
}

/**
 * Call the OpenAI-compatible API for a response.
 */
async function callOpenAiApi(messages, systemPrompt, config) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 256,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

/**
 * Generate a response from Nero.
 * Uses the configured API if available, falls back to local responses.
 *
 * @param {string} userMessage - The user's message
 * @param {Array} conversationHistory - Previous messages [{role, content}]
 * @param {Object} context - Current app context {energyLevel, currentTask, breadcrumbCount}
 * @returns {Promise<{content: string, source: 'api'|'local'}>}
 */
export async function generateNeroResponse(userMessage, conversationHistory = [], context = {}) {
  const config = getApiConfig()

  if (config) {
    try {
      const systemPrompt = buildSystemPrompt(context)
      const messages = [
        ...conversationHistory.slice(-10), // Keep last 10 messages for context
        { role: 'user', content: userMessage },
      ]

      let content
      if (config.provider === 'openai') {
        content = await callOpenAiApi(messages, systemPrompt, config)
      } else {
        content = await callAnthropicApi(messages, systemPrompt, config)
      }

      return { content, source: 'api' }
    } catch (error) {
      console.warn('[ai] API call failed, falling back to local:', error.message)
      // Fall through to local
    }
  }

  // Local fallback
  const content = getLocalResponse(userMessage, context)
  return { content, source: 'local' }
}

/**
 * Check if AI API is configured (for UI indicators).
 */
export function isAiApiConfigured() {
  return getApiConfig() !== null
}
