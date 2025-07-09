import { Loader2 } from "@/lib/icons";
import type { Progress } from "./types";

interface LoadingProps {
    progress: Progress;
}

export function ChatLoading({ progress }: LoadingProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-center space-y-4">
                <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-neutral-600 dark:text-neutral-400 animate-spin" />
                </div>
                <div className="space-y-2">
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">Loading model...</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{progress.text}</p>
                    <div className="w-32 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-neutral-600 dark:bg-neutral-400 transition-all duration-300"
                            style={{ width: `${Math.round(progress.progress * 100)}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
} 