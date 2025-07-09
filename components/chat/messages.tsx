import { useEffect, useRef, useCallback } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { ChatMessage as ChatMessageComponent } from "./message";
import { Info } from "@/lib/icons";
import type { ChatMessage, Usage } from "./types";

interface MessagesProps {
    messages: ChatMessage[];
    usage: Usage | null;
}

export function ChatMessages({ messages, usage }: MessagesProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    return (
        <>
            <ScrollArea className="flex-1 overflow-y-auto min-h-0 max-h-full">
                <div className="space-y-4 p-4">
                    {messages.filter(message => message.role !== "system").map((message, index) => (
                        <ChatMessageComponent key={index} message={message} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {usage && (
                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">
                    <Info className="h-3 w-3" />
                    <span>{usage.total_tokens} tokens used</span>
                </div>
            )}
        </>
    );
} 