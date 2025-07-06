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
            <ScrollArea className="flex-1">
                <div className="space-y-6 py-4">
                    {messages.filter(message => message.role !== "system").map((message, index) => (
                        <ChatMessageComponent key={index} message={message} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {usage && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground my-2 px-1">
                    <Info className="h-3 w-3" />
                    <span>{usage.total_tokens} tokens used</span>
                </div>
            )}
        </>
    );
} 