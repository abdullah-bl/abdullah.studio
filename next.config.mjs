import createMDX from '@next/mdx'


/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        mdxRs: true, // For MDX support
    },
    webpack: (config) => {
        // Handle WebGPU types and other Node.js modules
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            path: false,
            os: false,
            "sharp$": false,
            "onnxruntime-node$": false,
        };
        return config;
    },
    // Handle static assets
    images: {
        unoptimized: true, // For static export compatibility
    },
    // Output static files for deployment
    output: 'export',
    trailingSlash: true,
    // Disable image optimization for static export
    images: {
        unoptimized: true,
    },
    // Configure `pageExtensions` to include markdown and MDX files
    pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
};

const withMDX = createMDX({
    extension: /\.(md|mdx)$/,
})


// Merge MDX config with Next.js config
export default withMDX(nextConfig)
