import { Loader2 } from "@/lib/icons";
import type { Progress } from "./types";

interface LoadingProps {
    progress: Progress;
}

export function ChatLoading({ progress }: LoadingProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full bg-primary/20" />
                <div className="relative w-full h-full rounded-full bg-primary flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-primary-foreground animate-spin" />
                </div>
            </div>
            <div className="text-center space-y-2">
                <p className="font-medium">Loading model...</p>
                <p className="text-sm text-muted-foreground">{progress.text}</p>
                <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${Math.round(progress.progress * 100)}%` }}
                    />
                </div>
            </div>
        </div>
    );
} 