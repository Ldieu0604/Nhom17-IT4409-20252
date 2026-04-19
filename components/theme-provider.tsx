'use client'

import * as React from 'react'

type ThemeProviderProps = {
  children: React.ReactNode
  attribute?: string
  defaultTheme?: string
  enableSystem?: boolean
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return <>{children}</>
}
