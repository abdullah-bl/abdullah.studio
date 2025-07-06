import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ChatMessage, Usage, Progress } from "@/components/chat/types";

// Dynamic imports for heavy ML libraries
const loadMLCLibraries = async () => {
    const [{ CreateWebWorkerMLCEngine, MLCEngine, WebWorkerMLCEngine }] = await Promise.all([
        import("@mlc-ai/web-llm")
    ]);
    return { CreateWebWorkerMLCEngine, MLCEngine, WebWorkerMLCEngine };
};

interface ChatStore {
    // State
    systemPrompt: string;
    messages: ChatMessage[];
    input: string;
    isGenerating: boolean;
    isReady: boolean;
    isWebGPU: boolean;
    engine: any;
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    stopSequences: string[];
    seed: number;
    logprobs: number;
    modelList: { name: string, value: string }[];
    progress: Progress;
    usage: Usage | null;
    abortController: AbortController | null;
    gpuVendor: string | null;
    // Actions
    setInput: (input: string) => void;
    setMessages: (messages: ChatMessage[]) => void;
    addMessage: (message: ChatMessage) => void;
    updateLastMessage: (content: string) => void;
    clearMessages: () => void;
    setProgress: (progress: Progress) => void;
    setUsage: (usage: Usage | null) => void;
    setIsGenerating: (isGenerating: boolean) => void;
    setIsReady: (isReady: boolean) => void;
    setIsWebGPU: (isWebGPU: boolean) => void;
    setEngine: (engine: any) => void;
    setAbortController: (controller: AbortController | null) => void;
    setModelList: (modelList: { name: string, value: string }[]) => void;
    setTemperature: (temperature: number) => void;
    setMaxTokens: (maxTokens: number) => void;
    setTopP: (topP: number) => void;
    setFrequencyPenalty: (frequencyPenalty: number) => void;
    setPresencePenalty: (presencePenalty: number) => void;
    setStopSequences: (stopSequences: string[]) => void;
    setSeed: (seed: number) => void;
    setLogprobs: (logprobs: number) => void;
    setSystemPrompt: (systemPrompt: string) => void;
    setModel: (model: string) => void;

    // Complex actions
    handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    handleSubmit: () => Promise<void>;
    handleStop: () => void;
    handleClear: () => void;
    loadEngine: () => Promise<void>;
    checkWebGPU: () => void;
}

