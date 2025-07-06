import { Button } from "../ui/button";
import { X, Settings, Sparkles } from "@/lib/icons";
import { useState } from "react";
import { ChatSettings } from "./settings";

interface HeaderProps {
    onClear: () => void;
}

export function ChatHeader({ onClear }: HeaderProps) {
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <>
            <div className="flex items-center justify-between gap-2 p-2 bg-background/50 sticky top-0">
                <div className="flex items-center gap-2">
                    <a href="/" className="flex items-center gap-2">
                        &larr;
                    </a>
                    <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClear}
                        className="h-8 w-8 hover:bg-muted"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSettingsOpen(true)}
                        className="h-8 w-8 hover:bg-muted"
                    >
                        <Settings className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <ChatSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
        </>
    );
} 