import { useEffect, useRef, useState } from "react";

// Dynamic import for Kokoro TTS to reduce initial bundle size
const loadKokoroTTS = async () => {
    const { KokoroTTS } = await import("kokoro-js");
    return KokoroTTS;
};

export default function VoiceChat2() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [text, setText] = useState("");
    const [tts, setTts] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [audioFiles, setAudioFiles] = useState<string[]>([]);
    const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
    const [initError, setInitError] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);

    const playAudio = async () => {
        if (audioRef.current && audioFiles.length > 0) {
            audioRef.current.src = audioFiles[currentAudioIndex];
            audioRef.current.load();
            audioRef.current.play();
        }
    }

    // Split text into chunks to respect model's context length
    const chunkText = (text: string, maxLength: number = 200) => {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const chunks: string[] = [];
        let currentChunk = "";

        for (const sentence of sentences) {
            if ((currentChunk + sentence).length <= maxLength) {
                currentChunk += sentence + ". ";
            } else {
                if (currentChunk) {
                    chunks.push(currentChunk.trim());
                }
                currentChunk = sentence + ". ";
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk.trim());
        }

        return chunks.length > 0 ? chunks : [text];
    }

    const processTextToSpeech = async () => {
        if (!tts || !text.trim()) return;

        setIsProcessing(true);
        try {
            const textChunks = chunkText(text);
            const newAudioFiles: string[] = [];

            for (let chunkIndex = 0; chunkIndex < textChunks.length; chunkIndex++) {
                const chunk = textChunks[chunkIndex];
                console.log(`Processing chunk ${chunkIndex + 1}/${textChunks.length}:`, chunk);

                const stream = tts.stream(chunk);
                let i = 0;

                for await (const { text: processedText, phonemes, audio } of stream) {
                    console.log({ text: processedText, phonemes });
                    const fileName = `audio-${Date.now()}-${chunkIndex}-${i}.wav`;
                    audio.save(fileName);
                    newAudioFiles.push(fileName);
                    i++;
                }
            }

            setAudioFiles(newAudioFiles);
            setCurrentAudioIndex(0);
            console.log(`Generated ${newAudioFiles.length} audio files`);
        } catch (error) {
            console.error("Error processing text to speech:", error);
        } finally {
            setIsProcessing(false);
        }
    }

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        console.log("Starting TTS initialization...");
        setIsInitializing(true);
        setInitError(null);

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error("Initialization timeout after 30 seconds")), 30000);
        });

        try {
            console.log("Loading Kokoro TTS model...");
            const KokoroTTS = await loadKokoroTTS();

            // Check if WebGPU is available
            if (typeof navigator !== 'undefined' && navigator.gpu) {
                console.log("WebGPU is available, trying WebGPU device...");
                try {
                    const ttsInstance = await Promise.race([
                        KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
                            dtype: "fp16",
                            device: "webgpu",
                        }),
                        timeoutPromise
                    ]);
                    console.log("TTS model loaded successfully with WebGPU:", ttsInstance);
                    setTts(ttsInstance);
                    return;
                } catch (webgpuError) {
                    console.warn("WebGPU failed, falling back to WASM:", webgpuError);
                }
            }

            // Fallback to WASM
            console.log("Trying WASM device...");
            const ttsInstance = await Promise.race([
                KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
                    dtype: "fp16",
                    device: "wasm",
                }),
                timeoutPromise
            ]);
            console.log("TTS model loaded successfully with WASM:", ttsInstance);
            setTts(ttsInstance);
        } catch (error) {
            console.error("Error initializing TTS:", error);
            setInitError(error instanceof Error ? error.message : "Unknown error occurred");
        } finally {
            setIsInitializing(false);
        }
    }

    const handleAudioEnded = () => {
        if (currentAudioIndex < audioFiles.length - 1) {
            setCurrentAudioIndex(prev => prev + 1);
        } else {
            setCurrentAudioIndex(0);
        }
    }

    return (
        <div className="flex flex-col h-screen bg-gray-900">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h1 className="text-white font-medium">Voice Chat</h1>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-4">
                <div className="w-full max-w-md space-y-4">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Enter text to convert to speech... (will be automatically chunked for processing)"
                        className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 min-h-[100px] resize-none"
                    />
                    <div className="flex space-x-2">
                        <button
                            onClick={playAudio}
                            disabled={audioFiles.length === 0}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Play Audio ({audioFiles.length} files)
                        </button>
                        <button
                            onClick={processTextToSpeech}
                            disabled={!tts || !text.trim() || isProcessing}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? "Processing..." : "Generate Audio"}
                        </button>
                        <button
                            onClick={async () => {
                                console.log("Testing simple model load...");
                                setIsInitializing(true);
                                try {
                                    const KokoroTTS = await loadKokoroTTS();
                                    const instance = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
                                        dtype: "fp32",
                                        device: "wasm",
                                    });
                                    console.log("Simple test successful:", instance);
                                    setTts(instance);
                                } catch (error) {
                                    console.error("Simple test failed:", error);
                                    setInitError(error instanceof Error ? error.message : "Unknown error");
                                } finally {
                                    setIsInitializing(false);
                                }
                            }}
                            disabled={isInitializing}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Test Load
                        </button>
                        {audioFiles.length > 0 && (
                            <span className="px-4 py-2 bg-gray-700 text-white rounded-lg">
                                {currentAudioIndex + 1} / {audioFiles.length}
                            </span>
                        )}
                    </div>
                    <div className="text-sm text-gray-400">
                        <div>TTS Status: {isInitializing ? "Initializing..." : tts ? "Ready" : "Failed"}</div>
                        <div>Text Length: {text.length} characters</div>
                        <div>Audio Files: {audioFiles.length}</div>
                        {initError && (
                            <div className="text-red-400 mt-2">
                                <div>Error: {initError}</div>
                                <button
                                    onClick={init}
                                    className="mt-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                >
                                    Retry
                                </button>
                            </div>
                        )}
                        {audioFiles.length > 0 && (
                            <div className="text-xs mt-2">
                                Files: {audioFiles.slice(0, 3).join(", ")}
                                {audioFiles.length > 3 && `... and ${audioFiles.length - 3} more`}
                            </div>
                        )}
                    </div>
                </div>
                <audio
                    ref={audioRef}
                    onEnded={handleAudioEnded}
                    onError={(e) => console.error("Audio error:", e)}
                />
            </div>
        </div>
    );
}