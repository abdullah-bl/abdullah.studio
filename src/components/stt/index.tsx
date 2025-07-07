import { hasWebGPU } from '@/lib/utils';
import { BrowserAI } from '@browserai/browserai';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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
    const [selectedDevice, setSelectedDevice] = useState<DeviceType>(hasWebGPU ? 'webgpu' : 'cpu');
    const [selectedTask, setSelectedTask] = useState<TaskType>('transcribe');
    const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
    const [returnTimestamps, setReturnTimestamps] = useState<boolean>(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isTranscribing, setIsTranscribing] = useState<boolean>(false);

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
                onProgress: (progress) => {
                    console.log('Loading model:', progress.progress + '%');
                    setProgress(progress.progress);
                }
            });

            setIsModelLoaded(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load model');
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
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to transcribe audio');
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
        } catch (err) {
            setError('Failed to copy to clipboard');
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
    };

    return (
        <div className="w-screen h-screen flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full overflow-scroll p-4">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">Speech-to-Text</h1>
                    <p className="text-muted-foreground">
                        Convert speech to text using BrowserAI's Whisper models
                    </p>
                </div>

                {/* Model Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div>
                        <Label htmlFor="model">Model</Label>
                        <Select value={selectedModel} onValueChange={(value: ModelType) => setSelectedModel(value)}>
                            <SelectTrigger>
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
                        <Label htmlFor="device">Device</Label>
                        <Select value={selectedDevice} onValueChange={(value: DeviceType) => setSelectedDevice(value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="webgpu">WebGPU</SelectItem>
                                <SelectItem value="cpu">CPU</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="task">Task</Label>
                        <Select value={selectedTask} onValueChange={(value: TaskType) => setSelectedTask(value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="transcribe">Transcribe</SelectItem>
                                <SelectItem value="translate">Translate</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="language">Language</Label>
                        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                            <SelectTrigger>
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
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            <span>Loading model... {progress}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                            <div
                                ref={progressRef}
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-destructive">{error}</p>
                    </div>
                )}

                {/* Recording Controls */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex gap-2">
                        <Button
                            onClick={startRecording}
                            disabled={!isModelLoaded || isRecording || isLoading}
                            className="flex-1 sm:flex-none"
                        >
                            {isRecording ? (
                                <>
                                    <div className="animate-pulse w-2 h-2 bg-white rounded-full mr-2"></div>
                                    Recording...
                                </>
                            ) : (
                                'Start Recording'
                            )}
                        </Button>

                        <Button
                            onClick={stopRecording}
                            disabled={!isRecording}
                            variant="outline"
                            className="flex-1 sm:flex-none"
                        >
                            Stop Recording
                        </Button>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => document.getElementById('file-upload')?.click()}
                            disabled={!isModelLoaded}
                        >
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
                        >
                            Clear
                        </Button>
                    </div>
                </div>

                {/* Transcribing Indicator */}
                {isTranscribing && (
                    <div className="mb-6 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span>Transcribing audio...</span>
                    </div>
                )}

                {/* Results */}
                {result && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Transcription Result</h2>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                                    Copy
                                </Button>
                                <Button variant="outline" size="sm" onClick={downloadTranscription}>
                                    Download
                                </Button>
                            </div>
                        </div>

                        <Textarea
                            value={result.text}
                            readOnly
                            className="min-h-[200px] font-mono"
                            placeholder="Transcription will appear here..."
                        />

                        {result.timestamps && returnTimestamps && (
                            <div className="mt-4">
                                <h3 className="text-lg font-semibold mb-2">Timestamps</h3>
                                <div className="bg-secondary/50 rounded-lg p-4 max-h-40 overflow-y-auto">
                                    {result.timestamps.map((timestamp, index) => (
                                        <div key={index} className="text-sm mb-1">
                                            <span className="text-muted-foreground">
                                                [{timestamp.start.toFixed(2)}s - {timestamp.end.toFixed(2)}s]
                                            </span>
                                            <span className="ml-2">{timestamp.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Audio Player */}
                {audioBlob && (
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-2">Recorded Audio</h3>
                        <audio controls className="w-full">
                            <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                )}

                {/* Settings */}
                <div className="mt-6 p-4 bg-secondary/20 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Advanced Settings</h3>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="timestamps"
                            checked={returnTimestamps}
                            onChange={(e) => setReturnTimestamps(e.target.checked)}
                            className="rounded"
                        />
                        <Label htmlFor="timestamps">Return word-level timestamps</Label>
                    </div>
                </div>
            </div>
        </div>
    );
}