export const useChatStore = create<ChatStore>()(persist((set, get) => ({
    // Initial state
    messages: [{ role: "system", content: "You are an intelligent and knowledgeable AI assistant. You provide accurate, helpful, and well-reasoned responses while being direct and concise. You're capable of engaging in technical discussions and explaining complex topics clearly. When appropriate, you break down information into digestible parts. If you're unsure about something, you acknowledge it openly. You aim to be both professional and personable in your interactions." }],
    input: "",
    isGenerating: false,
    isReady: false,
    isWebGPU: false,
    engine: null,
    model: "SmolLM2-360M-Instruct-q0f32-MLC",
    progress: { progress: 0, text: "", timeElapsed: 0 },
    usage: null,
    abortController: null,
    modelList: [],
    temperature: 0.7,
    maxTokens: 1000,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    stopSequences: [],
    seed: 42,
    logprobs: 0,
    systemPrompt: ".",
    gpuVendor: null,

    // Basic setters
    setInput: (input) => set({ input }),
    setMessages: (messages) => set({ messages }),
    addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
    updateLastMessage: (content) => set((state) => ({
        messages: state.messages.length > 0
            ? [...state.messages.slice(0, -1), { ...state.messages[state.messages.length - 1], content }]
            : state.messages
    })),
    clearMessages: () => set({ messages: [{ role: "system", content: "You are an intelligent and knowledgeable AI assistant. You provide accurate, helpful, and well-reasoned responses while being direct and concise. You're capable of engaging in technical discussions and explaining complex topics clearly. When appropriate, you break down information into digestible parts. If you're unsure about something, you acknowledge it openly. You aim to be both professional and personable in your interactions." }], usage: null }),
    setProgress: (progress) => set({ progress }),
    setUsage: (usage) => set({ usage }),
    setIsGenerating: (isGenerating) => set({ isGenerating }),
    setIsReady: (isReady) => set({ isReady }),
    setIsWebGPU: (isWebGPU) => set({ isWebGPU }),
    setEngine: (engine) => set({ engine }),
    setAbortController: (abortController) => set({ abortController }),
    setModelList: (modelList) => set({ modelList }),
    setTemperature: (temperature) => set({ temperature }),
    setMaxTokens: (maxTokens) => set({ maxTokens }),
    setTopP: (topP) => set({ topP }),
    setFrequencyPenalty: (frequencyPenalty) => set({ frequencyPenalty }),
    setPresencePenalty: (presencePenalty) => set({ presencePenalty }),
    setStopSequences: (stopSequences) => set({ stopSequences }),
    setSeed: (seed) => set({ seed }),
    setLogprobs: (logprobs) => set({ logprobs }),
    setSystemPrompt: (systemPrompt) => set({ systemPrompt }),
    setModel: (model) => {
        set({ model, isReady: false, engine: null });
        // Reload engine with new model
        const { loadEngine } = get();
        loadEngine();
    },

    // Complex actions
    handleInputChange: (e) => set({ input: e.target.value }),

    handleSubmit: async () => {
        const {
            input,
            isGenerating,
            engine,
            messages,
            systemPrompt,
            temperature,
            maxTokens,
            topP,
            frequencyPenalty,
            presencePenalty,
            stopSequences,
            seed,
            logprobs
        } = get();
        if (!input.trim() || isGenerating || !engine) return;

        const message = input.trim();
        set({ input: "" });

        // Create messages with system prompt
        const systemMessage = { role: "system" as const, content: systemPrompt };
        const userMessage = { role: "user" as const, content: message };
        const updatedMessages: ChatMessage[] = [systemMessage, ...messages.filter(m => m.role !== "system"), userMessage];
        set({ messages: updatedMessages, isGenerating: true });

        const abortController = new AbortController();
        set({ abortController });

        try {
            const reply = await engine?.chat.completions.create({
                messages: updatedMessages.map((message) => ({
                    role: message.role,
                    content: message.content
                })),
                stream: true,
                stream_options: { include_usage: true },
                temperature,
                max_tokens: maxTokens,
                top_p: topP,
                frequency_penalty: frequencyPenalty,
                presence_penalty: presencePenalty,
                stop: stopSequences.length > 0 ? stopSequences : undefined,
                seed,
                logprobs: logprobs > 0 ? logprobs : undefined,
            });

            let assistantMessage: ChatMessage = { role: "assistant", content: "" };
            set((state) => ({ messages: [...state.messages, assistantMessage] }));

            for await (const chunk of reply) {
                if (abortController.signal.aborted) {
                    break;
                }
                const content = chunk.choices?.[0]?.delta?.content;
                if (content) {
                    assistantMessage.content += content;
                    set((state) => ({
                        messages: [...state.messages.slice(0, -1), { ...assistantMessage }]
                    }));
                }
                if (chunk.usage) {
                    set({ usage: chunk.usage });
                }
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Generation stopped');
                set((state) => ({ messages: state.messages.slice(0, -1) }));
            } else {
                console.error('Error during generation:', error);
            }
        } finally {
            set({ isGenerating: false, abortController: null });
        }
    },

    handleStop: () => {
        const { abortController } = get();
        if (abortController) {
            abortController.abort();
            set({ isGenerating: false, abortController: null });
        }
    },

    handleClear: () => {
        const { systemPrompt } = get();
        set({
            messages: [{ role: "system", content: systemPrompt }],
            usage: null,
            input: ""
        });
    },

    loadEngine: async () => {
        try {
            const { CreateWebWorkerMLCEngine } = await loadMLCLibraries();
            const { model } = get();
            const engine = await CreateWebWorkerMLCEngine(
                new Worker(new URL("../scripts/workerMLC.ts", import.meta.url), { type: "module" }),
                model,
                {
                    initProgressCallback: (progress: any) => {
                        set({
                            progress: {
                                progress: progress.progress,
                                text: progress.text,
                                timeElapsed: progress.timeElapsed
                            }
                        });
                    },
                }
            );
            const gpuVendor = await engine.getGPUVendor();

            set({ engine, isReady: true, gpuVendor });
        } catch (error) {
            console.error("Failed to load MLC engine:", error);
        }
    },

    checkWebGPU: () => {
        // This will be implemented in the component since it needs to access window
        set({ isWebGPU: true });
    },
}), {
    name: "chat",
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
        messages: state.messages,
        input: state.input,
        model: state.model,
        systemPrompt: state.systemPrompt,
        temperature: state.temperature,
        maxTokens: state.maxTokens,
        topP: state.topP,
        frequencyPenalty: state.frequencyPenalty,
        presencePenalty: state.presencePenalty,
        stopSequences: state.stopSequences,
        seed: state.seed,
        logprobs: state.logprobs,
    }),
}));