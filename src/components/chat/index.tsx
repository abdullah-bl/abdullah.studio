


import { useEffect } from "react";
import { useChatStore } from "@/stores/chat";
import { hasWebGPU } from "@/lib/utils";
import { ChatLoading } from "./loading";
import { ChatWelcome } from "./welcome";
import { ChatMessages } from "./messages";
import { ChatHeader } from "./header";
import { WebGPUError } from "./webgpu-error";
import { ChatInput } from "./input";

const suggestedQuestions = [
    "What's the weather like today?",
    "Help me plan a weekend trip",
    "Explain quantum computing simply",
    "Write a short poem about technology",
    "What are the best productivity tips?",
    "Tell me a random interesting fact",
];

export function Chat() {
    const {
        messages,
        isWebGPU,
        isReady,
        progress,
        usage,
        setInput,
        handleSubmit,
        handleClear,
        loadEngine,
        setIsWebGPU,
    } = useChatStore();

    useEffect(() => {
        if (hasWebGPU()) {
            setIsWebGPU(true);
            loadEngine();
        }
    }, [setIsWebGPU, loadEngine]);

    const handleQuestionClick = (question: string) => {
        setInput(question);
    };

    if (!isWebGPU) {
        return <WebGPUError />
    }

    return (
        <div className="w-screen h-screen flex flex-col overflow-hidden" >
            <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full overflow-scroll">
                <ChatHeader onClear={handleClear} />
                <div className="flex-1 flex flex-col p-4 min-h-0 overflow-scroll" >
                    {!isReady ? (
                        <ChatLoading progress={progress} />
                    ) : messages.length === 1 ? (
                        <ChatWelcome
                            suggestedQuestions={suggestedQuestions}
                            onQuestionClick={handleQuestionClick}
                        />
                    ) : (
                        <ChatMessages messages={messages} usage={usage} />
                    )}
                    <ChatInput />
                </div>
            </div>
        </div>
    );
} 