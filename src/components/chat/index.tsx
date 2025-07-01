import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Loader2, Send, Square, Info, X, Badge, Sparkles } from "@/lib/icons";
import { Textarea } from "../ui/textarea";
import Markdown from "react-markdown";
import { cn } from "@/lib/utils";
import TextareaAutosize from 'react-textarea-autosize';
import { hasWebGPU } from "@/lib/utils";

// Dynamic imports for heavy ML libraries
const loadMLCLibraries = async () => {
    const [{ CreateWebWorkerMLCEngine, MLCEngine, WebWorkerMLCEngine }] = await Promise.all([
        import("@mlc-ai/web-llm")
    ]);
    return { CreateWebWorkerMLCEngine, MLCEngine, WebWorkerMLCEngine };
};

type ChatMessage = {
    role: "user" | "assistant" | "system"
    content: string;
}

type Usage = {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

const suggestedQuestions = [
    "What's the weather like today?",
    "Help me plan a weekend trip",
    "Explain quantum computing simply",
    "Write a short poem about technology",
    "What are the best productivity tips?",
    "Tell me a random interesting fact",
];

export function Chat() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: "system", content: "You are a helpful assistant." }
    ]);
    const [engine, setEngine] = useState<any>(null);
    const [model, setModel] = useState<string>("SmolLM2-360M-Instruct-q0f32-MLC");
    const [isReady, setIsReady] = useState<boolean>(false);
    const [progress, setProgress] = useState<{ progress: number, text: string, timeElapsed: number }>({ progress: 0, text: "", timeElapsed: 0 });
    const [isGenerating, setIsGenerating] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [usage, setUsage] = useState<Usage | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const [isWebGPU, setIsWebGPU] = useState(false);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        if (hasWebGPU()) {
            setIsWebGPU(true);
            loadEngine();
        }
    }, []);

    const loadEngine = async () => {
        try {
            const { CreateWebWorkerMLCEngine } = await loadMLCLibraries();
            const engine = await CreateWebWorkerMLCEngine(
                new Worker(new URL("../../scripts/workerMLC.ts", import.meta.url), { type: "module" }),
                model,
                {
                    initProgressCallback: (progress) => {
                        setProgress({ progress: progress.progress, text: progress.text, timeElapsed: progress.timeElapsed });
                    },
                }
            );
            setEngine(engine);
            setIsReady(true);
        } catch (error) {
            console.error("Failed to load MLC engine:", error);
        }
    }

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsGenerating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!inputValue.trim() || isGenerating) return;

        const message = inputValue.trim();
        setInputValue("");
        const updatedMessages: ChatMessage[] = [...messages, { role: "user" as const, content: message }];
        setMessages(updatedMessages);
        setIsGenerating(true);
        abortControllerRef.current = new AbortController();

        try {
            const reply = await engine?.chat.completions.create({
                messages: updatedMessages.map((message) => ({
                    role: message.role,
                    content: message.content
                })),
                stream: true,
                stream_options: { include_usage: true },
            });

            let assistantMessage: ChatMessage = { role: "assistant", content: "" };
            setMessages(prev => [...prev, assistantMessage]);

            for await (const chunk of reply) {
                if (abortControllerRef.current?.signal.aborted) {
                    break;
                }
                const content = chunk.choices?.[0]?.delta?.content;
                if (content) {
                    assistantMessage.content += content;
                    setMessages(prev => [...prev.slice(0, -1), { ...assistantMessage }]);
                }
                if (chunk.usage) {
                    setUsage(chunk.usage);
                }
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Generation stopped');
                setMessages(prev => prev.slice(0, -1));
            } else {
                console.error('Error during generation:', error);
            }
        } finally {
            setIsGenerating(false);
            abortControllerRef.current = null;
        }
    }

    const handleQuestionClick = (question: string) => {
        setInputValue(question);
    };

    const handleClear = () => {
        setMessages([{ role: "system", content: "You are a helpful assistant." }]);
        setUsage(null);
        setInputValue("");
    };

    if (!isWebGPU) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center space-y-4 max-w-md mx-auto p-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                        <X className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-lg font-medium">WebGPU Not Supported</h2>
                        <p className="text-sm text-muted-foreground">Please use a Chrome-based browser to access this feature.</p>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-4">
                {!isReady ? (
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
                ) : messages.length === 1 ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                                <Sparkles className="h-8 w-8 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-2xl font-semibold">How can I help you today?</h1>
                                <p className="text-muted-foreground">Ask me anything or try one of these suggestions</p>
                            </div>
                        </div>
                        <div className="w-full max-w-lg space-y-3">
                            {suggestedQuestions.map((question, index) => (
                                <Button
                                    key={index}
                                    variant="outline"
                                    className="w-full justify-start text-left h-auto p-4 hover:bg-muted/50 transition-colors"
                                    onClick={() => handleQuestionClick(question)}
                                >
                                    {question}
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        <ScrollArea className="flex-1 -mx-4 px-4">
                            <div className="space-y-6 py-4">
                                {messages.filter(message => message.role !== "system").map((message, index) => (
                                    <div
                                        key={index}
                                        className={cn(
                                            "flex",
                                            message.role === "user" ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "max-w-[85%] rounded-2xl px-4 py-3",
                                                message.role === "user"
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted"
                                            )}
                                        >
                                            <div className="prose dark:prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-pre:p-0">
                                                <Markdown
                                                    components={{
                                                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                                        pre: ({ children }) => (
                                                            <pre className="bg-muted/50 p-3 rounded-lg overflow-x-auto my-2 text-sm">
                                                                {children}
                                                            </pre>
                                                        ),
                                                        code: ({ children }) => (
                                                            <code className="bg-muted/50 px-1.5 py-0.5 rounded text-sm">
                                                                {children}
                                                            </code>
                                                        ),
                                                        ul: ({ children }) => <ul className="list-disc pl-4 my-2">{children}</ul>,
                                                        ol: ({ children }) => <ol className="list-decimal pl-4 my-2">{children}</ol>,
                                                        li: ({ children }) => <li className="my-1">{children}</li>,
                                                        h1: ({ children }) => <h1 className="text-xl font-bold my-3">{children}</h1>,
                                                        h2: ({ children }) => <h2 className="text-lg font-bold my-2">{children}</h2>,
                                                        h3: ({ children }) => <h3 className="text-base font-bold my-2">{children}</h3>,
                                                        blockquote: ({ children }) => (
                                                            <blockquote className="border-l-4 border-muted-foreground/20 pl-4 my-2 italic">
                                                                {children}
                                                            </blockquote>
                                                        ),
                                                    }}
                                                >
                                                    {message.content}
                                                </Markdown>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>

                        {usage && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground my-2 px-1">
                                <Info className="h-3 w-3" />
                                <span>{usage.total_tokens} tokens used</span>
                            </div>
                        )}
                    </>
                )}

                <form onSubmit={handleSubmit} className="mt-6 flex gap-3 items-end">
                    <div className="relative flex-1">
                        <TextareaAutosize
                            minRows={1}
                            maxRows={4}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type your message..."
                            className="resize-none border w-full rounded-xl px-4 py-3 pr-12 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            disabled={isGenerating}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (inputValue.trim() && !isGenerating) {
                                        handleSubmit(e as any);
                                    }
                                }
                            }}
                        />
                        <Button
                            type={isGenerating ? "button" : "submit"}
                            size="icon"
                            className={cn(
                                "absolute right-2 top-2 h-8 w-8 rounded-lg transition-all",
                                isGenerating
                                    ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                            )}
                            onClick={isGenerating ? handleStop : undefined}
                            disabled={!inputValue.trim() && !isGenerating}
                        >
                            {isGenerating ? (
                                <Square className="h-4 w-4" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </form>
            </div>

            <div className="absolute top-4 right-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClear}
                    className="h-8 w-8 hover:bg-muted"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}


