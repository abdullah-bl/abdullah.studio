export type ChatMessage = {
    role: "user" | "assistant" | "system"
    content: string;
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