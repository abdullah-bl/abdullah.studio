import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef } from "react";
import { memo } from "react";
import { Play, Pause, Volume2 } from "lucide-react";

export interface AudioChunkData {
    text: string;
    audio: Blob;
}

export interface AudioChunkProps extends AudioChunkData {
    active: boolean;
    playing: boolean;
    onClick: () => void;
    onStart?: () => void;
    onEnd?: () => void;
    onPause?: () => void;
}

export const AudioChunk = memo(function AudioChunk({
    text,
    audio,
    active,
    playing,
    onClick,
    onStart,
    onPause,
    onEnd,
    ...props
}: AudioChunkProps) {
    useEffect(() => {
        const audioEl = audioRef.current;
        if (!audioEl) return;

        const handlePlay = () => onStart?.();
        const handleEnded = () => onEnd?.();
        const handlePause = () => {
            if (audioRef.current?.ended) return;
            onPause?.();
        };

        audioEl.addEventListener("play", handlePlay);
        audioEl.addEventListener("pause", handlePause);
        audioEl.addEventListener("ended", handleEnded);
        return () => {
            audioEl.removeEventListener("play", handlePlay);
            audioEl.removeEventListener("pause", handlePause);
            audioEl.removeEventListener("ended", handleEnded);
        };
    }, [onStart, onPause, onEnd]);

    useEffect(() => {
        if (!audioRef.current) return;
        if (!active) return;

        if (playing) {
            if (audioRef.current?.ended) {
                audioRef.current.currentTime = 0;
            }
            audioRef.current.play();
        } else {
            audioRef.current.pause();
        }
    }, [active, playing]);

    const audioRef = useRef<HTMLAudioElement>(null);
    useEffect(() => {
        if (!audio) return;
        if (!audioRef.current) return;

        if (active) {
            audioRef.current.play();
            audioRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        } else {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, [audio, active]);

    const url = useMemo(() => URL.createObjectURL(audio), [audio]);

    return (
        <div
            hidden
            {...props}
            className={cn(
                "group relative p-4 rounded-xl transition-all duration-300 cursor-pointer border-2",
                "hover:shadow-md hover:scale-[1.02]",
                active
                    ? "bg-blue-50/80 border-blue-200 shadow-sm"
                    : "bg-white/60 border-gray-100 hover:border-blue-100",
            )}
            onClick={onClick}
        >
            {/* Status indicator */}
            {active && (
                <div className="absolute top-3 right-3">
                    <div className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        playing ? "bg-blue-500 animate-pulse" : "bg-blue-400"
                    )} />
                </div>
            )}

            {/* Text content */}
            <div className="mb-3">
                <p className={cn(
                    "text-gray-800 leading-relaxed",
                    active && "font-medium"
                )}>
                    {text}
                </p>
            </div>

            {/* Audio controls */}
            {audio && (
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Volume2 className="h-4 w-4" />
                        <span>Audio</span>
                    </div>
                    <audio
                        ref={audioRef}
                        src={url}
                        controls
                        className={cn(
                            "flex-1 h-10 rounded-lg",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        )}
                    />
                </div>
            )}

            {/* Hover overlay */}
            <div className={cn(
                "absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-indigo-500/5",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            )} />
        </div>
    );
});