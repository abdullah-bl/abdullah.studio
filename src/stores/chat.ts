import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ChatMessage, Usage, Progress, ToolCall } from "@/components/chat/types";
import { findTool, getToolSchemas } from "@/lib/tools";

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
    enableTools: boolean;
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
    setEnableTools: (enableTools: boolean) => void;

    // Complex actions
    handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    handleSubmit: () => Promise<void>;
    handleStop: () => void;
    handleClear: () => void;
    loadEngine: () => Promise<void>;
    checkWebGPU: () => void;
    executeToolCall: (toolCall: ToolCall) => Promise<any>;
    processToolCalls: (content: string) => Promise<string>;
}

// Helper function to detect when tools should be used but weren't called
const detectFallbackTool = (content: string): { name: string; args: string } | null => {
    console.log("detectFallbackTool called with:", content);
    const lowerContent = content.toLowerCase();

    // Check for weather queries FIRST (before time queries)
    if (lowerContent.includes('weather') || lowerContent.includes('temperature')) {
        console.log("Weather query detected");
        // Try to extract a location
        const locationMatch = content.match(/in\s+([A-Za-z\s]+)/i);
        if (locationMatch) {
            console.log("Location found with 'in':", locationMatch[1].trim());
            return { name: 'get_weather', args: JSON.stringify({ location: locationMatch[1].trim() }) };
        }
        // Also check for "weather of" pattern
        const weatherOfMatch = content.match(/weather\s+of\s+([A-Za-z\s]+)/i);
        if (weatherOfMatch) {
            console.log("Location found with 'weather of':", weatherOfMatch[1].trim());
            return { name: 'get_weather', args: JSON.stringify({ location: weatherOfMatch[1].trim() }) };
        }
        console.log("Weather query detected but no location found");
    }

    // Check for time-related queries
    if (lowerContent.includes('time') || lowerContent.includes('what time') || lowerContent.includes('current time')) {
        console.log("Time query detected");
        return { name: 'get_current_time', args: '{}' };
    }

    // Check for calculation queries
    if (lowerContent.includes('calculate') || lowerContent.includes('math') || lowerContent.includes('+') || lowerContent.includes('*') || lowerContent.includes('-') || lowerContent.includes('/')) {
        console.log("Calculation query detected");
        // Try to extract a mathematical expression
        const mathMatch = content.match(/(\d+\s*[\+\-\*\/]\s*\d+)/);
        if (mathMatch) {
            console.log("Math expression found:", mathMatch[1]);
            return { name: 'calculate', args: JSON.stringify({ expression: mathMatch[1] }) };
        }
    }

    // Check for search queries
    if (lowerContent.includes('search') || lowerContent.includes('find') || lowerContent.includes('look up')) {
        console.log("Search query detected");
        // Try to extract a search query
        const searchMatch = content.match(/for\s+(.+)/i);
        if (searchMatch) {
            console.log("Search query found:", searchMatch[1].trim());
            return { name: 'search_web', args: JSON.stringify({ query: searchMatch[1].trim() }) };
        }
    }

    console.log("No fallback tool detected");
    return null;
};

// Helper function to format tool results in a user-friendly way
const formatToolResult = (toolName: string, result: any): string => {
    switch (toolName) {
        case 'get_current_time':
            return `The current time is ${result.formatted}.`;
        case 'calculate':
            if (result.error) {
                return `Calculation error: ${result.error}`;
            }
            return `The result of ${result.expression} is ${result.result}.`;
        case 'get_weather':
            if (result.note) {
                return `Weather in ${result.location}: ${result.temperature}, ${result.condition}, Humidity: ${result.humidity}. (${result.note})`;
            }
            return `Weather in ${result.location}: ${result.temperature}, ${result.condition}, Humidity: ${result.humidity}.`;
        case 'search_web':
            if (result.results && result.results.length > 0) {
                const firstResult = result.results[0];
                return `Search results for "${result.query}": ${firstResult.snippet} (${result.note})`;
            }
            return `Search results for "${result.query}": ${result.note}`;
        default:
            return `Tool result: ${JSON.stringify(result)}`;
    }
};

