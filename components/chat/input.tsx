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
        <form onSubmit={onSubmit} className="flex items-center gap-2 p-4">
            <div className="flex-1 relative">
                <textarea
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={onKeyDown}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={() => setIsComposing(false)}
                    placeholder="Type your message..."
                    className="w-full resize-none rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 disabled:cursor-not-allowed disabled:opacity-50 min-h-[40px] max-h-[120px] text-neutral-900 dark:text-neutral-100"
                    rows={1}
                    disabled={isGenerating}
                />
            </div>
            <Button
                type="submit"
                size="icon"
                variant="ghost"
                disabled={isGenerating ? false : (!input.trim() || isComposing)}
                className="h-8 w-8 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800"
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