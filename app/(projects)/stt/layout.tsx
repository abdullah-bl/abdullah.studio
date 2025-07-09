import { Metadata } from "next"


export const metadata: Metadata = {
    title: 'Speech to Text',
    description: 'Speech to Text is a web app that converts your speech to text in real-time.',
}


export default function ChatLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-10">
            {children}
        </div>
    )
}