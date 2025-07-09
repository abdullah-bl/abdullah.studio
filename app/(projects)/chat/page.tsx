"use client"

import { useEffect, useState } from "react";
import { useChatStore } from "@/stores/chat";
import { hasWebGPU } from "@/lib/utils";
import { ChatLoading } from "@/components/chat/loading";
import { ChatWelcome } from "@/components/chat/welcome";
import { ChatMessages } from "@/components/chat/messages";
import { ChatInput } from "@/components/chat/input";
import { ChatHeader } from "@/components/chat/header";
import { WebGPUError } from "@/components/chat/webgpu-error";
import { Settings } from "lucide-react";

export default function Chat() {
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

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
        <main className="flex-1 w-full max-w-2xl h-full mx-auto py-1.5 flex flex-col gap-10 overflow-hidden">
            {/* Chat Header */}
            <ChatHeader onClear={handleClear} />

            {/* Chat Content */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden w-full max-h-[calc(100vh-280px)]">
                {!isReady ? (
                    <ChatLoading progress={progress} />
                ) : messages.length === 1 ? (
                    <ChatWelcome
                        suggestedQuestions={[]}
                        onQuestionClick={handleQuestionClick}
                    />
                ) : (
                    <ChatMessages messages={messages} usage={usage} />
                )}
            </div>

            {/* Chat Input */}
            <ChatInput />
        </main>
    );
}

