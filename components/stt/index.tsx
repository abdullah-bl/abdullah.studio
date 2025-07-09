import { hasWebGPU } from '@/lib/utils';
import { BrowserAI } from '@browserai/browserai';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Copy, Download, Loader2, Mic, Square, Upload } from 'lucide-react';
import { toast, Toaster } from 'sonner';

type ModelType = 'whisper-tiny-en' | 'whisper-base-all' | 'whisper-small-all';
type DeviceType = 'webgpu' | 'cpu';
type TaskType = 'transcribe' | 'translate';

interface TranscriptionResult {
    text: string;
    timestamps?: Array<{ start: number; end: number; text: string }>;
}

// Type for BrowserAI transcription result
type BrowserAITranscriptionResult = {
    text: string;
    timestamps?: Array<{ start: number; end: number; text: string }>;
};

export function STT() {
    const [stt, setStt] = useState<BrowserAI | null>(null);
    const [result, setResult] = useState<TranscriptionResult | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<ModelType>('whisper-tiny-en');
    const [selectedDevice, setSelectedDevice] = useState<DeviceType>(hasWebGPU() ? 'webgpu' : 'cpu');
    const [selectedTask, setSelectedTask] = useState<TaskType>('transcribe');
    const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
    const [returnTimestamps, setReturnTimestamps] = useState<boolean>(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);

    const progressRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        init();
    }, [selectedModel, selectedDevice]);

    const init = async () => {
        try {
            setIsLoading(true);
            setError(null);
            setIsModelLoaded(false);

            const browserAI = new BrowserAI();
            setStt(browserAI);

            // Load speech recognition model
            await browserAI.loadModel(selectedModel, {
                device: selectedDevice,
                worker: true,
                onProgress: (progress: any) => {
                    console.log('Loading model:', progress.progress + '%');
                    setProgress(progress.progress);
                }
            });

            setIsModelLoaded(true);
            toast.success('Model loaded successfully');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load model');
            toast.error('Failed to load model');
        } finally {
            setIsLoading(false);
        }
    };

    const startRecording = async () => {
        if (!stt || !isModelLoaded) return;

        try {
            setError(null);
            setIsRecording(true);
            await stt.startRecording();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start recording');
            setIsRecording(false);
            toast.error('Failed to start recording');
        }
    };

    const stopRecording = async () => {
        if (!stt || !isRecording) return;

        try {
            setIsRecording(false);
            const blob = await stt.stopRecording();
            setAudioBlob(blob);

            // Auto-transcribe the recorded audio
            await transcribeAudio(blob);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to stop recording');
            toast.error('Failed to stop recording');
        }
    };

    const transcribeAudio = async (audio: Blob) => {
        if (!stt || !isModelLoaded) return;

        try {
            setIsTranscribing(true);
            setError(null);

            const transcriptionResult = await stt.transcribeAudio(audio, {
                language: selectedLanguage,
                task: selectedTask,
                return_timestamps: returnTimestamps,
                chunk_length_s: 30
            });

            setResult(transcriptionResult as TranscriptionResult);
            toast.success('Transcription complete');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to transcribe audio');
            toast.error('Failed to transcribe audio');
        } finally {
            setIsTranscribing(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setAudioBlob(file);
        await transcribeAudio(file);
    };

    const clearResults = () => {
        setResult(null);
        setAudioBlob(null);
    };

    const copyToClipboard = async () => {
        if (!result?.text) return;

        try {
            await navigator.clipboard.writeText(result.text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success('Text copied to clipboard');
        } catch (err) {
            toast.error('Failed to copy to clipboard');
        }
    };

    const downloadTranscription = () => {
        if (!result?.text) return;

        const blob = new Blob([result.text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transcription.txt';
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Transcription downloaded');
    };

    return (
        <>
            <main className="">
                <div className="max-w-2xl mx-auto py-16 flex flex-col gap-10">
                    {/* Header */}
                    <div>
                        <h1 className="text-4xl font-bold mb-4">Speech to Text</h1>
                        <p className="text-lg text-gray-700 mb-8">
                            Convert speech to text using Whisper models that run entirely in your browser.
                        </p>
                    </div>

                    {/* Model Configuration */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="model" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Model</Label>
                            <Select value={selectedModel} onValueChange={(value: ModelType) => setSelectedModel(value)}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="whisper-tiny-en">Whisper Tiny (English)</SelectItem>
                                    <SelectItem value="whisper-base-all">Whisper Base (Multilingual)</SelectItem>
                                    <SelectItem value="whisper-small-all">Whisper Small (Multilingual)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="device" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Device</Label>
                            <Select value={selectedDevice} onValueChange={(value: DeviceType) => setSelectedDevice(value)}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="webgpu">WebGPU</SelectItem>
                                    <SelectItem value="cpu">CPU</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="task" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Task</Label>
                            <Select value={selectedTask} onValueChange={(value: TaskType) => setSelectedTask(value)}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="transcribe">Transcribe</SelectItem>
                                    <SelectItem value="translate">Translate</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="language" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Language</Label>
                            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="es">Spanish</SelectItem>
                                    <SelectItem value="fr">French</SelectItem>
                                    <SelectItem value="de">German</SelectItem>
                                    <SelectItem value="it">Italian</SelectItem>
                                    <SelectItem value="pt">Portuguese</SelectItem>
                                    <SelectItem value="ru">Russian</SelectItem>
                                    <SelectItem value="ja">Japanese</SelectItem>
                                    <SelectItem value="ko">Korean</SelectItem>
                                    <SelectItem value="zh">Chinese</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading model... {progress}%</span>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Recording Controls */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex gap-2">
                            <Button
                                onClick={startRecording}
                                disabled={!isModelLoaded || isRecording || isLoading}
                                className="px-6 py-2 rounded-md font-medium transition-colors bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 disabled:opacity-50"
                            >
                                {isRecording ? (
                                    <>
                                        <div className="animate-pulse w-2 h-2 bg-white rounded-full mr-2"></div>
                                        Recording...
                                    </>
                                ) : (
                                    <>
                                        <Mic className="mr-2 h-4 w-4" />
                                        Start Recording
                                    </>
                                )}
                            </Button>

                            <Button
                                onClick={stopRecording}
                                disabled={!isRecording}
                                variant="outline"
                                className="px-6 py-2 rounded-md border border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
                            >
                                <Square className="mr-2 h-4 w-4" />
                                Stop
                            </Button>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => document.getElementById('file-upload')?.click()}
                                disabled={!isModelLoaded}
                                className="px-6 py-2 rounded-md border border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Audio
                            </Button>
                            <input
                                id="file-upload"
                                type="file"
                                accept="audio/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />

                            <Button
                                variant="outline"
                                onClick={clearResults}
                                disabled={!result && !audioBlob}
                                className="px-6 py-2 rounded-md border border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
                            >
                                Clear
                            </Button>
                        </div>
                    </div>

                    {/* Transcribing Indicator */}
                    {isTranscribing && (
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Transcribing audio...</span>
                        </div>
                    )}

                    {/* Results */}
                    {result && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Transcription</h2>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={copyToClipboard}
                                        className="px-3 py-1 text-sm border border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
                                    >
                                        {copied ? (
                                            <>
                                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                                Copied
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="mr-2 h-3 w-3" />
                                                Copy
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={downloadTranscription}
                                        className="px-3 py-1 text-sm border border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
                                    >
                                        <Download className="mr-2 h-3 w-3" />
                                        Download
                                    </Button>
                                </div>
                            </div>

                            <Textarea
                                value={result.text}
                                readOnly
                                className="min-h-[120px] font-mono text-sm border border-neutral-300 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                                placeholder="Transcription will appear here..."
                            />

                            {result.timestamps && returnTimestamps && (
                                <div className="mt-4">
                                    <h3 className="text-base font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Timestamps</h3>
                                    <div className="bg-neutral-50 dark:bg-neutral-800 rounded-md p-3 max-h-32 overflow-y-auto border border-neutral-200 dark:border-neutral-700">
                                        {result.timestamps.map((timestamp, index) => (
                                            <div key={index} className="text-sm mb-1">
                                                <span className="text-neutral-500 dark:text-neutral-400">
                                                    [{timestamp.start.toFixed(2)}s - {timestamp.end.toFixed(2)}s]
                                                </span>
                                                <span className="ml-2 text-neutral-900 dark:text-neutral-100">{timestamp.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Audio Player */}
                    {audioBlob && (
                        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6">
                            <h3 className="text-base font-semibold mb-3 text-neutral-900 dark:text-neutral-100">Recorded Audio</h3>
                            <audio controls className="w-full">
                                <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    )}

                    {/* Settings */}
                    <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6">
                        <h3 className="text-base font-semibold mb-3 text-neutral-900 dark:text-neutral-100">Settings</h3>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="timestamps"
                                checked={returnTimestamps}
                                onChange={(e) => setReturnTimestamps(e.target.checked)}
                                className="rounded border-neutral-300 focus:ring-neutral-400"
                            />
                            <Label htmlFor="timestamps" className="text-sm text-neutral-700 dark:text-neutral-300">Return word-level timestamps</Label>
                        </div>
                    </div>
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