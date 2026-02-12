import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React, { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary, ViewErrorBoundary } from '../components/ErrorBoundary'

// Component that can toggle throwing
let shouldThrowGlobal = true
function ThrowingComponent() {
  if (shouldThrowGlobal) {
    throw new Error('Test error')
  }
  return <div>All good</div>
}

describe('ErrorBoundary', () => {
  const originalError = console.error
  beforeEach(() => {
    console.error = vi.fn()
    shouldThrowGlobal = true
  })
  afterEach(() => {
    console.error = originalError
  })

  it('renders children when no error occurs', () => {
    shouldThrowGlobal = false
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText('All good')).toBeInTheDocument()
  })

  it('shows error UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went sideways')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
    expect(screen.getByText('Start Fresh')).toBeInTheDocument()
  })

  it('shows technical details in expandable section', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText('Technical details')).toBeInTheDocument()
    expect(screen.getByText(/Test error/)).toBeInTheDocument()
  })

  it('recovers when Try Again is clicked and error is resolved', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went sideways')).toBeInTheDocument()

    // Fix the error before clicking retry
    shouldThrowGlobal = false
    fireEvent.click(screen.getByText('Try Again'))

    expect(screen.getByText('All good')).toBeInTheDocument()
  })
})

describe('ViewErrorBoundary', () => {
  const originalError = console.error
  beforeEach(() => {
    console.error = vi.fn()
    shouldThrowGlobal = true
  })
  afterEach(() => {
    console.error = originalError
  })

  it('renders children when no error occurs', () => {
    shouldThrowGlobal = false
    render(
      <ViewErrorBoundary viewName="Test">
        <ThrowingComponent />
      </ViewErrorBoundary>
    )
    expect(screen.getByText('All good')).toBeInTheDocument()
  })

  it('shows inline error when a child throws', () => {
    render(
      <ViewErrorBoundary viewName="Timer">
        <ThrowingComponent />
      </ViewErrorBoundary>
    )
    expect(screen.getByText('This section hit a snag')).toBeInTheDocument()
    expect(screen.getByText('Timer encountered an error')).toBeInTheDocument()
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('recovers on retry when error is resolved', () => {
    render(
      <ViewErrorBoundary viewName="Timer">
        <ThrowingComponent />
      </ViewErrorBoundary>
    )

    expect(screen.getByText('This section hit a snag')).toBeInTheDocument()

    shouldThrowGlobal = false
    fireEvent.click(screen.getByText('Retry'))

    expect(screen.getByText('All good')).toBeInTheDocument()
  })
})
