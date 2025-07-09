"use client";

import { useState, useEffect, useRef } from "react";
import {
    Download,
    Pause,
    Play,
    Copy,
    Check,
    Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast, Toaster } from "sonner";

import { VoiceSelector } from "./voices-selector";
import type { Voices } from "./voices-selector";
import { AudioChunk } from "./audio-chunk";
import type { AudioChunkData } from "./audio-chunk";

export default function AudioReader() {
    const [text, setText] = useState(
        "Kokoro is a lightweight TTS model that runs in your browser. It generates natural speech from text with 82 million parameters.",
    );
    const [lastGeneration, setLastGeneration] = useState<{
        text: string;
        speed: number;
        voice: keyof Voices;
    } | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentChunkIndex, setCurrentChunkIndex] = useState(-1);
    const [speed, setSpeed] = useState(1);
    const [copied, setCopied] = useState(false);

    const [status, setStatus] = useState<
        "loading" | "ready" | "generating" | "error"
    >("loading");
    const [error, setError] = useState<string | null>(null);

    const worker = useRef<Worker | null>(null);
    const [voices, setVoices] = useState<Voices | null>(null);
    const [selectedVoice, setSelectedVoice] = useState<keyof Voices>("af_heart");
    const [chunks, setChunks] = useState<AudioChunkData[]>([]);
    const [result, setResult] = useState<Blob | null>(null);

    useEffect(() => {
        worker.current ??= new Worker(new URL("../../lib/workers/kokoro.ts", import.meta.url), {
            type: "module",
        });

        // Create a callback function for messages from the worker thread.
        const onMessageReceived = ({ data }: { data: any }) => {
            switch (data.status) {
                case "device":
                    toast.success("Device detected: " + data.device);
                    break;
                case "ready":
                    toast.success("Model loaded successfully");
                    setStatus("ready");
                    setVoices(data.voices);
                    break;
                case "error":
                    setStatus("error");
                    setError(data.data);
                    toast.error("Failed to load model");
                    break;
                case "stream": {
                    setChunks((prev) => [...prev, data.chunk]);
                    break;
                }
                case "complete": {
                    setStatus("ready");
                    setResult(data.audio);
                    toast.success("Audio generation complete");
                    break;
                }
            }
        };

        const onErrorReceived = (e: ErrorEvent) => {
            console.error("Worker error:", e);
            setError(e.message);
            toast.error("An error occurred");
        };

        // Attach the callback function as an event listener.
        worker.current?.addEventListener("message", onMessageReceived);
        worker.current?.addEventListener("error", onErrorReceived);

        // Define a cleanup function for when the component is unmounted.
        return () => {
            worker.current?.removeEventListener("message", onMessageReceived);
            worker.current?.removeEventListener("error", onErrorReceived);
        };
    }, []);

    const processed =
        lastGeneration &&
        lastGeneration.text === text &&
        lastGeneration.speed === speed &&
        lastGeneration.voice === selectedVoice;

    const handlePlayPause = () => {
        if (!isPlaying && status === "ready" && !processed) {
            setStatus("generating");
            setChunks([]);
            setCurrentChunkIndex(0);
            const params = { text, voice: selectedVoice, speed };
            setLastGeneration(params);
            worker.current?.postMessage(params);
        }
        if (currentChunkIndex === -1) {
            setCurrentChunkIndex(0);
        }
        setIsPlaying(!isPlaying);
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Text copied to clipboard");
    };

    return (
        <>
            <main className="">
                <div className="max-w-2xl mx-auto py-16 flex flex-col gap-10">
                    {/* Header */}
                    <div>
                        <h1 className="text-4xl font-bold mb-4">Text to Speech</h1>
                        <p className="text-lg text-gray-700 mb-8">
                            Convert text to natural-sounding speech using Kokoro, a lightweight AI model that runs entirely in your browser.
                        </p>
                    </div>

                    {/* Text Input */}
                    <div className="relative">
                        <Textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Enter text to convert to speech..."
                            className={cn(
                                "min-h-[120px] text-base leading-relaxed resize-none",
                                "border border-neutral-300 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400",
                                "bg-white dark:bg-neutral-900",
                                processed && status === "ready"
                                    ? "border-green-300 focus:border-green-400 focus:ring-green-400"
                                    : "",
                                status === "loading" ? "text-neutral-400" : "text-neutral-900 dark:text-neutral-100"
                            )}
                        />
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-2 right-2 h-8 w-8 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            onClick={handleCopy}
                        >
                            {copied ? (
                                <Check className="h-4 w-4 text-green-600" />
                            ) : (
                                <Copy className="h-4 w-4 text-neutral-500" />
                            )}
                        </Button>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        {voices ? (
                            <>
                                <VoiceSelector
                                    voices={voices}
                                    selectedVoice={selectedVoice}
                                    onVoiceChange={setSelectedVoice}
                                />
                                <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    Ready
                                </div>
                            </>
                        ) : error ? (
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                {error}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading model...
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={handlePlayPause}
                            className={cn(
                                "px-6 py-2 rounded-md font-medium transition-colors",
                                "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100",
                                isPlaying && "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                            disabled={
                                (status === "ready" && !isPlaying && !text) ||
                                (status !== "ready" && chunks.length === 0)
                            }
                        >
                            {status === "generating" ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : isPlaying ? (
                                <>
                                    <Pause className="mr-2 h-4 w-4" />
                                    Pause
                                </>
                            ) : (
                                <>
                                    <Play className="mr-2 h-4 w-4" />
                                    {processed ? "Play" : "Generate"}
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => {
                                if (!result) return;
                                const url = URL.createObjectURL(result);
                                const link = document.createElement("a");
                                link.href = url;
                                link.download = "kokoro-audio.wav";
                                link.click();
                                URL.revokeObjectURL(url);
                                toast.success("Audio downloaded");
                            }}
                            disabled={!result || status !== "ready"}
                            className="px-6 py-2 rounded-md border border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                    </div>

                    {/* Audio Chunks */}
                    {chunks.length > 0 && (
                        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                                Generated Audio
                            </h3>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {chunks.map(({ text, audio }, index) => (
                                    <AudioChunk
                                        key={index}
                                        text={text}
                                        audio={audio}
                                        onClick={() => {
                                            setCurrentChunkIndex(index);
                                        }}
                                        active={currentChunkIndex === index}
                                        playing={isPlaying}
                                        onStart={() => {
                                            setCurrentChunkIndex(index);
                                            setIsPlaying(true);
                                        }}
                                        onPause={() => {
                                            if (currentChunkIndex === index) {
                                                setIsPlaying(false);
                                            }
                                        }}
                                        onEnd={() => {
                                            // No more chunks are still generating, and we have reached the end
                                            if (
                                                status !== "generating" &&
                                                currentChunkIndex === chunks.length - 1
                                            ) {
                                                setIsPlaying(false);
                                                setCurrentChunkIndex(-1);
                                            } else {
                                                setCurrentChunkIndex((prev) => prev + 1);
                                            }
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        fontSize: 14,
                        borderRadius: 8,
                        border: "1px solid rgba(0, 0, 0, 0.1)",
                    },
                }}
            />
        </>
    );
}