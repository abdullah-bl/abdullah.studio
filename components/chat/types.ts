export type ChatMessage = {
    role: "user" | "assistant" | "system" | "tool"
    content: string;
    tool_calls?: ToolCall[];
    tool_call_id?: string;
}

export type ToolCall = {
    id: string;
    type: "function";
    function: {
        name: string;
        arguments: string;
    };
}

export type Tool = {
    name: string;
    description: string;
    parameters: {
        type: "object";
        properties: Record<string, any>;
        required: string[];
    };
    execute: (args: any) => Promise<any>;
}

export type Usage = {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

export type Progress = {
    progress: number;
    text: string;
    timeElapsed: number;
} 