"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme()

    return (
        <Button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} variant="ghost" size="icon">
            {theme === "dark" ? "🌞" : "🌙"}
        </Button>
    )
}