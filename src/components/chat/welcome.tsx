import { Button } from "../ui/button";
import { Sparkles } from "@/lib/icons";

interface WelcomeProps {
    suggestedQuestions: string[];
    onQuestionClick: (question: string) => void;
}

export function ChatWelcome({ suggestedQuestions, onQuestionClick }: WelcomeProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
            <div className="text-center space-y-4">
                <div className="mx-auto flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold">How can I help you today?</h1>
                    <p className="text-muted-foreground">Ask me anything or try one of these suggestions</p>
                    <p className="text-muted-foreground">
                        Private by default. No data is stored.
                    </p>
                </div>
            </div>
            <div className="w-full max-w-2xl space-y-2">
                {suggestedQuestions.map((question, index) => (
                    <Button
                        key={index}
                        variant="ghost"
                        className=""
                        onClick={() => onQuestionClick(question)}
                    >
                        {question}
                    </Button>
                ))}
            </div>
        </div>
    );
} 