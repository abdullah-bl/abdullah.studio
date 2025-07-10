import type { Metadata } from 'next'
import { Rubik } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { Navbar } from '@/components/nav'
import Footer from '@/components/footer'

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
            <body className={`${rubik.className} bg-background text-foreground p-2`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <main className="min-h-screen w-full max-w-2xl mx-auto">
                        <Navbar />
                        {children}
                        <Footer />
                    </main>
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    )
} 