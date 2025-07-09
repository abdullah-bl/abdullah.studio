import { Metadata } from "next"


export const metadata: Metadata = {
    title: 'Chat',
    description: 'Chat with AI Locally on your browser',
}


export default function ChatLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="w-full h-full min-h-screen overflow-hidden grid place-items-center">
            {children}
        </div>
    )
}