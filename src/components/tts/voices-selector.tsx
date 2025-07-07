import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "../ui/select";
import { Mic } from "lucide-react";

import type { KokoroTTS } from "kokoro-js";
import { cn } from "@/lib/utils";

export type Voices = KokoroTTS["voices"];

interface VoiceSelectorProps {
    voices: Voices;
    selectedVoice: string;
    onVoiceChange: (voice: keyof Voices) => void;
}

export function VoiceSelector({
    voices,
    selectedVoice,
    onVoiceChange,
}: VoiceSelectorProps) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mic className="h-4 w-4" />
                <span>Voice</span>
            </div>
            <Select value={selectedVoice} onValueChange={onVoiceChange}>
                <SelectTrigger className="w-[280px] h-10 border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all rounded-xl">
                    <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2 border-gray-200 shadow-lg">
                    {Object.entries(voices).map(([key, voice]) => (
                        <SelectItem
                            key={key}
                            value={key}
                            className="rounded-lg hover:bg-blue-50 focus:bg-blue-50 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    voice.gender === "male" ? "bg-blue-500" : "bg-pink-500"
                                )} />
                                <span className="font-medium">{voice.name}</span>
                                <span className="text-gray-500 text-sm">
                                    ({voice.language === "en-us" ? "American" : "British"} {voice.gender})
                                </span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}