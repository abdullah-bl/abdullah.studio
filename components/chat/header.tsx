import { Button } from "../ui/button";
import { X, Settings } from "@/lib/icons";
import { useState } from "react";
import { ChatSettings } from "./settings";
import { useChatStore } from "@/stores/chat";
import { llm_system_characters } from "@/lib/characters";

interface HeaderProps {
    onClear: () => void;
}

export function ChatHeader({ onClear }: HeaderProps) {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const { selectedCharacter, customCharacters } = useChatStore();

    const getCurrentCharacter = () => {
        if (!selectedCharacter) return { icon: "👤", name: "Custom" };

        // Check if it's a custom character
        const customChar = customCharacters.find(c => c.id === selectedCharacter);
        if (customChar) return customChar;

        // Check if it's a predefined character
        const predefinedChar = llm_system_characters.find(c => c.name === selectedCharacter);
        if (predefinedChar) return predefinedChar;

        return { icon: "👤", name: "Custom" };
    };

    return (
        <>
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                    <a href="/" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                        ← Back
                    </a>
                    <span className="text-neutral-600 dark:text-neutral-400">
                        AI Chat
                    </span>

                </div>
                <div className="flex items-center gap-2">
                    {selectedCharacter && (
                        <span className="text-xs px-2 space-x-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                            {/* show icon and name */}
                            <span className="text-lg">{getCurrentCharacter().icon}</span>
                            <span className="text-sm">{getCurrentCharacter().name}</span>
                        </span>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClear}
                        className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                        Clear
                    </Button>

                    <ChatSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
                </div>
            </div>
        </>
    );
} 