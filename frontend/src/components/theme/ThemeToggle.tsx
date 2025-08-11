'use client'
import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

type ThemeMode = 'system' | 'light' | 'dark'

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.theme as ThemeMode) || 'system'
    }
    return 'system'
  })

  useEffect(() => {
    const html = document.documentElement
    
    // Apply theme based on mode
    if (mode === 'system') {
      // Remove manual theme classes, let CSS media query handle it
      html.removeAttribute('data-theme')
      html.classList.remove('theme-light', 'theme-dark', 'dark')
    } else {
      // Set manual theme
      html.setAttribute('data-theme', mode)
      html.classList.remove('theme-light', 'theme-dark', 'dark')
    }
    
    // Save to localStorage
    localStorage.theme = mode
    
    // Listen for system theme changes when in system mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (mode === 'system') {
        // Force re-evaluation by briefly removing and re-adding system mode
        html.setAttribute('data-theme', mediaQuery.matches ? 'dark' : 'light')
        setTimeout(() => {
          if (localStorage.theme === 'system') {
            html.removeAttribute('data-theme')
          }
        }, 0)
      }
    }
    
    if (mode === 'system') {
      mediaQuery.addEventListener('change', handleChange)
    }
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [mode])

  const cycleMode = () => {
    const modes: ThemeMode[] = ['system', 'light', 'dark']
    const currentIndex = modes.indexOf(mode)
    const nextIndex = (currentIndex + 1) % modes.length
    setMode(modes[nextIndex])
  }

  const getIcon = () => {
    switch (mode) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      case 'system':
        return <Monitor className="h-4 w-4" />
    }
  }

  const getLabel = () => {
    switch (mode) {
      case 'light':
        return 'Light'
      case 'dark':
        return 'Dark'
      case 'system':
        return 'System'
    }
  }

  return (
    <button
      aria-label={`Current theme: ${mode}. Click to cycle themes`}
      onClick={cycleMode}
      className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--muted)] hover:text-[color:var(--fg)] transition-colors duration-[var(--dur)] ease-[var(--ease)] hover-scale focus-ring"
    >
      <div className="flex items-center space-x-2">
        {getIcon()}
        <span className="hidden sm:inline">{getLabel()}</span>
      </div>
    </button>
  )
}
