import { useState } from "react";
import { Button } from "../ui/button";
import { Send, Square } from "@/lib/icons";
import { useChatStore } from "@/stores/chat";

export function ChatInput() {
    const { input, isGenerating, handleInputChange, handleSubmit, handleStop } = useChatStore();
    const [isComposing, setIsComposing] = useState(false);

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isComposing) return;
        await handleSubmit();
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isComposing) {
                handleSubmit();
            }
        }
    };

    return (
        <form onSubmit={onSubmit} className="flex items-center gap-2 p-4 bg-background sticky bottom-0">
            <div className="flex-1 relative">
                <textarea
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={onKeyDown}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={() => setIsComposing(false)}
                    placeholder="Type your message..."
                    className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[40px] max-h-[120px]"
                    rows={1}
                    disabled={isGenerating}
                />
            </div>
            <Button
                type="submit"
                size="icon"
                disabled={isGenerating ? false : (!input.trim() || isComposing)}
            // className="h-10 w-10"
            >
                {isGenerating ? (
                    <Square className="h-4 w-4" />
                ) : (
                    <Send className="h-4 w-4" />
                )}
            </Button>
        </form>
    );
}