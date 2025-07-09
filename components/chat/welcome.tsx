import { Button } from "../ui/button";

interface WelcomeProps {
    suggestedQuestions: string[];
    onQuestionClick: (question: string) => void;
}

export function ChatWelcome({ suggestedQuestions, onQuestionClick }: WelcomeProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-center space-y-4 max-w-md">
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">How can I help you today?</h2>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm">Ask me anything. Private by default, no data is stored.</p>
                </div>
            </div>
            {suggestedQuestions.length > 0 && (
                <div className="w-full max-w-md space-y-2 mt-6">
                    {suggestedQuestions.map((question, index) => (
                        <Button
                            key={index}
                            variant="outline"
                            className="w-full justify-start text-left text-sm border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
                            onClick={() => onQuestionClick(question)}
                        >
                            {question}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
} 