'use client'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

type ThemeMode = 'light' | 'dark'

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.theme
      if (saved === 'light' || saved === 'dark') return saved
      // Default to system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  })

  useEffect(() => {
    const html = document.documentElement
    html.setAttribute('data-theme', mode)
    localStorage.theme = mode
  }, [mode])

  const toggleMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light')
  }

  return (
    <button
      aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} theme`}
      onClick={toggleMode}
      className="rounded-full border border-border bg-surface px-3 py-2 text-sm text-muted hover:text-foreground transition-colors duration-[var(--dur)] focus-ring"
    >
      <div className="flex items-center space-x-2">
        {mode === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        <span className="hidden sm:inline">{mode === 'light' ? 'Dark' : 'Light'}</span>
      </div>
    </button>
  )
}
