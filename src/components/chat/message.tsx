import Markdown from "react-markdown";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "./types";

interface MessageProps {
    message: ChatMessage;
}

export function ChatMessage({ message }: MessageProps) {
    return (
        <div
            className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
            )}
        >
            <div
                className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3",
                    message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                )}
            >
                <div className="prose dark:prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-pre:p-0">
                    <Markdown
                        components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            pre: ({ children }) => (
                                <pre className="bg-muted/50 p-3 rounded-lg overflow-x-auto my-2 text-sm">
                                    {children}
                                </pre>
                            ),
                            code: ({ children }) => (
                                <code className="bg-muted/50 px-1.5 py-0.5 rounded text-sm">
                                    {children}
                                </code>
                            ),
                            ul: ({ children }) => <ul className="list-disc pl-4 my-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-4 my-2">{children}</ol>,
                            li: ({ children }) => <li className="my-1">{children}</li>,
                            h1: ({ children }) => <h1 className="text-xl font-bold my-3">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-lg font-bold my-2">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-base font-bold my-2">{children}</h3>,
                            blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-muted-foreground/20 pl-4 my-2 italic">
                                    {children}
                                </blockquote>
                            ),
                        }}
                    >
                        {message.content}
                    </Markdown>
                </div>
            </div>
        </div>
    );
} 