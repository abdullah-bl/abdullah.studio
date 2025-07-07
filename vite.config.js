import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        rollupOptions: {
            external: ['path', 'url', 'fs', 'crypto', 'stream', 'util'],
            output: {
                manualChunks: {
                    // Separate large ML libraries into their own chunks
                    'mlc-ai': ['@mlc-ai/web-llm'],
                    'kokoro-tts': ['kokoro-js'],
                    'browserai': ['@browserai/browserai'],
                    'transformers': ['@huggingface/transformers'],
                    // Separate UI libraries
                    'ui-components': ['@radix-ui/react-icons', '@radix-ui/react-label', '@radix-ui/react-scroll-area', '@radix-ui/react-slot'],
                    'lucide-icons': ['lucide-react'],
                    // Separate React and utilities
                    'react-vendor': ['react', 'react-dom'],
                    'utils': ['class-variance-authority', 'clsx', 'tailwind-merge', 'react-markdown', 'react-textarea-autosize'],
                },
            },
        },
        chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true, // Keep console logs for debugging
                drop_debugger: true,
            },
        },
    },
    optimizeDeps: {
        // Exclude large dependencies from pre-bundling
        exclude: ['@mlc-ai/web-llm', 'kokoro-js', '@browserai/browserai', '@huggingface/transformers'],
        // Include common dependencies for better caching
        include: ['react', 'react-dom', 'lucide-react'],
        // Handle CommonJS modules properly
        esbuildOptions: {
            mainFields: ['module', 'main'],
        },
    },
    ssr: {
        // Externalize Node.js modules for SSR
        external: ['path', 'url', 'fs', 'crypto', 'stream', 'util'],
    },
    define: {
        // Suppress eval warnings for bluebird
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
}); 