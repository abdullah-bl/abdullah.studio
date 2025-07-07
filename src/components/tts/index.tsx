import { useState, useEffect, useRef } from "react";
import {
    Download,
    Pause,
    Play,
    Copy,
    Check,
    AudioWaveform,
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
        "Kokoro is an open-weight TTS model with 82 million parameters. Despite its lightweight architecture, it delivers comparable quality to larger models while being significantly faster and more cost-efficient. With Apache-licensed weights, Kokoro can be deployed anywhere from production environments to personal projects. It can even run 100% locally in your browser, powered by Transformers.js!",
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
        worker.current ??= new Worker(new URL("../../scripts/workerKokoro.ts", import.meta.url), {
            type: "module",
        });

        // Create a callback function for messages from the worker thread.
        const onMessageReceived = ({ data }) => {
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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 p-4 md:p-8 lg:p-12">
                <div className="container mx-auto max-w-5xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-3 mb-4">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                                <AudioWaveform className="size-8 text-white" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
                                Kokoro Web
                            </h1>
                        </div>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                            Convert text to natural-sounding speech with AI-powered voice synthesis
                        </p>
                    </div>

                    {/* Main Content Card */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                        {/* Text Input Section */}
                        <div className="p-6 md:p-8">
                            <div className="relative mb-6">
                                <Textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Type or paste your text here to convert it to speech..."
                                    className={cn(
                                        "min-h-[200px] text-lg leading-relaxed resize-none border-2 transition-all duration-300",
                                        "focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                                        processed && status === "ready"
                                            ? "bg-emerald-50/50 border-emerald-200"
                                            : "bg-white/50 border-gray-200",
                                        status === "loading" ? "text-gray-400" : "text-gray-800"
                                    )}
                                />
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute top-3 right-3 h-10 w-10 rounded-full hover:bg-gray-100/80 transition-colors"
                                    onClick={handleCopy}
                                >
                                    {copied ? (
                                        <Check className="h-5 w-5 text-emerald-600" />
                                    ) : (
                                        <Copy className="h-5 w-5 text-gray-500" />
                                    )}
                                </Button>
                            </div>

                            {/* Controls Section */}
                            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
                                <div className="flex flex-col sm:flex-row gap-4 items-center">
                                    {voices ? (
                                        <>
                                            <VoiceSelector
                                                voices={voices}
                                                selectedVoice={selectedVoice}
                                                onVoiceChange={setSelectedVoice}
                                            />
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                                Model Ready
                                            </div>
                                        </>
                                    ) : error ? (
                                        <div className="flex items-center gap-2 text-red-600 font-medium">
                                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                            {error}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Loading model...
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                                <Button
                                    size="lg"
                                    onClick={handlePlayPause}
                                    className={cn(
                                        "text-lg px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg",
                                        "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
                                        "text-white border-0 min-w-[160px]",
                                        isPlaying && "from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600",
                                        "disabled:opacity-50 disabled:cursor-not-allowed"
                                    )}
                                    disabled={
                                        (status === "ready" && !isPlaying && !text) ||
                                        (status !== "ready" && chunks.length === 0)
                                    }
                                >
                                    {status === "generating" ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Generating...
                                        </>
                                    ) : isPlaying ? (
                                        <>
                                            <Pause className="mr-2 h-5 w-5" />
                                            Pause
                                        </>
                                    ) : (
                                        <>
                                            <Play className="mr-2 h-5 w-5" />
                                            {processed ? "Play" : "Generate Audio"}
                                        </>
                                    )}
                                </Button>

                                <Button
                                    size="lg"
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
                                    className="px-6 py-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                                >
                                    <Download className="mr-2 h-5 w-5" />
                                    Download
                                </Button>
                            </div>
                        </div>

                        {/* Audio Chunks Section */}
                        {chunks.length > 0 && (
                            <div className="border-t border-gray-100 bg-gray-50/50">
                                <div className="p-6 md:p-8">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <AudioWaveform className="h-5 w-5 text-blue-600" />
                                        Generated Audio Chunks
                                    </h3>
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
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
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-white/20">
                    <p className="text-sm text-gray-600">
                        Powered by{" "}
                        <a
                            href="https://huggingface.co/docs/transformers.js"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                        >
                            🤗 Transformers.js
                        </a>
                    </p>
                </div>
            </div>

            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        fontSize: 14,
                        borderRadius: 12,
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                    },
                }}
            />
        </>
    );
}