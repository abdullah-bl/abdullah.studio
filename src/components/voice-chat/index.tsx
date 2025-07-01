import { BrowserAI } from "@browserai/browserai";
import { useEffect, useState, useRef } from "react";
import { Button } from "../ui/button";
import { Loader2, Mic, MicOff, Volume2, VolumeX } from "@/lib/icons";
import { cn } from "@/lib/utils";

type Message = {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
};

export default function VoiceChat() {
    const [llm, setLlm] = useState<BrowserAI | null>(null);
    const [tts, setTts] = useState<BrowserAI | null>(null);
    const [stt, setStt] = useState<BrowserAI | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [progress, setProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [ttsFailed, setTtsFailed] = useState(false);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioUrlRef = useRef<string | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        initializeAI();
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (isRecording && stt) {
                stt.stopRecording();
            }
            cleanupAudio();
        };
    }, []);

    const cleanupAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
        }
        setIsSpeaking(false);
    };

    const stopAllAudio = () => {
        // Stop any currently playing audio elements
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        setIsSpeaking(false);
    };

    const initializeAI = async () => {
        try {
            const llm = new BrowserAI();
            const tts = new BrowserAI();
            const stt = new BrowserAI();

            setLlm(llm);
            setTts(tts);
            setStt(stt);

            // Load all required models
            await stt.loadModel('whisper-base-all', {
                onProgress: (p) => setProgress(p.progress)
            });

            await llm.loadModel('smollm2-135m-instruct', {
                onProgress: (p) => setProgress(p.progress)
            });

            // Try a different TTS model that's more stable
            await tts.loadModel('kokoro-tts', {
                onProgress: (p) => setProgress(p.progress)
            });

            setIsReady(true);
        } catch (error) {
            console.error('Failed to initialize AI:', error);
        }
    };

    const startRecording = async () => {
        try {
            if (!stt) return;

            // Clean up any existing audio
            cleanupAudio();
            stopAllAudio();

            // Start recording
            await stt.startRecording();
            setIsRecording(true);
            animateButton();
        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    };

    const stopRecording = async () => {
        try {
            if (!stt || !isRecording) return;

            const recordedAudioBlob = await stt.stopRecording();
            setIsRecording(false);

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            await processAudio(recordedAudioBlob);
        } catch (error) {
            console.error('Failed to stop recording:', error);
        }
    };

    const processAudio = async (recordedAudioBlob: Blob) => {
        setIsProcessing(true);
        try {
            // Speech to Text
            const { text } = await stt.transcribeAudio(recordedAudioBlob) as { text: string };
            if (!text) throw new Error('Failed to transcribe audio');

            // Add user message
            setMessages(prev => [...prev, {
                role: "user",
                content: text,
                timestamp: new Date()
            }]);

            // Generate response
            const chunks = await llm.generateText(
                `User: ${text}\nAssistant:`,
                {
                    temperature: 0.7,
                    max_tokens: 150,
                    system_prompt: "You are a helpful AI assistant. Keep responses concise and engaging.",
                    stream: true
                }
            )

            let response = '';
            for await (const chunk of chunks as AsyncIterable<{
                choices: Array<{ delta: { content?: string } }>,
                usage: any
            }>) {
                const newContent = chunk.choices[0]?.delta.content || '';
                response += newContent;
            }

            // Add assistant message
            setMessages(prev => [...prev, {
                role: "assistant",
                content: response,
                timestamp: new Date()
            }]);

            // Text to Speech
            if (!isMuted && !ttsFailed && response.trim()) {
                await playTTS(response);
            }
        } catch (error) {
            console.error('Failed to process audio:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const playTTS = async (text: string) => {
        try {
            // Clean up any existing audio first
            cleanupAudio();
            stopAllAudio();

            // Small delay to ensure cleanup is complete
            await new Promise(resolve => setTimeout(resolve, 100));

            // Split long text into manageable chunks for streaming
            const chunks = splitTextIntoChunks(text, 100); // 100 characters per chunk
            const audioChunks: Blob[] = [];
            let completedChunks = 0;

            setIsSpeaking(true);
            setIsStreaming(true);

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                console.log(`Processing TTS chunk ${i + 1}/${chunks.length}: "${chunk}"`);

                try {
                    const audioData = await tts.textToSpeech(chunk, {
                        voice: 'am_adam',
                        speed: 1.0,
                        pitch: 1.0,
                        volume: 1.0,
                        language: 'en'
                    });

                    // Handle different audio formats
                    let audioBlob: Blob;

                    try {
                        if (audioData instanceof Blob) {
                            audioBlob = audioData;
                        } else if (audioData instanceof ArrayBuffer) {
                            audioBlob = new Blob([audioData], { type: 'audio/wav' });
                        } else {
                            // Assume it's a string or other format
                            const response = await fetch(`data:audio/wav;base64,${audioData}`);
                            audioBlob = await response.blob();
                        }
                    } catch (blobError) {
                        // Fallback: try to treat as base64 string
                        const response = await fetch(`data:audio/wav;base64,${audioData}`);
                        audioBlob = await response.blob();
                    }

                    audioChunks.push(audioBlob);

                    // Play the chunk immediately for streaming effect
                    if (i === 0) {
                        // Play first chunk immediately
                        await playAudioChunk(audioBlob, () => {
                            completedChunks++;
                            if (completedChunks === chunks.length) {
                                setIsSpeaking(false);
                                setIsStreaming(false);
                            }
                        });
                    } else {
                        // Queue subsequent chunks
                        setTimeout(async () => {
                            await playAudioChunk(audioBlob, () => {
                                completedChunks++;
                                if (completedChunks === chunks.length) {
                                    setIsSpeaking(false);
                                    setIsStreaming(false);
                                }
                            });
                        }, i * 2000); // 2 second delay between chunks
                    }

                } catch (chunkError) {
                    console.warn(`Failed to process TTS chunk ${i + 1}:`, chunkError);
                    completedChunks++;
                    // Continue with next chunk
                }
            }

            // If no chunks were processed, stop speaking
            if (chunks.length === 0) {
                setIsSpeaking(false);
                setIsStreaming(false);
            }

        } catch (ttsError) {
            console.error('TTS failed:', ttsError);
            setIsSpeaking(false);
            setIsStreaming(false);
            setTtsFailed(true);

            // Show user-friendly error message
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "I'm sorry, I couldn't speak that response. Text-to-speech has been disabled. You can still read my responses.",
                timestamp: new Date()
            }]);
        }
    };

    const playAudioChunk = async (audioBlob: Blob, onEnded?: () => void) => {
        try {
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                onEnded?.();
            };

            audio.onerror = () => {
                URL.revokeObjectURL(audioUrl);
                console.error('Audio chunk playback failed');
                onEnded?.();
            };

            await audio.play();
        } catch (error) {
            console.error('Failed to play audio chunk:', error);
            onEnded?.();
        }
    };

    const splitTextIntoChunks = (text: string, maxLength: number): string[] => {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const chunks: string[] = [];
        let currentChunk = '';

        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (trimmedSentence.length === 0) continue;

            // If adding this sentence would exceed maxLength, start a new chunk
            if (currentChunk.length + trimmedSentence.length > maxLength && currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = trimmedSentence;
            } else {
                currentChunk += (currentChunk.length > 0 ? '. ' : '') + trimmedSentence;
            }
        }

        // Add the last chunk if it has content
        if (currentChunk.trim().length > 0) {
            chunks.push(currentChunk.trim());
        }

        return chunks.length > 0 ? chunks : [text];
    };

    const animateButton = () => {
        const updateAnimation = () => {
            if (buttonRef.current) {
                const scale = 1 + Math.sin(Date.now() * 0.01) * 0.1;
                buttonRef.current.style.transform = `scale(${scale})`;
            }
            animationFrameRef.current = requestAnimationFrame(updateAnimation);
        };
        updateAnimation();
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const resetTTS = () => {
        setTtsFailed(false);
        setMessages(prev => [...prev, {
            role: "assistant",
            content: "Text-to-speech has been re-enabled. Try speaking again!",
            timestamp: new Date()
        }]);
    };

    if (!isReady) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <div className="text-white text-sm">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-black">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h1 className="text-white font-medium">Voice Chat</h1>
                <div className="flex items-center gap-2">
                    {ttsFailed && (
                        <div className="flex items-center gap-2">
                            <div className="text-red-400 text-xs">TTS Disabled</div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetTTS}
                                className="text-blue-400 hover:text-blue-300 text-xs"
                            >
                                Reset
                            </Button>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsMuted(!isMuted)}
                        className={cn(
                            "text-white/70 hover:text-white",
                            isMuted && "text-red-400"
                        )}
                    >
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center text-white/50">
                                <Mic className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-sm">Click to start speaking</p>
                            </div>
                        </div>
                    ) : (
                        messages.map((message, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "flex",
                                    message.role === "user" ? "justify-end" : "justify-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                                        message.role === "user"
                                            ? "bg-blue-500 text-white"
                                            : "bg-white/10 text-white"
                                    )}
                                >
                                    {message.content}
                                </div>
                            </div>
                        ))
                    )}
                    {isProcessing && (
                        <div className="flex justify-start">
                            <div className="bg-white/10 text-white rounded-lg px-3 py-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="flex space-x-1">
                                        <div className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" />
                                        <div className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                        <div className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Control Panel */}
            <div className="p-6 border-t border-white/10">
                <div className="flex justify-center">
                    <Button
                        ref={buttonRef}
                        size="lg"
                        className={cn(
                            "h-16 w-16 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg transition-all duration-300",
                            isRecording && "bg-red-500 hover:bg-red-600 scale-110",
                            isProcessing && "opacity-50 cursor-not-allowed",
                            isSpeaking && "bg-green-500 hover:bg-green-600",
                            isStreaming && "animate-pulse"
                        )}
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isProcessing}
                    >
                        {isRecording ? (
                            <MicOff className="h-6 w-6" />
                        ) : isSpeaking ? (
                            <Volume2 className="h-6 w-6" />
                        ) : (
                            <Mic className="h-6 w-6" />
                        )}
                    </Button>
                </div>
                {isMuted && (
                    <div className="text-center text-red-400 text-xs mt-2">Audio muted</div>
                )}
                {isStreaming && (
                    <div className="text-center text-blue-400 text-xs mt-2">Processing audio...</div>
                )}
            </div>
        </div>
    );
}