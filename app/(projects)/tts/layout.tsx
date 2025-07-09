import { Metadata } from "next"


export const metadata: Metadata = {
    title: 'Text to Speech',
    description: 'Text to Speech is a web app that converts text to speech using various voices.',
}


export default function ChatLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-10">
            {children}
        </div>
    )
}