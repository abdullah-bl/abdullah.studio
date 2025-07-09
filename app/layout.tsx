import type { Metadata } from 'next'
import { Rubik } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'

const rubik = Rubik({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Abdullah Bl',
    description: 'Abdullah Bl\'s portfolio and projects',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning    >
            <head />
            <body className={`${rubik.className} bg-background text-foreground `}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <main className="min-h-screen w-full max-w-2xl mx-auto">
                        {children}
                    </main>
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    )
} 