// Helper function to parse tool calls from AI response
const parseToolCalls = (content: string): ToolCall[] => {
    console.log("parseToolCalls called with:", content);
    const toolCalls: ToolCall[] = [];

    // Look for function call patterns like: <function>get_current_time</function>
    const functionCallRegex = /<function>([^<]+)<\/function>/g;
    let match;

    while ((match = functionCallRegex.exec(content)) !== null) {
        console.log("Found function call:", match[1]);
        const functionName = match[1];

        // Look for arguments in the next few lines
        const afterCall = content.substring(match.index + match[0].length);
        const lines = afterCall.split('\n');
        let args = '{}';

        for (let i = 0; i < Math.min(5, lines.length); i++) {
            const line = lines[i].trim();
            if (line.startsWith('{') && line.includes('}')) {
                args = line;
                break;
            }
        }

        console.log("Parsed args:", args);

        toolCalls.push({
            id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: "function",
            function: {
                name: functionName,
                arguments: args
            }
        });
    }

    console.log("Final tool calls:", toolCalls);
    return toolCalls;
};

export const useChatStore = create<ChatStore>()(persist((set, get) => ({
    // Initial state
    messages: [{ role: "system", content: "You are an intelligent AI assistant with access to tools. CRITICAL RULES:\n1. NEVER say you can't provide information about time, weather, calculations, or current data\n2. ALWAYS use tools when asked about these topics\n3. Format tool calls EXACTLY like this:\n<function>tool_name</function>\n{arguments as JSON}\n\nAvailable tools:\n- get_current_time: Get current date/time (no arguments needed)\n- calculate: Perform math calculations (use expression parameter)\n- search_web: Search for information (use query parameter)\n- get_weather: Get weather info (use location parameter)\n\nExample: User asks 'What's the weather in Tokyo?' → Use get_weather tool with location 'Tokyo'" }],
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
    systemPrompt: "You are an intelligent AI assistant with access to tools. CRITICAL RULES:\n1. NEVER say you can't provide information about time, weather, calculations, or current data\n2. ALWAYS use tools when asked about these topics\n3. Format tool calls EXACTLY like this:\n<function>tool_name</function>\n{arguments as JSON}\n\nAvailable tools:\n- get_current_time: Get current date/time (no arguments needed)\n- calculate: Perform math calculations (use expression parameter)\n- search_web: Search for information (use query parameter)\n- get_weather: Get weather info (use location parameter)\n\nExample: User asks 'What's the weather in Tokyo?' → Use get_weather tool with location 'Tokyo'",
    gpuVendor: null,
    enableTools: false,

    // Basic setters
    setInput: (input) => set({ input }),
    setMessages: (messages) => set({ messages }),
    addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
    updateLastMessage: (content) => set((state) => ({
        messages: state.messages.length > 0
            ? [...state.messages.slice(0, -1), { ...state.messages[state.messages.length - 1], content }]
            : state.messages
    })),
    clearMessages: () => set({ messages: [{ role: "system", content: "You are an intelligent AI assistant with access to tools. CRITICAL RULES:\n1. NEVER say you can't provide information about time, weather, calculations, or current data\n2. ALWAYS use tools when asked about these topics\n3. Format tool calls EXACTLY like this:\n<function>tool_name</function>\n{arguments as JSON}\n\nAvailable tools:\n- get_current_time: Get current date/time (no arguments needed)\n- calculate: Perform math calculations (use expression parameter)\n- search_web: Search for information (use query parameter)\n- get_weather: Get weather info (use location parameter)\n\nExample: User asks 'What's the weather in Tokyo?' → Use get_weather tool with location 'Tokyo'" }], usage: null }),
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
    setEnableTools: (enableTools) => set({ enableTools }),

    // Tool execution
    executeToolCall: async (toolCall: ToolCall) => {
        try {
            const tool = findTool(toolCall.function.name);
            if (!tool) {
                return { error: `Tool ${toolCall.function.name} not found` };
            }

            let args = {};
            try {
                args = JSON.parse(toolCall.function.arguments);
            } catch (e) {
                return { error: `Invalid arguments: ${toolCall.function.arguments}` };
            }

            const result = await tool.execute(args);
            return result;
        } catch (error) {
            return { error: `Tool execution failed: ${error}` };
        }
    },

    processToolCalls: async (content: string) => {
        const { enableTools } = get();
        console.log("processToolCalls called with content:", content);
        console.log("enableTools:", enableTools);

        if (!enableTools) return content;

        const toolCalls = parseToolCalls(content);
        console.log("Parsed tool calls:", toolCalls);

        // Fallback: if no tool calls found but content suggests tools should be used
        if (toolCalls.length === 0) {
            const fallbackTool = detectFallbackTool(content);
            if (fallbackTool) {
                console.log("Using fallback tool:", fallbackTool);
                const { executeToolCall, addMessage } = get();

                // Create a tool call
                const toolCall: ToolCall = {
                    id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: "function",
                    function: {
                        name: fallbackTool.name,
                        arguments: fallbackTool.args
                    }
                };

                // Add tool call message
                addMessage({
                    role: "assistant",
                    content: `Calling ${toolCall.function.name}...`,
                    tool_calls: [toolCall]
                });

                // Execute the tool
                const result = await executeToolCall(toolCall);
                console.log("Fallback tool result:", result);

                // Add tool result message
                addMessage({
                    role: "tool",
                    content: JSON.stringify(result, null, 2),
                    tool_call_id: toolCall.id
                });

                // Return content with tool result
                const formattedResult = formatToolResult(toolCall.function.name, result);
                return `${content}\n\n${formattedResult}`;
            }
        }

        if (toolCalls.length === 0) return content;

        let processedContent = content;
        const { executeToolCall, addMessage } = get();

        for (const toolCall of toolCalls) {
            console.log("Executing tool call:", toolCall);

            // Add tool call message
            addMessage({
                role: "assistant",
                content: `Calling ${toolCall.function.name}...`,
                tool_calls: [toolCall]
            });

            // Execute the tool
            const result = await executeToolCall(toolCall);
            console.log("Tool result:", result);

            // Add tool result message
            addMessage({
                role: "tool",
                content: JSON.stringify(result, null, 2),
                tool_call_id: toolCall.id
            });

            // Replace the function call in content with result
            const functionCallText = `<function>${toolCall.function.name}</function>\n${toolCall.function.arguments}`;
            const formattedResult = formatToolResult(toolCall.function.name, result);
            processedContent = processedContent.replace(
                functionCallText,
                formattedResult
            );
        }

        return processedContent;
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
            logprobs,
            enableTools
        } = get();
        if (!input.trim() || isGenerating || !engine) return;

        const message = input.trim();
        set({ input: "" });

        // Create messages with system prompt
        const systemMessage = { role: "system" as const, content: systemPrompt };
        const userMessage = { role: "user" as const, content: message };
        const updatedMessages: ChatMessage[] = [systemMessage, ...messages.filter(m => m.role !== "system" && m.role !== "tool"), userMessage];
        set({ messages: updatedMessages, isGenerating: true });

        const abortController = new AbortController();
        set({ abortController });

        try {
            const reply = await engine?.chat.completions.create({
                messages: updatedMessages
                    .filter(message => message.role !== "tool") // Filter out tool messages
                    .map((message) => ({
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

            // Process tool calls if tools are enabled
            if (enableTools && assistantMessage.content) {
                console.log("About to process tool calls for content:", assistantMessage.content);
                const { processToolCalls } = get();
                const processedContent = await processToolCalls(assistantMessage.content);
                console.log("Processed content:", processedContent);

                // If tools were used, update the message with the actual tool results
                if (processedContent !== assistantMessage.content) {
                    // Update the message with processed content that includes tool results
                    set((state) => ({
                        messages: state.messages.map((msg, index) =>
                            index === state.messages.length - 1
                                ? { ...msg, content: processedContent }
                                : msg
                        )
                    }));
                }
            } else {
                console.log("Tool processing skipped - enableTools:", enableTools, "content length:", assistantMessage.content?.length);
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
        enableTools: state.enableTools,
    }),
}));