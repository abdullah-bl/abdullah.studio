import { X } from "@/lib/icons";

export function WebGPUError() {
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