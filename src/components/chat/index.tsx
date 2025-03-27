import { CreateWebWorkerMLCEngine, MLCEngine, WebWorkerMLCEngine } from "@mlc-ai/web-llm";
import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Loader2, Send, Square, Info, X } from "lucide-react";
import { Textarea } from "../ui/textarea";
import Markdown from "react-markdown";
import { cn } from "@/lib/utils";
import TextareaAutosize from 'react-textarea-autosize';

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
    "Generate Summary",
    "Are they a good fit for my job post?",
    "What is their training style?",
];

export function Chat() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: "system", content: "You are a helpful assistant." }
    ]);
    const [engine, setEngine] = useState<WebWorkerMLCEngine | null>(null);
    const [model, setModel] = useState<string>("SmolLM2-360M-Instruct-q0f32-MLC");
    const [isReady, setIsReady] = useState<boolean>(false);
    const [progress, setProgress] = useState<{ progress: number, text: string, timeElapsed: number }>({ progress: 0, text: "", timeElapsed: 0 });
    const [isGenerating, setIsGenerating] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [usage, setUsage] = useState<Usage | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        loadEngine();
    }, []);

    const loadEngine = async () => {
        const engine = await CreateWebWorkerMLCEngine(
            new Worker(new URL("../../scripts/chat-worker.ts", import.meta.url), { type: "module" }),
            model,
            {
                initProgressCallback: (progress) => {
                    setProgress({ progress: progress.progress, text: progress.text, timeElapsed: progress.timeElapsed });
                },
            }
        );
        setEngine(engine);
        setIsReady(true);
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

    return (
        <div className="relative flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/20">
            <div className="absolute top-4 right-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClear}
                    className="hover:bg-destructive/10 hover:text-destructive"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-4">
                {!isReady ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                        <div className="relative w-24 h-24">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 blur-lg opacity-50" />
                            <div className="relative w-full h-full rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center">
                                <Loader2 className="h-12 w-12 text-white animate-spin" />
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-lg font-medium">Loading model...</p>
                            <p className="text-sm text-muted-foreground">{progress.text}</p>
                            <p className="text-sm text-muted-foreground">{Math.round(progress.progress * 100)}%</p>
                        </div>
                    </div>
                ) : messages.length === 1 ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                        <div className="relative w-24 h-24">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 blur-lg opacity-50" />
                            <div className="relative w-full h-full rounded-full bg-gradient-to-tr from-green-500 to-emerald-400" />
                        </div>
                        <h1 className="text-2xl font-medium text-center">What would you like to know?</h1>
                        <div className="w-full max-w-md space-y-2">
                            {suggestedQuestions.map((question, index) => (
                                <Button
                                    key={index}
                                    variant="outline"
                                    className="w-full justify-start text-left h-auto p-4 hover:bg-muted/50"
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
                            <div className="space-y-4 py-4">
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
                                                "max-w-[80%] rounded-2xl p-4",
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
                                                            <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto my-2">
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
                                                        h1: ({ children }) => <h1 className="text-2xl font-bold my-4">{children}</h1>,
                                                        h2: ({ children }) => <h2 className="text-xl font-bold my-3">{children}</h2>,
                                                        h3: ({ children }) => <h3 className="text-lg font-bold my-2">{children}</h3>,
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
                            <div className="flex items-center gap-2 text-sm text-muted-foreground my-2">
                                <Info className="h-4 w-4" />
                                <span>Tokens: {usage.total_tokens} (prompt: {usage.prompt_tokens}, completion: {usage.completion_tokens})</span>
                            </div>
                        )}
                    </>
                )}

                <form onSubmit={handleSubmit} className="mt-4 flex gap-2 items-end">
                    <div className="relative flex-1">
                        <TextareaAutosize
                            minRows={2}
                            maxRows={5}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask me anything..."
                            className="resize-none border w-full rounded-lg border-blue-500/20  px-4 py-3 pr-12"
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
                                "absolute right-2 top-2 h-10 w-10 rounded-lg transition-colors",
                                isGenerating ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
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
        </div>
    );
}


