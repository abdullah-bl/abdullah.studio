import { Button } from "../ui/button";
import { X, Settings } from "@/lib/icons";
import { useState } from "react";
import { ChatSettings } from "./settings";

interface HeaderProps {
    onClear: () => void;
}

export function ChatHeader({ onClear }: HeaderProps) {
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <>
            <div className="absolute top-4 left-4 flex gap-2">
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
            <ChatSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
        </>
    );
} 