import type { Tool } from "@/components/chat/types";

// Simple tools registry
export const tools: Tool[] = [
    {
        name: "get_current_time",
        description: "Get the current date and time",
        parameters: {
            type: "object",
            properties: {},
            required: []
        },
        execute: async () => {
            return {
                current_time: new Date().toISOString(),
                formatted: new Date().toLocaleString()
            };
        }
    },
    {
        name: "calculate",
        description: "Perform basic mathematical calculations",
        parameters: {
            type: "object",
            properties: {
                expression: {
                    type: "string",
                    description: "The mathematical expression to evaluate (e.g., '2 + 2', '10 * 5')"
                }
            },
            required: ["expression"]
        },
        execute: async (args: { expression: string }) => {
            try {
                // Safe evaluation - only allow basic math operations
                const sanitized = args.expression.replace(/[^0-9+\-*/().\s]/g, '');
                const result = eval(sanitized);
                return {
                    expression: args.expression,
                    result: result,
                    sanitized_expression: sanitized
                };
            } catch (error) {
                return {
                    error: "Invalid mathematical expression",
                    expression: args.expression
                };
            }
        }
    },
    {
        name: "search_web",
        description: "Search the web for current information (simulated)",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "The search query"
                }
            },
            required: ["query"]
        },
        execute: async (args: { query: string }) => {
            // Simulated web search - in a real app, you'd integrate with a search API
            return {
                query: args.query,
                results: [
                    {
                        title: `Search results for: ${args.query}`,
                        snippet: `This is a simulated search result for "${args.query}". In a real implementation, this would connect to a search API like Google, Bing, or DuckDuckGo.`,
                        url: `https://example.com/search?q=${encodeURIComponent(args.query)}`
                    }
                ],
                note: "This is a simulated search. For real web search, integrate with a search API."
            };
        }
    },
    {
        name: "get_weather",
        description: "Get current weather information (simulated)",
        parameters: {
            type: "object",
            properties: {
                location: {
                    type: "string",
                    description: "City name or location"
                }
            },
            required: ["location"]
        },
        execute: async (args: { location: string }) => {
            // Simulated weather data
            const conditions = ["Sunny", "Cloudy", "Rainy", "Snowy", "Partly Cloudy"];
            const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
            const randomTemp = Math.floor(Math.random() * 30) + 10; // 10-40°C

            return {
                location: args.location,
                temperature: `${randomTemp}°C`,
                condition: randomCondition,
                humidity: `${Math.floor(Math.random() * 40) + 40}%`,
                note: "This is simulated weather data. For real weather, integrate with a weather API."
            };
        }
    }
];

// Function to find a tool by name
export const findTool = (name: string): Tool | undefined => {
    return tools.find(tool => tool.name === name);
};

// Function to get tool schemas for the AI
export const getToolSchemas = () => {
    return tools.map(tool => ({
        type: "function" as const,
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
        }
    }));
};

// Test function to verify tool parsing
export const testToolParsing = () => {
    const testContent = `Let me get the current time for you.

<function>get_current_time</function>
{}

The current time is shown above.`;

    console.log("Testing tool parsing with:", testContent);

    // Simple regex test
    const functionCallRegex = /<function>([^<]+)<\/function>/g;
    let match;

    while ((match = functionCallRegex.exec(testContent)) !== null) {
        console.log("Found function call:", match[1]);
    }
};

// Test fallback tool detection
export const testFallbackDetection = () => {
    const testCases = [
        "What time is it?",
        "Calculate 2 + 2",
        "What's the weather in Tokyo?",
        "Search for AI news"
    ];

    testCases.forEach(testCase => {
        const lowerContent = testCase.toLowerCase();
        let detectedTool = null;

        if (lowerContent.includes('time') || lowerContent.includes('what time') || lowerContent.includes('current time')) {
            detectedTool = { name: 'get_current_time', args: '{}' };
        } else if (lowerContent.includes('calculate') || lowerContent.includes('math') || lowerContent.includes('+') || lowerContent.includes('*') || lowerContent.includes('-') || lowerContent.includes('/')) {
            const mathMatch = testCase.match(/(\d+\s*[\+\-\*\/]\s*\d+)/);
            if (mathMatch) {
                detectedTool = { name: 'calculate', args: JSON.stringify({ expression: mathMatch[1] }) };
            }
        } else if (lowerContent.includes('weather') || lowerContent.includes('temperature')) {
            const locationMatch = testCase.match(/in\s+([A-Za-z\s]+)/i);
            if (locationMatch) {
                detectedTool = { name: 'get_weather', args: JSON.stringify({ location: locationMatch[1].trim() }) };
            }
        } else if (lowerContent.includes('search') || lowerContent.includes('find') || lowerContent.includes('look up')) {
            const searchMatch = testCase.match(/for\s+(.+)/i);
            if (searchMatch) {
                detectedTool = { name: 'search_web', args: JSON.stringify({ query: searchMatch[1].trim() }) };
            }
        }

        console.log(`Test case: "${testCase}" -> Detected tool:`, detectedTool);
    });
};