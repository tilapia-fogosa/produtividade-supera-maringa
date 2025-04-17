
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(document.documentElement.classList.contains('dark'))

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark')
      setIsDark(false)
    } else {
      document.documentElement.classList.add('dark')
      setIsDark(true)
    }
  }

  return (
    <Button
      onClick={toggleTheme}
      variant="outline"
      size="icon"
      className="fixed bottom-4 right-4 rounded-full bg-background/80 backdrop-blur-sm border-orange-200 hover:bg-orange-100 dark:border-orange-800 dark:hover:bg-orange-950 transition-all duration-200 z-50"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-orange-600 dark:text-orange-400" />
      ) : (
        <Moon className="h-5 w-5 text-orange-600" />
      )}
      <span className="sr-only">Alternar tema</span>
    </Button>
  )
}
